import * as THREE from 'three';
import type { MoonDailyPathPresentationModel } from '../presentation/moonDailyPathPresentationModel';
import { lunarSemanticPalette } from '../presentation/color/lunarColorPolicy';
import type { LunarPalette } from '../presentation/color/celestialColorModes';

export const MAX_MOON_DAILY_PATH_RENDER_SAMPLES = 1024;
const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.995;

const vertexShader = /* glsl */ `
  attribute float aOpacity;
  uniform float uDrawEnabled;
  varying float vOpacity;
  void main() {
    if (uDrawEnabled < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vOpacity = 0.0;
      return;
    }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
    vOpacity = aOpacity;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;
  void main() { gl_FragColor = vec4(uColor, vOpacity); }
`;

export interface MoonDailyPathRendererDiagnostics {
  readonly readiness: 'ready' | 'not-ready' | 'disposed';
  readonly suppressionReason?: string;
  readonly activeLineObjectCount: number;
  readonly callbackCount: number;
  readonly callbackExceptionCount: number;
  readonly completedEyes: readonly string[];
  readonly geometryBuildCount: 1;
  readonly orientationUpdateCount: number;
  readonly perEyeMutation: false;
  readonly colorToken: string;
  readonly geometryHash: string;
}

export interface MoonDailyPathGroupHandle {
  readonly group: THREE.Group;
  update(model: MoonDailyPathPresentationModel): void;
  clear(reason?: string): void;
  enforceVisibilityControls(): void;
  setLunarPalette(palette: LunarPalette): void;
  getDiagnostics(): MoonDailyPathRendererDiagnostics;
  dispose(): void;
}

export function createMoonDailyPathGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): MoonDailyPathGroupHandle {
  const group = new THREE.Group();
  group.name = 'observer-relative-apparent-moon-civil-day-path';
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(MAX_MOON_DAILY_PATH_RENDER_SAMPLES * 3, 3);
  const opacities = new THREE.Float32BufferAttribute(MAX_MOON_DAILY_PATH_RENDER_SAMPLES, 1);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('aOpacity', opacities);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(0xb9d6e8) },
      uDrawEnabled: { value: 0 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'apparent-moon-civil-day-projective-path';
  line.frustumCulled = false;
  line.renderOrder = 22;
  group.add(line);
  group.visible = false;
  line.visible = false;

  let model: MoonDailyPathPresentationModel | undefined;
  let disposed = false;
  let suppressionReason: string | undefined = 'scientific state not ready';
  let callbackCount = 0;
  let callbackExceptionCount = 0;
  let orientationUpdateCount = 0;
  let activePalette: LunarPalette = 'lunar-purple';
  const completedEyes = new Set<string>();
  const modelViewScratch = new THREE.Matrix4();

  line.onBeforeRender = (_renderer, _scene, camera) => {
    try {
      callbackCount += 1;
      modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, line.matrixWorld);
      const ready = Boolean(
        model &&
        !disposed &&
        camera.projectionMatrix.elements.every(Number.isFinite) &&
        modelViewScratch.elements.every(Number.isFinite),
      );
      material.uniforms.uDrawEnabled.value = ready ? 1 : 0;
      if (ready) {
        const mask = camera.layers.mask >>> 0;
        completedEyes.add(
          (mask & (1 << 1)) !== 0 && (mask & (1 << 2)) === 0
            ? 'left'
            : (mask & (1 << 2)) !== 0 && (mask & (1 << 1)) === 0
              ? 'right'
              : 'mono',
        );
      } else {
        suppressionReason ??= 'scientific state not ready';
      }
    } catch (error) {
      material.uniforms.uDrawEnabled.value = 0;
      callbackExceptionCount += 1;
      suppressionReason = error instanceof Error ? error.message : String(error);
      try {
        reportDiagnostic('moon-path.callback-suppressed', suppressionReason);
      } catch { /* diagnostics cannot abort traversal */ }
    }
  };

  const enforce = (): void => {
    const visible = Boolean(model && model.pathVisible && !disposed);
    group.visible = visible;
    line.visible = visible;
    if (!visible) material.uniforms.uDrawEnabled.value = 0;
  };

  return Object.freeze({
    group,
    update(nextModel: MoonDailyPathPresentationModel): void {
      if (disposed) return;
      if (nextModel.samples.length > MAX_MOON_DAILY_PATH_RENDER_SAMPLES) {
        this.clear('bounded geometry capacity exceeded');
        return;
      }
      model = nextModel;
      suppressionReason = undefined;
      completedEyes.clear();
      orientationUpdateCount += 1;
      const opacityValues = opacities.array as Float32Array;
      nextModel.samples.forEach((sample, index) => {
        positions.setXYZ(
          index,
          Math.fround(sample.directionApplication.x),
          Math.fround(sample.directionApplication.y),
          Math.fround(sample.directionApplication.z),
        );
        opacityValues[index] = sample.opacity;
      });
      positions.needsUpdate = true;
      opacities.needsUpdate = true;
      geometry.setDrawRange(0, nextModel.samples.length);
      material.uniforms.uDrawEnabled.value = 1;
      group.userData.cacheKey = nextModel.cacheKey;
      group.userData.perEyeMutation = false;
      group.userData.geometryBuildCount = 1;
      enforce();
    },
    clear(reason = 'scientific state not ready'): void {
      if (disposed) return;
      model = undefined;
      suppressionReason = reason;
      completedEyes.clear();
      enforce();
      group.userData.suppressionReason = reason;
    },
    enforceVisibilityControls(): void {
      enforce();
    },
    setLunarPalette(palette: LunarPalette): void {
      if (activePalette === palette) return;
      activePalette = palette;
      material.uniforms.uColor.value.setHex(lunarSemanticPalette(palette).dailyPath.hex);
      group.userData.colorToken = lunarSemanticPalette(palette).dailyPath.id;
    },
    getDiagnostics(): MoonDailyPathRendererDiagnostics {
      return Object.freeze({
        readiness: disposed ? 'disposed' : model ? 'ready' : 'not-ready',
        suppressionReason,
        activeLineObjectCount: line.visible ? 1 : 0,
        callbackCount,
        callbackExceptionCount,
        completedEyes: Object.freeze([...completedEyes]),
        geometryBuildCount: 1,
        orientationUpdateCount,
        perEyeMutation: false,
        colorToken: lunarSemanticPalette(activePalette).dailyPath.id,
        geometryHash: `${geometry.getAttribute('position').count}:${geometry.drawRange.count}`,
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      model = undefined;
      line.onBeforeRender = () => undefined;
      group.removeFromParent();
      geometry.dispose();
      material.dispose();
      group.clear();
    },
  });
}
