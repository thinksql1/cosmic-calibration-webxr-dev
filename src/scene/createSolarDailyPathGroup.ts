import * as THREE from 'three';
import type { SolarDailyPathPresentationModel } from '../presentation/solarDailyPathPresentationModel';
import {
  createSolarDailyPathCameraRelativeFrame,
  type SolarDailyPathCameraRelativeFrame,
} from './solarDailyPathCameraRelativeFrame';

export const MAX_SOLAR_DAILY_PATH_SAMPLES = 768;
export const MAX_SOLAR_DAILY_HOUR_NOTCHES = 32;
const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.996;

const pathVertexShader = /* glsl */ `
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

const notchVertexShader = /* glsl */ `
  attribute float aOpacity;
  attribute float aPointSize;
  uniform float uDrawEnabled;
  varying float vOpacity;
  void main() {
    if (uDrawEnabled < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vOpacity = 0.0;
      return;
    }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
    gl_PointSize = aPointSize;
    vOpacity = aOpacity;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;
  void main() { gl_FragColor = vec4(uColor, vOpacity); }
`;
const notchFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;
  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    if (dot(centered, centered) > 0.25) discard;
    gl_FragColor = vec4(uColor, vOpacity);
  }
`;

function lineMaterial(color: number, points = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: points ? notchVertexShader : pathVertexShader,
    fragmentShader: points ? notchFragmentShader : fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDrawEnabled: { value: 0 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function finiteMatrix(matrix: THREE.Matrix4): boolean {
  return matrix.elements.every(Number.isFinite);
}

function eyeName(camera: THREE.Camera): 'left' | 'right' | 'mono' {
  const mask = camera.layers.mask >>> 0;
  if ((mask & (1 << 1)) !== 0 && (mask & (1 << 2)) === 0) return 'left';
  if ((mask & (1 << 2)) !== 0 && (mask & (1 << 1)) === 0) return 'right';
  return 'mono';
}

export interface SolarDailyPathRendererDiagnostics {
  readonly readiness: 'ready' | 'not-ready' | 'disposed';
  readonly suppressionReason?: string;
  readonly callbackCount: number;
  readonly callbackExceptionCount: number;
  readonly completedEyes: readonly string[];
  readonly pathSampleCount: number;
  readonly notchCount: number;
  readonly geometryBuildCount: 1;
  readonly perEyeMutation: false;
}

export interface SolarDailyPathGroupHandle {
  readonly group: THREE.Group;
  update(model: SolarDailyPathPresentationModel): void;
  clear(reason?: string): void;
  enforceVisibilityControls(): void;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): SolarDailyPathCameraRelativeFrame | undefined;
  getDiagnostics(): SolarDailyPathRendererDiagnostics;
}

/** Owns one immutable-upload projective apparent-Sun path and exact civil-hour notches. */
export function createSolarDailyPathGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): SolarDailyPathGroupHandle {
  const group = new THREE.Group();
  group.name = 'observer-relative-apparent-sun-civil-day-path';
  group.visible = false;
  const pathGeometry = new THREE.BufferGeometry();
  const pathPositions = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_PATH_SAMPLES * 3, 3);
  const pathOpacity = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_PATH_SAMPLES, 1);
  pathGeometry.setAttribute('position', pathPositions);
  pathGeometry.setAttribute('aOpacity', pathOpacity);
  const pathMaterial = lineMaterial(0xf3b56a);
  const path = new THREE.Line(pathGeometry, pathMaterial);
  path.name = 'apparent-sun-civil-day-projective-path';
  path.frustumCulled = false;
  path.renderOrder = 23;

  const notchGeometry = new THREE.BufferGeometry();
  const notchPositions = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_HOUR_NOTCHES * 3, 3);
  const notchOpacity = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_HOUR_NOTCHES, 1);
  const notchSizes = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_HOUR_NOTCHES, 1);
  notchGeometry.setAttribute('position', notchPositions);
  notchGeometry.setAttribute('aOpacity', notchOpacity);
  notchGeometry.setAttribute('aPointSize', notchSizes);
  const notchMaterial = lineMaterial(0xffd18c, true);
  const notches = new THREE.Points(notchGeometry, notchMaterial);
  notches.name = 'apparent-sun-civil-hour-notches';
  notches.frustumCulled = false;
  notches.renderOrder = 25;
  group.add(path, notches);

  let currentModel: SolarDailyPathPresentationModel | undefined;
  let disposed = false;
  let suppressionReason: string | undefined = 'scientific state not ready';
  let callbackCount = 0;
  let callbackExceptionCount = 0;
  const completedEyes = new Set<string>();
  const modelViewScratch = new THREE.Matrix4();

  const guardedDraw = (
    object: THREE.Line | THREE.Points,
    material: THREE.ShaderMaterial,
  ) => (_renderer: THREE.WebGLRenderer, _scene: THREE.Scene, camera: THREE.Camera) => {
    try {
      callbackCount += 1;
      modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
      const ready = Boolean(
        !disposed &&
        currentModel &&
        finiteMatrix(camera.projectionMatrix) &&
        finiteMatrix(modelViewScratch),
      );
      material.uniforms.uDrawEnabled.value = ready ? 1 : 0;
      object.userData.lastDrawState = ready ? 'completed' : 'suppressed-scientific-state-not-ready';
      if (ready) {
        completedEyes.add(eyeName(camera));
      } else {
        suppressionReason ??= 'scientific state not ready';
        try {
          reportDiagnostic('sun-path.suppressed', `${object.name}|${suppressionReason}`);
        } catch { /* bounded diagnostic transport */ }
      }
    } catch (error) {
      material.uniforms.uDrawEnabled.value = 0;
      callbackExceptionCount += 1;
      suppressionReason = error instanceof Error ? error.message : String(error);
      try {
        reportDiagnostic('sun-path.callback-suppressed', `${object.name}|${suppressionReason}`);
      } catch { /* diagnostics cannot abort traversal */ }
    }
  };
  path.onBeforeRender = guardedDraw(path, pathMaterial);
  notches.onBeforeRender = guardedDraw(notches, notchMaterial);

  const enforce = (): void => {
    const ready = Boolean(currentModel && !disposed);
    path.visible = ready && currentModel!.pathVisible;
    notches.visible = ready && currentModel!.hourNotchesVisible;
    group.visible = ready && (path.visible || notches.visible);
    if (!ready) {
      pathMaterial.uniforms.uDrawEnabled.value = 0;
      notchMaterial.uniforms.uDrawEnabled.value = 0;
    }
  };

  return Object.freeze({
    group,
    update(model: SolarDailyPathPresentationModel): void {
      if (disposed) return;
      if (
        model.samples.length > MAX_SOLAR_DAILY_PATH_SAMPLES ||
        model.hourNotches.length > MAX_SOLAR_DAILY_HOUR_NOTCHES
      ) {
        this.clear('bounded geometry capacity exceeded');
        return;
      }
      currentModel = model;
      suppressionReason = undefined;
      completedEyes.clear();
      const pathOpacityValues = pathOpacity.array as Float32Array;
      model.samples.forEach((sample, index) => {
        pathPositions.setXYZ(
          index,
          Math.fround(sample.directionApplication.x),
          Math.fround(sample.directionApplication.y),
          Math.fround(sample.directionApplication.z),
        );
        pathOpacityValues[index] = sample.opacity;
      });
      const notchOpacityValues = notchOpacity.array as Float32Array;
      const notchSizeValues = notchSizes.array as Float32Array;
      model.hourNotches.forEach((notch, index) => {
        notchPositions.setXYZ(
          index,
          Math.fround(notch.directionApplication.x),
          Math.fround(notch.directionApplication.y),
          Math.fround(notch.directionApplication.z),
        );
        notchOpacityValues[index] = notch.opacity;
        notchSizeValues[index] = notch.pixelDiameter;
      });
      pathPositions.needsUpdate = true;
      pathOpacity.needsUpdate = true;
      notchPositions.needsUpdate = true;
      notchOpacity.needsUpdate = true;
      notchSizes.needsUpdate = true;
      pathGeometry.setDrawRange(0, model.samples.length);
      notchGeometry.setDrawRange(0, model.hourNotches.length);
      pathMaterial.uniforms.uDrawEnabled.value = 1;
      notchMaterial.uniforms.uDrawEnabled.value = 1;
      group.userData.pathCacheKey = model.snapshotIdentity.pathCacheKey;
      group.userData.timeZone = model.timeZone;
      group.userData.selectedCivilDate = model.selectedCivilDate;
      group.userData.currentHourNotchIndex = model.currentHourNotchIndex;
      group.userData.geometryBuildCount = 1;
      group.userData.perEyeMutation = false;
      enforce();
    },
    clear(reason = 'scientific state not ready'): void {
      if (disposed) return;
      currentModel = undefined;
      suppressionReason = reason;
      completedEyes.clear();
      enforce();
      group.userData.suppressionReason = reason;
    },
    enforceVisibilityControls(): void {
      enforce();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      currentModel = undefined;
      suppressionReason = 'disposed';
      path.onBeforeRender = () => undefined;
      notches.onBeforeRender = () => undefined;
      group.visible = false;
      group.removeFromParent();
      pathGeometry.dispose();
      notchGeometry.dispose();
      pathMaterial.dispose();
      notchMaterial.dispose();
      group.clear();
      group.userData.disposed = true;
    },
    createFrameForCamera(camera: THREE.Camera): SolarDailyPathCameraRelativeFrame | undefined {
      if (disposed || !currentModel) return undefined;
      group.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      try {
        return createSolarDailyPathCameraRelativeFrame(
          currentModel,
          group.matrixWorld,
          camera.matrixWorld,
        );
      } catch (error) {
        suppressionReason = error instanceof Error ? error.message : String(error);
        return undefined;
      }
    },
    getDiagnostics(): SolarDailyPathRendererDiagnostics {
      return Object.freeze({
        readiness: disposed ? 'disposed' : currentModel ? 'ready' : 'not-ready',
        suppressionReason,
        callbackCount,
        callbackExceptionCount,
        completedEyes: Object.freeze([...completedEyes]),
        pathSampleCount: currentModel?.samples.length ?? 0,
        notchCount: currentModel?.hourNotches.length ?? 0,
        geometryBuildCount: 1,
        perEyeMutation: false,
      });
    },
  });
}
