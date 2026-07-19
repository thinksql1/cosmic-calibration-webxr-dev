import * as THREE from 'three';
import type { SolarSystemBodyPresentationModel } from '../presentation/solarSystemBodyPresentationModel';
import {
  createSolarSystemBodiesCameraRelativeFrame,
  type SolarSystemBodiesCameraRelativeFrame,
} from './solarSystemBodiesCameraRelativeFrame';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.997;

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPointSize;
  attribute float aOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec4 clipPosition = projectionMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) {
      clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    }
    gl_Position = clipPosition;
    gl_PointSize = aPointSize;
    vColor = aColor;
    vOpacity = aOpacity;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    if (dot(centered, centered) > 0.25) discard;
    gl_FragColor = vec4(vColor, uOpacity * vOpacity);
  }
`;

function material(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

export interface SolarSystemBodiesGroupHandle {
  readonly group: THREE.Group;
  update(model: SolarSystemBodyPresentationModel): void;
  clear(): void;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): SolarSystemBodiesCameraRelativeFrame;
}

/** Owns seven bounded homogeneous body-marker attributes and their material. */
export function createSolarSystemBodiesGroup(): SolarSystemBodiesGroupHandle {
  const group = new THREE.Group();
  group.name = 'actual-apparent-solar-system-body-directions';
  group.visible = false;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(7 * 3, 3);
  const colors = new THREE.Float32BufferAttribute(7 * 3, 3);
  const pointSizes = new THREE.Float32BufferAttribute(7, 1);
  const opacities = new THREE.Float32BufferAttribute(7, 1);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('aColor', colors);
  geometry.setAttribute('aPointSize', pointSizes);
  geometry.setAttribute('aOpacity', opacities);
  const pointsMaterial = material();
  const points = new THREE.Points(geometry, pointsMaterial);
  points.name = 'actual-apparent-solar-system-body-markers';
  points.frustumCulled = false;
  points.renderOrder = 24;
  group.add(points);

  let currentModel: SolarSystemBodyPresentationModel | undefined;
  let disposed = false;
  let cachedFrame: SolarSystemBodiesCameraRelativeFrame | undefined;
  let cachedCamera: THREE.Camera | undefined;
  const cachedCameraWorld = new THREE.Matrix4();
  const cachedGroupWorld = new THREE.Matrix4();

  function invalidate(): void {
    cachedFrame = undefined;
    cachedCamera = undefined;
  }

  function frameForCamera(camera: THREE.Camera): SolarSystemBodiesCameraRelativeFrame {
    if (disposed) throw new Error('Solar-system body renderer has been disposed.');
    if (
      cachedFrame && cachedCamera === camera && cachedCameraWorld.equals(camera.matrixWorld) &&
      cachedGroupWorld.equals(group.matrixWorld)
    ) return cachedFrame;
    if (!currentModel) throw new Error('Solar-system body render frame is not scientifically ready.');
    cachedFrame = createSolarSystemBodiesCameraRelativeFrame(
      currentModel,
      group.matrixWorld,
      camera.matrixWorld,
    );
    cachedCamera = camera;
    cachedCameraWorld.copy(camera.matrixWorld);
    cachedGroupWorld.copy(group.matrixWorld);
    return cachedFrame;
  }

  points.onBeforeRender = (_renderer, _scene, camera) => {
    const frame = frameForCamera(camera);
    const values = positions.array as Float32Array;
    frame.directionsView.forEach((direction, index) => {
      const offset = index * 3;
      values[offset] = direction.x;
      values[offset + 1] = direction.y;
      values[offset + 2] = direction.z;
    });
    positions.needsUpdate = true;
    group.userData.maximumUploadedComponentMagnitude = frame.maximumUploadedComponentMagnitude;
    group.userData.float32DirectionAngularErrorArcseconds = frame.float32DirectionAngularErrorArcseconds;
  };

  return Object.freeze({
    group,
    update(model: SolarSystemBodyPresentationModel): void {
      if (disposed) throw new Error('Cannot update a disposed solar-system body renderer.');
      if (model.markers.length !== 7) {
        throw new Error('Solar-system body renderer requires exactly seven supported markers.');
      }
      currentModel = model;
      invalidate();
      const colorValues = colors.array as Float32Array;
      const sizeValues = pointSizes.array as Float32Array;
      const opacityValues = opacities.array as Float32Array;
      model.markers.forEach((marker, index) => {
        const color = new THREE.Color(marker.style.colorHex);
        const offset = index * 3;
        colorValues[offset] = color.r;
        colorValues[offset + 1] = color.g;
        colorValues[offset + 2] = color.b;
        sizeValues[index] = marker.style.pixelDiameter;
        opacityValues[index] = marker.style.opacity;
      });
      colors.needsUpdate = true;
      pointSizes.needsUpdate = true;
      opacities.needsUpdate = true;
      points.visible = model.visible;
      group.visible = model.visible;
      group.userData.snapshotCacheKey = model.snapshotIdentity.snapshotCacheKey;
      group.userData.bodyCacheKey = model.snapshotIdentity.bodyCacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.presentationRadiusPolicy = model.presentationRadiusPolicy;
      group.userData.provenance = model.provenance;
    },
    clear(): void {
      currentModel = undefined;
      invalidate();
      points.visible = false;
      group.visible = false;
      group.userData.snapshotCacheKey = undefined;
      group.userData.bodyCacheKey = undefined;
      group.userData.acceptedCalibrationRevision = undefined;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      currentModel = undefined;
      invalidate();
      points.onBeforeRender = () => undefined;
      group.visible = false;
      group.removeFromParent();
      geometry.dispose();
      pointsMaterial.dispose();
      group.clear();
      group.userData.disposed = true;
    },
    createFrameForCamera(camera: THREE.Camera): SolarSystemBodiesCameraRelativeFrame {
      group.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      return frameForCamera(camera);
    },
  });
}
