import * as THREE from 'three';
import type { EarthAxisPresentationModel } from '../presentation/earthAxisPresentationModel';
import type { EyePresentationMode } from '../presentation/eyePresentationMode';
import {
  createEarthAxisCameraRelativeFrame,
  type EarthAxisCameraRelativeFrame,
} from './earthAxisCameraRelativeFrame';
import {
  createEyePresentationLayerFilter,
  type EyePresentationDiagnostics,
  type XrViewIdentitySource,
} from './eyePresentationLayerFilter';

type PoleLabelTextureFactory = (text: 'NCP' | 'SCP', color: string) => THREE.Texture;

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.999;
const viewportScratch = new THREE.Vector4();

const projectiveLineVertexShader = /* glsl */ `
  uniform vec3 uCoreView;
  uniform vec3 uDirectionView;

  void main() {
    vec4 coreClip = projectionMatrix * vec4(uCoreView, 1.0);
    vec4 directionClip = projectionMatrix * vec4(uDirectionView, 0.0);
    vec4 clipPosition = mix(coreClip, directionClip, position.x);
    if (clipPosition.w > 0.0) {
      clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    }
    gl_Position = clipPosition;
  }
`;

const colorFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

const projectiveQuadVertexShader = /* glsl */ `
  uniform vec3 uViewVector;
  uniform float uProjectiveW;
  uniform vec2 uViewportPixels;
  uniform vec2 uSizePixels;
  uniform vec2 uOffsetPixels;
  varying vec2 vUv;

  void main() {
    vec4 clipPosition = projectionMatrix * vec4(uViewVector, uProjectiveW);
    vec2 pixelOffset = position.xy * uSizePixels + uOffsetPixels;
    clipPosition.xy += pixelOffset * (2.0 / uViewportPixels) * clipPosition.w;
    if (clipPosition.w > 0.0) {
      clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    }
    gl_Position = clipPosition;
    vUv = uv;
  }
`;

const markerFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - vec2(0.5);
    if (dot(centered, centered) > 0.25) discard;
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

const labelFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec4 sampled = texture2D(uMap, vUv);
    gl_FragColor = vec4(sampled.rgb, sampled.a * uOpacity);
  }
