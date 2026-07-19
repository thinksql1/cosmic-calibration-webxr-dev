import * as THREE from 'three';
import type { SolarDailyPathPresentationModel } from '../presentation/solarDailyPathPresentationModel';

const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;

export interface SolarDailyPathCameraRelativeFrame {
  readonly kind: 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES';
  readonly pathDirectionsView: readonly Readonly<{ readonly x: number; readonly y: number; readonly z: number }>[];
  readonly notchDirectionsView: readonly Readonly<{ readonly x: number; readonly y: number; readonly z: number }>[];
  readonly maximumUploadedComponentMagnitude: number;
  readonly float32DirectionAngularErrorArcseconds: number;
}

function angularErrorArcseconds(source: THREE.Vector3, quantized: THREE.Vector3): number {
  return Math.atan2(
    new THREE.Vector3().crossVectors(source, quantized).length(),
    THREE.MathUtils.clamp(source.dot(quantized), -1, 1),
  ) * RADIANS_TO_ARCSECONDS;
}

/** Per-eye transformation of projective local-horizontal Sun directions. */
export function createSolarDailyPathCameraRelativeFrame(
  model: SolarDailyPathPresentationModel,
  calibratedWorldMatrix: THREE.Matrix4,
  cameraWorldMatrix: THREE.Matrix4,
): SolarDailyPathCameraRelativeFrame {
  if (
    model.renderStrategy !== 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES' ||
    model.depthContract !== 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY'
  ) throw new Error('Solar daily path requires the projective linear-depth contract.');
  const inverseCameraRotation = new THREE.Quaternion().setFromRotationMatrix(cameraWorldMatrix).invert();
  let maximumUploadedComponentMagnitude = 0;
  let maximumAngularError = 0;
  const transform = (direction: { readonly x: number; readonly y: number; readonly z: number }) => {
    const source = new THREE.Vector3(direction.x, direction.y, direction.z)
      .transformDirection(calibratedWorldMatrix)
      .applyQuaternion(inverseCameraRotation)
      .normalize();
    if (![source.x, source.y, source.z].every(Number.isFinite)) {
      throw new Error('Solar daily-path projective direction must be finite.');
    }
    const quantized = new THREE.Vector3(Math.fround(source.x), Math.fround(source.y), Math.fround(source.z)).normalize();
    maximumUploadedComponentMagnitude = Math.max(maximumUploadedComponentMagnitude, Math.abs(source.x), Math.abs(source.y), Math.abs(source.z));
    maximumAngularError = Math.max(maximumAngularError, angularErrorArcseconds(source, quantized));
    return Object.freeze({ x: source.x, y: source.y, z: source.z });
  };
  const pathDirectionsView = Object.freeze(model.samples.map((sample) => transform(sample.directionApplication)));
  const notchDirectionsView = Object.freeze(model.hourNotches.map((notch) => transform(notch.directionApplication)));
  return Object.freeze({
    kind: 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES',
    pathDirectionsView,
    notchDirectionsView,
    maximumUploadedComponentMagnitude,
    float32DirectionAngularErrorArcseconds: maximumAngularError,
  });
}
