import * as THREE from 'three';
import type { EarthAxisPresentationModel } from '../presentation/earthAxisPresentationModel';
import type { EyePresentationMode } from '../presentation/eyePresentationMode';
import {
  createEarthAxisCameraRelativeFrame,
  type EarthAxisCameraRelativeFrame,
} from './earthAxisCameraRelativeFrame';
import {
  createEarthAxisProjectedSegments,
  EARTH_AXIS_RIBBON_CLIP_DEPTH,
  type EarthAxisHalf,
  type EarthAxisProjectedSegment,
  type EarthAxisProjectedSegments,
} from './earthAxisProjectedSegments';
import {
  createEyePresentationLayerFilter,
  type EyePresentationDiagnostics,
  type XrViewIdentitySource,
} from './eyePresentationLayerFilter';

type PoleLabelTextureFactory = (text: 'NCP' | 'SCP', color: string) => THREE.Texture;

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.999;
const viewportScratch = new THREE.Vector4();

const spindleSegmentVertexShader = /* glsl */ `
  uniform vec2 uStartNdc;
  uniform vec2 uBoundaryNdc;
  uniform vec2 uPerpendicularOffsetNdc;
  uniform float uDrawEnabled;

  void main() {
    if (uDrawEnabled < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    vec2 center = mix(uStartNdc, uBoundaryNdc, position.x);
    vec2 ndc = center + position.y * uPerpendicularOffsetNdc;
    gl_Position = vec4(ndc, ${EARTH_AXIS_RIBBON_CLIP_DEPTH.toFixed(3)}, 1.0);
  }
`;

const spindleSegmentFragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;

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
  side?: THREE.Side;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...parameters,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function createSpindleSegment(
  half: EarthAxisHalf,
): THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const geometry = new THREE.BufferGeometry();
  // One independent, non-indexed open quad: two triangles from core to one
  // viewport boundary. No vertex or triangle belongs to the opposite half.
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, -1, 0,
    1, -1, 0,
    0, 1, 0,
    1, -1, 0,
    1, 1, 0,
    0, 1, 0,
  ], 3));
  const segment = new THREE.Mesh(
    geometry,
    overlayMaterial({
      vertexShader: spindleSegmentVertexShader,
      fragmentShader: spindleSegmentFragmentShader,
      uniforms: {
        uStartNdc: { value: new THREE.Vector2() },
        uBoundaryNdc: { value: new THREE.Vector2() },
        uPerpendicularOffsetNdc: { value: new THREE.Vector2() },
        uDrawEnabled: { value: 0 },
        uOpacity: { value: 0.72 },
        uColor: { value: new THREE.Color(0xc9e3e8) },
      },
      side: THREE.DoubleSide,
    }),
  );
  segment.name = `mean-earth-axis-rigid-spindle-${half}-segment`;
  segment.frustumCulled = false;
  segment.renderOrder = 27;
  segment.userData.axisHalf = half;
  segment.userData.primitiveTopology = 'NON_INDEXED_GL_TRIANGLES_OPEN_QUAD';
  segment.userData.indices = Object.freeze([]);
  return segment;
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

function setSegmentUniforms(
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  projected: EarthAxisProjectedSegment,
): void {
  (mesh.material.uniforms.uStartNdc.value as THREE.Vector2).set(
    projected.startNdc.x,
    projected.startNdc.y,
  );
  (mesh.material.uniforms.uBoundaryNdc.value as THREE.Vector2).set(
    projected.boundaryNdc.x,
    projected.boundaryNdc.y,
  );
  (mesh.material.uniforms.uPerpendicularOffsetNdc.value as THREE.Vector2).set(
    projected.perpendicularOffsetNdc.x,
    projected.perpendicularOffsetNdc.y,
  );
  mesh.material.uniforms.uDrawEnabled.value = projected.visible ? 1 : 0;
}

function diagnosticEye(camera: THREE.Camera): string {
  const mask = camera.layers.mask >>> 0;
  const left = (mask & (1 << 1)) !== 0;
  const right = (mask & (1 << 2)) !== 0;
  if (left && !right) return 'left';
  if (right && !left) return 'right';
  return 'mono-or-unknown';
}

function point(value: Readonly<{ x: number; y: number }>): string {
  return `${value.x.toFixed(6)},${value.y.toFixed(6)}`;
}

function clipVector(value: Readonly<{ x: number; y: number; z: number; w: number }>): string {
  return `${value.x.toFixed(6)},${value.y.toFixed(6)},${value.z.toFixed(6)},${value.w.toFixed(6)}`;
}

function vertices(value: EarthAxisProjectedSegment): string {
  return value.ribbonVerticesClip
    .map(({ x, y, z, w }) => `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(3)},${w}`)
    .join(';');
}

