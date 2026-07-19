import * as THREE from 'three';
import type { SolarDailyPathPresentationModel } from '../presentation/solarDailyPathPresentationModel';
import {
  createSolarDailyPathCameraRelativeFrame,
  type SolarDailyPathCameraRelativeFrame,
} from './solarDailyPathCameraRelativeFrame';

export const MAX_SOLAR_DAILY_PATH_SAMPLES = 192;
export const MAX_SOLAR_DAILY_HOUR_NOTCHES = 32;
const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.996;

const pathVertexShader = /* glsl */ `
  attribute float aOpacity;
  varying float vOpacity;
  void main() {
    vec4 clipPosition = projectionMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
    vOpacity = aOpacity;
  }
`;

const notchVertexShader = /* glsl */ `
  attribute float aOpacity;
  attribute float aPointSize;
  varying float vOpacity;
  void main() {
    vec4 clipPosition = projectionMatrix * vec4(position, 0.0);
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

function lineMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: pathVertexShader,
    fragmentShader,
    uniforms: { uColor: { value: new THREE.Color(0xf3b56a) } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function pointMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: notchVertexShader,
    fragmentShader: notchFragmentShader,
    uniforms: { uColor: { value: new THREE.Color(0xffd18c) } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

export interface SolarDailyPathGroupHandle {
  readonly group: THREE.Group;
  update(model: SolarDailyPathPresentationModel): void;
  clear(): void;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): SolarDailyPathCameraRelativeFrame;
}

/** Owns one bounded projective apparent-Sun path and its exact civil-hour notches. */
export function createSolarDailyPathGroup(): SolarDailyPathGroupHandle {
  const group = new THREE.Group();
  group.name = 'observer-relative-apparent-sun-civil-day-path';
  group.visible = false;
  const pathGeometry = new THREE.BufferGeometry();
  const pathPositions = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_PATH_SAMPLES * 3, 3);
  const pathOpacity = new THREE.Float32BufferAttribute(MAX_SOLAR_DAILY_PATH_SAMPLES, 1);
  pathGeometry.setAttribute('position', pathPositions);
  pathGeometry.setAttribute('aOpacity', pathOpacity);
  const path = new THREE.Line(pathGeometry, lineMaterial());
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
  const notches = new THREE.Points(notchGeometry, pointMaterial());
  notches.name = 'apparent-sun-civil-hour-notches';
  notches.frustumCulled = false;
  notches.renderOrder = 25;
  group.add(path, notches);

  let currentModel: SolarDailyPathPresentationModel | undefined;
  let disposed = false;
  let cachedFrame: SolarDailyPathCameraRelativeFrame | undefined;
  let cachedCamera: THREE.Camera | undefined;
  const cachedCameraWorld = new THREE.Matrix4();
  const cachedGroupWorld = new THREE.Matrix4();

  function invalidate(): void {
    cachedFrame = undefined;
    cachedCamera = undefined;
  }

  function frameForCamera(camera: THREE.Camera): SolarDailyPathCameraRelativeFrame {
    if (disposed) throw new Error('Solar daily-path renderer has been disposed.');
    if (
      cachedFrame && cachedCamera === camera && cachedCameraWorld.equals(camera.matrixWorld) &&
      cachedGroupWorld.equals(group.matrixWorld)
    ) return cachedFrame;
    if (!currentModel) throw new Error('Solar daily-path renderer is not scientifically ready.');
    cachedFrame = createSolarDailyPathCameraRelativeFrame(currentModel, group.matrixWorld, camera.matrixWorld);
    cachedCamera = camera;
    cachedCameraWorld.copy(camera.matrixWorld);
    cachedGroupWorld.copy(group.matrixWorld);
    return cachedFrame;
  }

  function uploadDirections(camera: THREE.Camera): void {
    const frame = frameForCamera(camera);
    const pathValues = pathPositions.array as Float32Array;
    frame.pathDirectionsView.forEach((direction, index) => {
      const offset = index * 3;
      pathValues[offset] = direction.x;
      pathValues[offset + 1] = direction.y;
      pathValues[offset + 2] = direction.z;
    });
    const notchValues = notchPositions.array as Float32Array;
    frame.notchDirectionsView.forEach((direction, index) => {
      const offset = index * 3;
      notchValues[offset] = direction.x;
      notchValues[offset + 1] = direction.y;
      notchValues[offset + 2] = direction.z;
    });
    pathPositions.needsUpdate = true;
    notchPositions.needsUpdate = true;
    group.userData.maximumUploadedComponentMagnitude = frame.maximumUploadedComponentMagnitude;
    group.userData.float32DirectionAngularErrorArcseconds = frame.float32DirectionAngularErrorArcseconds;
  }

  path.onBeforeRender = (_renderer, _scene, camera) => uploadDirections(camera);
  notches.onBeforeRender = (_renderer, _scene, camera) => uploadDirections(camera);

  return Object.freeze({
    group,
    update(model: SolarDailyPathPresentationModel): void {
      if (disposed) throw new Error('Cannot update a disposed solar daily-path renderer.');
      if (
        model.samples.length > MAX_SOLAR_DAILY_PATH_SAMPLES ||
        model.hourNotches.length > MAX_SOLAR_DAILY_HOUR_NOTCHES
      ) throw new Error('Solar daily-path model exceeds bounded owned geometry capacity.');
      currentModel = model;
      invalidate();
      const pathOpacityValues = pathOpacity.array as Float32Array;
      model.samples.forEach((sample, index) => { pathOpacityValues[index] = sample.opacity; });
      const notchOpacityValues = notchOpacity.array as Float32Array;
      const notchSizeValues = notchSizes.array as Float32Array;
      model.hourNotches.forEach((notch, index) => {
        notchOpacityValues[index] = notch.opacity;
        notchSizeValues[index] = notch.pixelDiameter;
      });
      pathOpacity.needsUpdate = true;
      notchOpacity.needsUpdate = true;
      notchSizes.needsUpdate = true;
      pathGeometry.setDrawRange(0, model.samples.length);
      notchGeometry.setDrawRange(0, model.hourNotches.length);
      path.visible = model.pathVisible;
      notches.visible = model.hourNotchesVisible;
      group.visible = model.pathVisible || model.hourNotchesVisible;
      group.userData.pathCacheKey = model.snapshotIdentity.pathCacheKey;
      group.userData.timeZone = model.timeZone;
      group.userData.selectedCivilDate = model.selectedCivilDate;
      group.userData.currentHourNotchIndex = model.currentHourNotchIndex;
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.provenance = model.provenance;
    },
    clear(): void {
      if (disposed) return;
      currentModel = undefined;
      invalidate();
      path.visible = false;
      notches.visible = false;
      group.visible = false;
      group.userData.pathCacheKey = undefined;
      group.userData.currentHourNotchIndex = undefined;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      currentModel = undefined;
      invalidate();
      path.onBeforeRender = () => undefined;
      notches.onBeforeRender = () => undefined;
      group.visible = false;
      group.removeFromParent();
      pathGeometry.dispose();
      notchGeometry.dispose();
      (path.material as THREE.Material).dispose();
      (notches.material as THREE.Material).dispose();
      group.clear();
      group.userData.disposed = true;
    },
    createFrameForCamera(camera: THREE.Camera): SolarDailyPathCameraRelativeFrame {
      group.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      return frameForCamera(camera);
    },
  });
}
