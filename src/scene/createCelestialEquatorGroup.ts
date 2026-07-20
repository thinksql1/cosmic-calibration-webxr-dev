import * as THREE from 'three';
import type { CelestialEquatorPresentationModel } from '../presentation/celestialEquatorPresentationModel';
import type { EyePresentationMode } from '../presentation/eyePresentationMode';
import {
  createCelestialEquatorCameraRelativeFrame,
  type CelestialEquatorCameraRelativeFrame,
} from './celestialEquatorCameraRelativeFrame';
import {
  createEyePresentationLayerFilter,
  type EyePresentationDiagnostics,
  type XrViewIdentitySource,
} from './eyePresentationLayerFilter';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.999;

function matrixIsFinite(matrix: THREE.Matrix4): boolean {
  for (const value of matrix.elements) {
    if (!Number.isFinite(value)) return false;
  }
  return true;
}

const vertexShader = /* glsl */ `
  uniform float uRingProjectiveW;
  uniform float uDrawEnabled;
  void main() {
    if (uDrawEnabled < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    vec4 clipPosition = projectionMatrix * modelViewMatrix
      * vec4(position, uRingProjectiveW);
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
      uRingProjectiveW: { value: 1.0 },
      uDrawEnabled: { value: 1.0 },
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
  setEyePresentationMode(mode: EyePresentationMode): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): CelestialEquatorCameraRelativeFrame;
}

/** Owns one bounded homogeneous Earth-core-centred equatorial reference ring. */
export function createCelestialEquatorGroup(
  sampleCount: number,
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
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
  line.name = 'mean-celestial-equator-geocentric-reference-ring';
  line.frustumCulled = false;
  line.renderOrder = 21;
  group.add(line);
  const eyeFilter = createEyePresentationLayerFilter(group);
  const modelViewScratch = new THREE.Matrix4();

  function report(event: string, detail: string): void {
    try {
      reportDiagnostic(event, detail);
    } catch (error) {
      console.error('Celestial-equator diagnostic reporter failed.', error);
    }
  }

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

  let lastSafetyState = 'valid';
  line.onBeforeRender = (_renderer, _scene, camera) => {
    modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, line.matrixWorld);
    const finite = matrixIsFinite(camera.projectionMatrix)
      && matrixIsFinite(modelViewScratch)
      && Number.isFinite(line.material.uniforms.uRingProjectiveW.value)
      && Number.isFinite(line.material.uniforms.uOpacity.value);
    line.material.uniforms.uDrawEnabled.value = finite ? 1 : 0;
    const safetyState = finite ? 'valid' : 'suppressed-non-finite-eye-state';
    if (safetyState !== lastSafetyState) {
      report('celestial-equator.draw-state', safetyState);
      lastSafetyState = safetyState;
    }
    group.userData.lastDrawState = safetyState;
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
      const values = position.array as Float32Array;
      const inverseRadius = 1 / model.displayRadiusMeters;
      let maximumUploadedComponentMagnitude = Math.abs(inverseRadius);
      let maximumPlaneResidual = 0;
      let finite = Number.isFinite(inverseRadius) && inverseRadius > 0;
      model.samples.forEach((sample, index) => {
        const offset = index * 3;
        const x = model.center.x * inverseRadius + sample.directionApplication.x;
        const y = model.center.y * inverseRadius + sample.directionApplication.y;
        const z = model.center.z * inverseRadius + sample.directionApplication.z;
        finite = finite && [x, y, z].every(Number.isFinite);
        maximumUploadedComponentMagnitude = Math.max(
          maximumUploadedComponentMagnitude,
          Math.abs(x), Math.abs(y), Math.abs(z),
        );
        maximumPlaneResidual = Math.max(
          maximumPlaneResidual,
          Math.abs(
            sample.directionApplication.x * model.normalApplication.x
            + sample.directionApplication.y * model.normalApplication.y
            + sample.directionApplication.z * model.normalApplication.z
          ),
        );
        values[offset] = finite ? Math.fround(x) : 0;
        values[offset + 1] = finite ? Math.fround(y) : 0;
        values[offset + 2] = finite ? Math.fround(z) : 0;
      });
      const renderContractValid = finite
        && Number.isFinite(model.lineOpacity)
        && maximumUploadedComponentMagnitude <= 2
        && maximumPlaneResidual <= 1e-9;
      position.needsUpdate = true;
      line.material.uniforms.uRingProjectiveW.value = renderContractValid
        ? Math.fround(inverseRadius)
        : 0;
      line.material.uniforms.uDrawEnabled.value = renderContractValid ? 1 : 0;
      line.visible = model.visible && renderContractValid;
      line.material.uniforms.uOpacity.value = renderContractValid ? model.lineOpacity : 0;
      group.visible = model.visible && renderContractValid;
      group.userData.renderContractValid = renderContractValid;
      group.userData.maximumUploadedComponentMagnitude = maximumUploadedComponentMagnitude;
      group.userData.maximumPlaneResidual = maximumPlaneResidual;
      group.userData.renderSuppressedReason = renderContractValid
        ? undefined
        : `finite=${finite};maximum=${maximumUploadedComponentMagnitude};plane=${maximumPlaneResidual}`;
      if (!renderContractValid) {
        report('celestial-equator.update-suppressed', group.userData.renderSuppressedReason);
      }
      group.userData.snapshotCacheKey = model.snapshotIdentity.cacheKey;
      group.userData.acceptedCalibrationRevision = model.snapshotIdentity.acceptedCalibrationRevision;
      group.userData.renderStrategy = model.renderStrategy;
      group.userData.depthContract = model.depthContract;
      group.userData.sampleCount = model.sampleCount;
      group.userData.geocentricStructureContract = model.geocentricStructure.geometryContract;
      group.userData.geocentricStructureCacheKey = model.geocentricStructure.snapshotCacheKey;
      group.userData.displayRadiusMeters = model.displayRadiusMeters;
      group.userData.centerIsEarthCore = model.center === model.earthCore;
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
      invalidate();
      eyeFilter.dispose();
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