function projectionDiagnostic(
  eye: string,
  projected: EarthAxisProjectedSegments,
): string {
  const { north, south } = projected;
  return [
    `eye=${eye}`,
    `core=${point(projected.coreNdc)}`,
    `northDirection=${point(north.directionNdc)}`,
    `southDirection=${point(south.directionNdc)}`,
    `northDirectionClip=${clipVector(north.projectiveDirectionClip)}`,
    `southDirectionClip=${clipVector(south.projectiveDirectionClip)}`,
    `northBoundary=${point(north.boundaryNdc)}`,
    `southBoundary=${point(south.boundaryNdc)}`,
    `lengths=${north.lengthNdc.toFixed(6)},${south.lengthNdc.toFixed(6)}`,
    `northPerpendicular=${point(north.perpendicularOffsetNdc)}`,
    `southPerpendicular=${point(south.perpendicularOffsetNdc)}`,
    `northVertices=${vertices(north)}`,
    `southVertices=${vertices(south)}`,
    'indices=none,none',
    `oppositeDot=${projected.oppositeDirectionDot.toFixed(9)}`,
    `crossHalfTriangle=${projected.anyTriangleSpansBothHalves}`,
    `reasons=${north.reason},${south.reason}`,
  ].join('|');
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
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): EarthAxisGroupHandle {
  const group = new THREE.Group();
  group.name = 'celestial-geocentric-earth-axis-frame';
  group.visible = false;

  const spindle = new THREE.Group();
  spindle.name = 'mean-earth-axis-rigid-spindle';
  const northSpindleSegment = createSpindleSegment('north');
  const southSpindleSegment = createSpindleSegment('south');
  spindle.add(northSpindleSegment, southSpindleSegment);

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
    spindle,
    earthCore,
    northMarker,
    southMarker,
    northLabel,
    southLabel,
  );
  const eyeFilter = createEyePresentationLayerFilter(group);

  const ownedObjects = [
    northSpindleSegment,
    southSpindleSegment,
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
  const lastProjectionDiagnostics = new Map<string, string>();

  function report(event: string, detail: string): void {
    try {
      reportDiagnostic(event, detail);
    } catch {
      // Diagnostic transport must never abort XR rendering.
    }
  }

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

  const bindSpindleSegment = (
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
    half: EarthAxisHalf,
  ) => {
    mesh.onBeforeRender = (renderer, _scene, camera) => {
      const eye = diagnosticEye(camera);
      try {
        const viewport = renderer.getCurrentViewport(viewportScratch);
        const frame = frameForCamera(camera);
        const projected = createEarthAxisProjectedSegments(
          frame,
          camera.projectionMatrix,
          { x: Math.max(1, viewport.z), y: Math.max(1, viewport.w) },
        );
        setSegmentUniforms(mesh, projected[half]);
        group.userData.axisDirectionView = Object.freeze({
          x: frame.northDirectionView.x,
          y: frame.northDirectionView.y,
          z: frame.northDirectionView.z,
        });
        group.userData.lastProjectedSegments = projected;
        const detail = projectionDiagnostic(eye, projected);
        if (lastProjectionDiagnostics.get(eye) !== detail) {
          lastProjectionDiagnostics.set(eye, detail);
          report('earth-axis.open-segments', detail);
        }
      } catch (error) {
        mesh.material.uniforms.uDrawEnabled.value = 0;
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        report('earth-axis.segment-suppressed', `eye=${eye}|half=${half}|error=${message}`);
      }
    };
  };

  bindSpindleSegment(northSpindleSegment, 'north');
  bindSpindleSegment(southSpindleSegment, 'south');

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
      spindle.visible = model.north.segmentVisible || model.south.segmentVisible;
      northSpindleSegment.visible = model.north.segmentVisible;
      southSpindleSegment.visible = model.south.segmentVisible;
      northSpindleSegment.material.uniforms.uOpacity.value = model.north.segmentOpacity;
      southSpindleSegment.material.uniforms.uOpacity.value = model.south.segmentOpacity;

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
      group.userData.spindleLineContract = model.spindle.lineContract;
      group.userData.spindleRenderTopology = model.spindle.renderTopology;
      group.userData.spindleCoordinateFrameIdentity = model.spindle.coordinateFrameIdentity;
      group.userData.spindleTransformParentIdentity = group.parent?.name ?? 'unparented';
      group.userData.spindleYawApplication = 'GEOGRAPHIC_PARENT_EXACTLY_ONCE';
      group.userData.geocentricStructureContract =
        model.geocentricStructure.geometryContract;
      group.userData.geocentricStructureCacheKey =
        model.geocentricStructure.snapshotCacheKey;
      group.userData.coreIsEquatorCenter =
        model.earthCore === model.geocentricStructure.celestialEquatorCenter;
      group.userData.spindleNorthSouthDotProduct =
        model.spindle.northDirection.x * model.spindle.southDirection.x +
        model.spindle.northDirection.y * model.spindle.southDirection.y +
        model.spindle.northDirection.z * model.spindle.southDirection.z;
      group.userData.spindleCoreToLineDistanceMeters = 0;
      group.userData.axisDirectionLocal = Object.freeze({
        x: model.spindle.northDirection.x,
        y: model.spindle.northDirection.y,
        z: model.spindle.northDirection.z,
      });
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.observerToCoreDistanceMeters = model.observerToCoreDistanceMeters;
      group.visible = ownedObjects.some((object) => object.visible);
    },
    clear(): void {
      currentModel = undefined;
      invalidateFrameCache();
      lastProjectionDiagnostics.clear();
      group.visible = false;
      group.userData.snapshotCacheKey = undefined;
      group.userData.acceptedCalibrationRevision = undefined;
      group.userData.projectedCenterlineVisible = undefined;
      group.userData.projectedCenterlineEndOnDegenerate = undefined;
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
      lastProjectionDiagnostics.clear();
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
