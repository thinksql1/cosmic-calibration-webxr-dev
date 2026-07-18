import * as THREE from 'three';
import type { EyePresentationMode } from '../presentation/eyePresentationMode';
import type { ReadyLocalHorizonPresentationModel } from '../presentation/localHorizonPresentationModel';
import {
  createEyePresentationLayerFilter,
  type EyePresentationDiagnostics,
  type XrViewIdentitySource,
} from './eyePresentationLayerFilter';

export interface LocalHorizonGroupHandle {
  readonly group: THREE.Group;
  update(model: ReadyLocalHorizonPresentationModel): void;
  clear(): void;
  setEyePresentationMode(mode: EyePresentationMode): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  dispose(): void;
}

/** Owns one bounded, observer-origin, calibrated local-tangent circle. */
export function createLocalHorizonGroup(sampleCount: number): LocalHorizonGroupHandle {
  if (!Number.isSafeInteger(sampleCount) || sampleCount < 8 || sampleCount % 4 !== 0) {
    throw new Error('Local-horizon rendering requires a sample count divisible by four.');
  }
  const group = new THREE.Group();
  group.name = 'local-astronomical-horizon-frame';
  group.visible = false;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(sampleCount * 3, 3);
  geometry.setAttribute('position', positions);
  const material = new THREE.LineBasicMaterial({
    color: 0x6de4c5,
    transparent: true,
    opacity: 0.42,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const line = new THREE.LineLoop(geometry, material);
  line.name = 'local-astronomical-horizon-circle';
  line.frustumCulled = false;
  line.renderOrder = 12;
  group.add(line);
  const eyeFilter = createEyePresentationLayerFilter(group);
  let disposed = false;

  return Object.freeze({
    group,
    update(model: ReadyLocalHorizonPresentationModel): void {
      if (disposed) throw new Error('Cannot update a disposed local-horizon renderer.');
      if (model.sampleCount !== sampleCount || model.samples.length !== sampleCount) {
        throw new Error('Local-horizon model sample count does not match owned geometry.');
      }
      const values = positions.array as Float32Array;
      model.samples.forEach((sample, index) => {
        const offset = index * 3;
        values[offset] = sample.positionApplicationMeters.x;
        values[offset + 1] = sample.positionApplicationMeters.y;
        values[offset + 2] = sample.positionApplicationMeters.z;
      });
      positions.needsUpdate = true;
      material.opacity = model.lineOpacity;
      line.visible = model.visible;
      group.visible = model.visible;
      group.userData.acceptedCalibrationRevision = model.acceptedCalibrationRevision;
      group.userData.terminology = model.terminology;
      group.userData.verticalModel = model.verticalModel;
      group.userData.presentationRadiusMeters = model.presentationRadiusMeters;
      group.userData.sampleCount = model.sampleCount;
      group.userData.depthContract = model.depthContract;
    },
    clear(): void {
      if (disposed) return;
      line.visible = false;
      group.visible = false;
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
      eyeFilter.dispose();
      group.visible = false;
      group.removeFromParent();
      geometry.dispose();
      material.dispose();
      group.clear();
      group.userData.disposed = true;
    },
  });
}
