import * as THREE from 'three';
import type { SolarSystemBodyPresentationModel } from '../presentation/solarSystemBodyPresentationModel';

const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;

export interface SolarSystemBodiesCameraRelativeFrame {
  readonly kind: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS';
  readonly directionsView: readonly Readonly<{ readonly x: number; readonly y: number; readonly z: number }>[];
  readonly maximumUploadedComponentMagnitude: number;
  readonly float32DirectionAngularErrorArcseconds: number;
}

function angularErrorArcseconds(source: THREE.Vector3, quantized: THREE.Vector3): number {
  const cross = new THREE.Vector3().crossVectors(source, quantized).length();
  const dot = THREE.MathUtils.clamp(source.dot(quantized), -1, 1);
  return Math.atan2(cross, dot) * RADIANS_TO_ARCSECONDS;
}

/** Converts immutable ENU-derived directions into one active camera view. */
export function createSolarSystemBodiesCameraRelativeFrame(
  model: SolarSystemBodyPresentationModel,
  calibratedWorldMatrix: THREE.Matrix4,
  cameraWorldMatrix: THREE.Matrix4,
): SolarSystemBodiesCameraRelativeFrame {
  if (
    model.renderStrategy !== 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS' ||
    model.depthContract !== 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY'
  ) {
    throw new Error('Solar-system body renderer requires the homogeneous projective depth contract.');
  }
  const worldToCameraRotation = new THREE.Quaternion()
    .setFromRotationMatrix(cameraWorldMatrix)
    .invert();
  let maximumUploadedComponentMagnitude = 0;
  let maximumAngularError = 0;
  const directionsView = Object.freeze(model.markers.map((marker) => {
    const value = new THREE.Vector3(
      marker.directionApplication.x,
      marker.directionApplication.y,
      marker.directionApplication.z,
    ).transformDirection(calibratedWorldMatrix).applyQuaternion(worldToCameraRotation).normalize();
    if (![value.x, value.y, value.z].every(Number.isFinite)) {
      throw new Error('Solar-system projective body direction must be finite.');
    }
    const quantized = new THREE.Vector3(Math.fround(value.x), Math.fround(value.y), Math.fround(value.z)).normalize();
    maximumAngularError = Math.max(maximumAngularError, angularErrorArcseconds(value, quantized));
    maximumUploadedComponentMagnitude = Math.max(
      maximumUploadedComponentMagnitude,
      Math.abs(value.x),
      Math.abs(value.y),
      Math.abs(value.z),
    );
    return Object.freeze({ x: value.x, y: value.y, z: value.z });
  }));
  return Object.freeze({
    kind: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS',
    directionsView,
    maximumUploadedComponentMagnitude,
    float32DirectionAngularErrorArcseconds: maximumAngularError,
  });
}