`;

function overlayMaterial(parameters: {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, THREE.IUniform>;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...parameters,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function createLine(color: number): THREE.Line<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const geometry = new THREE.BufferGeometry();
  // These are homogeneous interpolation coefficients, never world positions.
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
  ], 3));
  const line = new THREE.Line(
    geometry,
    overlayMaterial({
      vertexShader: projectiveLineVertexShader,
      fragmentShader: colorFragmentShader,
      uniforms: {
        uCoreView: { value: new THREE.Vector3() },
        uDirectionView: { value: new THREE.Vector3(0, 0, -1) },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.8 },
      },
    }),
  );
  line.frustumCulled = false;
  line.renderOrder = 20;
  return line;
}

function createPoleLabelTexture(text: 'NCP' | 'SCP', color: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is required for celestial-pole labels.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 52px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.shadowColor = 'rgba(0, 0, 0, 0.7)';
  context.shadowBlur = 8;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createProjectiveQuad(parameters: {
  color?: number;
  texture?: THREE.Texture;
  projective: boolean;
  renderOrder: number;
}): THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
  const uniforms: Record<string, THREE.IUniform> = {
    uViewVector: { value: new THREE.Vector3(0, 0, -1) },
    uProjectiveW: { value: parameters.projective ? 0 : 1 },
    uViewportPixels: { value: new THREE.Vector2(1, 1) },
    uSizePixels: { value: new THREE.Vector2(18, 18) },
    uOffsetPixels: { value: new THREE.Vector2() },
    uOpacity: { value: 0.9 },
  };
  if (parameters.color !== undefined) {
    uniforms.uColor = { value: new THREE.Color(parameters.color) };
  }
  if (parameters.texture) {
    uniforms.uMap = { value: parameters.texture };
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    overlayMaterial({
      vertexShader: projectiveQuadVertexShader,
      fragmentShader: parameters.texture ? labelFragmentShader : markerFragmentShader,
      uniforms,
    }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = parameters.renderOrder;
  return mesh;
}

function setVectorUniform(uniform: THREE.IUniform, value: { x: number; y: number; z: number }): void {
  (uniform.value as THREE.Vector3).set(value.x, value.y, value.z);
}

function setViewportUniforms(
  renderer: THREE.WebGLRenderer,
  material: THREE.ShaderMaterial,
): void {
  const viewport = renderer.getCurrentViewport(viewportScratch);
  (material.uniforms.uViewportPixels.value as THREE.Vector2).set(
    Math.max(1, viewport.z),
    Math.max(1, viewport.w),
  );
}

export interface EarthAxisGroupHandle {
  readonly group: THREE.Group;
  update(model: EarthAxisPresentationModel): void;
  clear(): void;
  setEyePresentationMode(mode: EyePresentationMode): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): EarthAxisCameraRelativeFrame;
}

/**
 * Owns one camera-relative/homogeneous representation of the modeled Earth
 * core and projective celestial axis. It owns every geometry, material, and
 * label texture it creates; clear() preserves them, while dispose() releases
 * them exactly once.
 */
export function createEarthAxisGroup(
  labelTextureFactory: PoleLabelTextureFactory = createPoleLabelTexture,
): EarthAxisGroupHandle {
  const group = new THREE.Group();
  group.name = 'celestial-geocentric-earth-axis-frame';
  group.visible = false;

  const northSegment = createLine(0xffd67a);
  northSegment.name = 'mean-earth-axis-north-segment';
  const southSegment = createLine(0x78d7e8);
  southSegment.name = 'mean-earth-axis-south-segment';

  const earthCore = createProjectiveQuad({ color: 0xeafcff, projective: false, renderOrder: 25 });
  earthCore.name = 'modeled-earth-core-marker';
  const northMarker = createProjectiveQuad({ color: 0xffdc84, projective: true, renderOrder: 26 });
  northMarker.name = 'north-celestial-pole-marker';
  const southMarker = createProjectiveQuad({ color: 0x83dceb, projective: true, renderOrder: 26 });
  southMarker.name = 'south-celestial-pole-marker';

  const northTexture = labelTextureFactory('NCP', '#ffe39a');
  const southTexture = labelTextureFactory('SCP', '#9be8f2');
  const northLabel = createProjectiveQuad({ texture: northTexture, projective: true, renderOrder: 30 });
  northLabel.name = 'north-celestial-pole-label';
  const southLabel = createProjectiveQuad({ texture: southTexture, projective: true, renderOrder: 30 });
  southLabel.name = 'south-celestial-pole-label';

  group.add(
    northSegment,
    southSegment,
    earthCore,
    northMarker,
    southMarker,
    northLabel,
    southLabel,
  );
  const eyeFilter = createEyePresentationLayerFilter(group);

  const ownedObjects = [
    northSegment,
    southSegment,
    earthCore,
    northMarker,
    southMarker,
    northLabel,
    southLabel,
  ] as const;
  let currentModel: EarthAxisPresentationModel | undefined;
  let disposed = false;
  let cachedFrame: EarthAxisCameraRelativeFrame | undefined;
  let cachedCamera: THREE.Camera | undefined;
  const cachedCameraWorld = new THREE.Matrix4();
  const cachedGroupWorld = new THREE.Matrix4();

  function requireModel(): EarthAxisPresentationModel {
    if (!currentModel) throw new Error('Earth-axis render frame is not scientifically ready.');
    return currentModel;
  }

  function frameForCamera(camera: THREE.Camera): EarthAxisCameraRelativeFrame {
    if (disposed) throw new Error('Earth-axis renderer has been disposed.');
    if (
      cachedFrame
      && cachedCamera === camera
      && cachedCameraWorld.equals(camera.matrixWorld)
      && cachedGroupWorld.equals(group.matrixWorld)
    ) {
      return cachedFrame;
    }
    const frame = createEarthAxisCameraRelativeFrame(
      requireModel(),
      group.matrixWorld,
      camera.matrixWorld,
    );
    cachedFrame = frame;
    cachedCamera = camera;
    cachedCameraWorld.copy(camera.matrixWorld);
    cachedGroupWorld.copy(group.matrixWorld);
    return frame;
  }

  function invalidateFrameCache(): void {
    cachedFrame = undefined;
    cachedCamera = undefined;
  }

  northSegment.onBeforeRender = (_renderer, _scene, camera) => {
    const frame = frameForCamera(camera);
    setVectorUniform(northSegment.material.uniforms.uCoreView, frame.coreView);
    setVectorUniform(northSegment.material.uniforms.uDirectionView, frame.northDirectionView);
  };
  southSegment.onBeforeRender = (_renderer, _scene, camera) => {
    const frame = frameForCamera(camera);
    setVectorUniform(southSegment.material.uniforms.uCoreView, frame.coreView);
    setVectorUniform(southSegment.material.uniforms.uDirectionView, frame.southDirectionView);
  };

  const bindQuad = (
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>,
    vector: (frame: EarthAxisCameraRelativeFrame) => EarthAxisCameraRelativeFrame['coreView'],
  ) => {
    mesh.onBeforeRender = (renderer, _scene, camera) => {
      const frame = frameForCamera(camera);
      setVectorUniform(mesh.material.uniforms.uViewVector, vector(frame));
      setViewportUniforms(renderer, mesh.material);
      group.userData.cameraRelativeCoreMagnitudeMeters = frame.cameraRelativeCoreMagnitudeMeters;
      group.userData.maximumUploadedComponentMagnitude = frame.maximumUploadedComponentMagnitude;
      group.userData.float32CoreQuantizationErrorMeters = frame.float32CoreQuantizationErrorMeters;
      group.userData.float32DirectionAngularErrorArcseconds =
        frame.float32DirectionAngularErrorArcseconds;
    };
  };

  bindQuad(earthCore, (frame) => frame.coreView);
  bindQuad(northMarker, (frame) => frame.northDirectionView);
  bindQuad(southMarker, (frame) => frame.southDirectionView);
  bindQuad(northLabel, (frame) => frame.northDirectionView);
  bindQuad(southLabel, (frame) => frame.southDirectionView);

  return Object.freeze({
    group,
    update(model: EarthAxisPresentationModel): void {
      if (disposed) throw new Error('Cannot update a disposed Earth-axis renderer.');
      currentModel = model;
      invalidateFrameCache();
      northSegment.visible = model.north.segmentVisible;
      southSegment.visible = model.south.segmentVisible;
      northSegment.material.uniforms.uOpacity.value = model.north.segmentOpacity;
      southSegment.material.uniforms.uOpacity.value = model.south.segmentOpacity;

      earthCore.visible = model.earthCoreVisible;
      northMarker.visible = model.north.markerVisible;
      southMarker.visible = model.south.markerVisible;
      northLabel.visible = model.north.labelVisible;
      southLabel.visible = model.south.labelVisible;

      (earthCore.material.uniforms.uSizePixels.value as THREE.Vector2).setScalar(
        model.earthCoreMarkerDiameterPixels,
      );
      (northMarker.material.uniforms.uSizePixels.value as THREE.Vector2).setScalar(
        model.poleMarkerDiameterPixels,
      );
      (southMarker.material.uniforms.uSizePixels.value as THREE.Vector2).setScalar(
        model.poleMarkerDiameterPixels,
      );
      (northLabel.material.uniforms.uSizePixels.value as THREE.Vector2).set(
        model.poleLabelWidthPixels,
        model.poleLabelHeightPixels,
      );
      (southLabel.material.uniforms.uSizePixels.value as THREE.Vector2).set(
        model.poleLabelWidthPixels,
        model.poleLabelHeightPixels,
      );
      (northLabel.material.uniforms.uOffsetPixels.value as THREE.Vector2).set(0, 28);
      (southLabel.material.uniforms.uOffsetPixels.value as THREE.Vector2).set(0, 28);

      northMarker.material.uniforms.uOpacity.value = Math.max(0.28, model.north.segmentOpacity);
      southMarker.material.uniforms.uOpacity.value = Math.max(0.28, model.south.segmentOpacity);
      northLabel.material.uniforms.uOpacity.value = Math.max(0.35, model.north.segmentOpacity);
      southLabel.material.uniforms.uOpacity.value = Math.max(0.35, model.south.segmentOpacity);

      group.userData.snapshotCacheKey = model.snapshotIdentity.cacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.presentationKind = model.presentationKind;
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.observerToCoreDistanceMeters = model.observerToCoreDistanceMeters;
      group.visible = ownedObjects.some((object) => object.visible);
    },
    clear(): void {
      currentModel = undefined;
      invalidateFrameCache();
      group.visible = false;
      group.userData.snapshotCacheKey = undefined;
      group.userData.acceptedCalibrationRevision = undefined;
    },
    setEyePresentationMode(mode: EyePresentationMode): void {
      eyeFilter.setMode(mode);
    },
    applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting = false): void {
      eyeFilter.applyViews(views, xrPresenting);
    },
    getEyePresentationDiagnostics(): EyePresentationDiagnostics {
      return eyeFilter.diagnostics;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      currentModel = undefined;
      invalidateFrameCache();
      eyeFilter.dispose();
      group.visible = false;
      group.removeFromParent();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      for (const object of ownedObjects) {
        object.onBeforeRender = () => undefined;
        geometries.add(object.geometry);
        materials.add(object.material);
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      northTexture.dispose();
      southTexture.dispose();
      group.clear();
      group.userData.disposed = true;
    },
    createFrameForCamera(camera: THREE.Camera): EarthAxisCameraRelativeFrame {
      group.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      return frameForCamera(camera);
    },
  });
}
