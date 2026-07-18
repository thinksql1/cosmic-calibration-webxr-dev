import * as THREE from 'three';
import type { CelestialEquatorPresentationModel } from '../presentation/celestialEquatorPresentationModel';
import {
  createCelestialEquatorCameraRelativeFrame,
  type CelestialEquatorCameraRelativeFrame,
} from './celestialEquatorCameraRelativeFrame';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.999;

const vertexShader = /* glsl */ `
  void main() {
    vec4 clipPosition = projectionMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) {
      clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    }
    gl_Position = clipPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }
`;

function material(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(0xb79cff) },
      uOpacity: { value: 0.48 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

export interface CelestialEquatorGroupHandle {
  readonly group: THREE.Group;
  update(model: CelestialEquatorPresentationModel): void;
  clear(): void;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): CelestialEquatorCameraRelativeFrame;
}

/** Owns one sampled homogeneous projective great-circle overlay. */
export function createCelestialEquatorGroup(
  sampleCount: number,
): CelestialEquatorGroupHandle {
  if (!Number.isSafeInteger(sampleCount) || sampleCount < 8 || sampleCount % 2 !== 0) {
    throw new Error('Celestial-equator rendering requires an even sample count of at least eight.');
  }
  const group = new THREE.Group();
  group.name = 'celestial-geocentric-mean-equator-frame';
  group.visible = false;
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.Float32BufferAttribute(sampleCount * 3, 3);
  geometry.setAttribute('position', position);
  const line = new THREE.LineLoop(geometry, material());
  line.name = 'mean-celestial-equator-projective-great-circle';
  line.frustumCulled = false;
  line.renderOrder = 21;
  group.add(line);

  let currentModel: CelestialEquatorPresentationModel | undefined;
  let disposed = false;
  let cachedFrame: CelestialEquatorCameraRelativeFrame | undefined;
  let cachedCamera: THREE.Camera | undefined;
  const cachedCameraWorld = new THREE.Matrix4();
  const cachedGroupWorld = new THREE.Matrix4();

  function invalidate(): void {
    cachedFrame = undefined;
    cachedCamera = undefined;
  }

  function frameForCamera(camera: THREE.Camera): CelestialEquatorCameraRelativeFrame {
    if (disposed) throw new Error('Celestial-equator renderer has been disposed.');
    if (
      cachedFrame && cachedCamera === camera && cachedCameraWorld.equals(camera.matrixWorld) &&
      cachedGroupWorld.equals(group.matrixWorld)
    ) return cachedFrame;
    if (!currentModel) throw new Error('Celestial-equator render frame is not scientifically ready.');
    cachedFrame = createCelestialEquatorCameraRelativeFrame(
      currentModel,
      group.matrixWorld,
      camera.matrixWorld,
    );
    cachedCamera = camera;
    cachedCameraWorld.copy(camera.matrixWorld);
    cachedGroupWorld.copy(group.matrixWorld);
    return cachedFrame;
  }

  line.onBeforeRender = (_renderer, _scene, camera) => {
    const frame = frameForCamera(camera);
    const values = position.array as Float32Array;
    frame.directionsView.forEach((direction, index) => {
      const offset = index * 3;
      values[offset] = direction.x;
      values[offset + 1] = direction.y;
      values[offset + 2] = direction.z;
    });
    position.needsUpdate = true;
    group.userData.cameraRelativeCoreMagnitudeMeters = frame.cameraRelativeCoreMagnitudeMeters;
    group.userData.maximumUploadedComponentMagnitude = frame.maximumUploadedComponentMagnitude;
    group.userData.float32DirectionAngularErrorArcseconds = frame.float32DirectionAngularErrorArcseconds;
  };

  return Object.freeze({
    group,
    update(model: CelestialEquatorPresentationModel): void {
      if (disposed) throw new Error('Cannot update a disposed celestial-equator renderer.');
      if (model.sampleCount !== sampleCount || model.samples.length !== sampleCount) {
        throw new Error('Celestial-equator model sample count does not match owned geometry.');
      }
      currentModel = model;
      invalidate();
      line.visible = model.visible;
      line.material.uniforms.uOpacity.value = model.lineOpacity;
      group.visible = model.visible;
      group.userData.snapshotCacheKey = model.snapshotIdentity.cacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.sampleCount = model.sampleCount;
      group.userData.provenance = model.provenance;
    },
    clear(): void {
      currentModel = undefined;
      invalidate();
      line.visible = false;
      group.visible = false;
      group.userData.snapshotCacheKey = undefined;
      group.userData.acceptedCalibrationRevision = undefined;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      currentModel = undefined;
      invalidate();
      line.onBeforeRender = () => undefined;
      group.visible = false;
      group.removeFromParent();
      geometry.dispose();
      line.material.dispose();
      group.clear();
      group.userData.disposed = true;
    },
    createFrameForCamera(camera: THREE.Camera): CelestialEquatorCameraRelativeFrame {
      group.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      return frameForCamera(camera);
    },
  });
}
