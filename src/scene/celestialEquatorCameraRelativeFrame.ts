import * as THREE from 'three';
import type { CelestialEquatorPresentationModel } from '../presentation/celestialEquatorPresentationModel';
import { CAMERA_RELATIVE_CORE_COMPONENT_BUDGET_METERS } from './earthAxisCameraRelativeFrame';

const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;

export interface CelestialEquatorCameraRelativeFrame {
  readonly kind: 'CAMERA_RELATIVE_HOMOGENEOUS_CELESTIAL_EQUATOR';
  readonly renderStrategy: 'HOMOGENEOUS_PROJECTIVE_EQUATOR_DIRECTIONS_WITH_CAMERA_RELATIVE_CORE';
  readonly coreView: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>;
  readonly directionsView: readonly Readonly<{ readonly x: number; readonly y: number; readonly z: number }>[];
  readonly cameraRelativeCoreMagnitudeMeters: number;
  readonly maximumUploadedComponentMagnitude: number;
  readonly float32DirectionAngularErrorArcseconds: number;
}

function angularErrorArcseconds(
  source: THREE.Vector3,
  quantized: THREE.Vector3,
): number {
  const cross = new THREE.Vector3().crossVectors(source, quantized).length();
  const dot = THREE.MathUtils.clamp(source.dot(quantized), -1, 1);
  return Math.atan2(cross, dot) * RADIANS_TO_ARCSECONDS;
}

/**
 * Converts the immutable application-basis model into the active eye's bounded
 * render values. The finite core is camera-relative; the sampled great-circle
 * directions are homogeneous (w = 0) and therefore translation-invariant.
 */
export function createCelestialEquatorCameraRelativeFrame(
  model: CelestialEquatorPresentationModel,
  calibratedWorldMatrix: THREE.Matrix4,
  cameraWorldMatrix: THREE.Matrix4,
): CelestialEquatorCameraRelativeFrame {
  if (
    model.renderStrategy !==
      'HOMOGENEOUS_PROJECTIVE_EQUATOR_DIRECTIONS_WITH_CAMERA_RELATIVE_CORE' ||
    model.depthContract !== 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY'
  ) {
    throw new Error('Celestial-equator model does not declare the hardened projective render contract.');
  }
  const cameraPosition = new THREE.Vector3().setFromMatrixPosition(cameraWorldMatrix);
  const inverseCameraRotation = new THREE.Quaternion()
    .setFromRotationMatrix(cameraWorldMatrix)
    .invert();
  const coreViewVector = new THREE.Vector3(model.earthCore.x, model.earthCore.y, model.earthCore.z)
    .applyMatrix4(calibratedWorldMatrix)
    .sub(cameraPosition)
    .applyQuaternion(inverseCameraRotation);
  if (![coreViewVector.x, coreViewVector.y, coreViewVector.z].every(Number.isFinite)) {
    throw new Error('Celestial-equator camera-relative core must be finite.');
  }

  let maximumUploadedComponentMagnitude = Math.max(
    Math.abs(coreViewVector.x),
    Math.abs(coreViewVector.y),
    Math.abs(coreViewVector.z),
  );
  let maximumAngularError = 0;
  const directionsView = Object.freeze(model.samples.map((sample) => {
    const direction = new THREE.Vector3(
      sample.directionApplication.x,
      sample.directionApplication.y,
      sample.directionApplication.z,
    ).transformDirection(calibratedWorldMatrix).applyQuaternion(inverseCameraRotation).normalize();
    if (![direction.x, direction.y, direction.z].every(Number.isFinite)) {
      throw new Error('Celestial-equator projective directions must be finite unit vectors.');
    }
    const quantized = new THREE.Vector3(Math.fround(direction.x), Math.fround(direction.y), Math.fround(direction.z)).normalize();
    maximumAngularError = Math.max(maximumAngularError, angularErrorArcseconds(direction, quantized));
    maximumUploadedComponentMagnitude = Math.max(
      maximumUploadedComponentMagnitude,
      Math.abs(direction.x),
      Math.abs(direction.y),
      Math.abs(direction.z),
    );
    return Object.freeze({ x: direction.x, y: direction.y, z: direction.z });
  }));
  if (maximumUploadedComponentMagnitude > CAMERA_RELATIVE_CORE_COMPONENT_BUDGET_METERS) {
    throw new Error('Celestial-equator camera-relative values exceed the validated GPU budget.');
  }
  return Object.freeze({
    kind: 'CAMERA_RELATIVE_HOMOGENEOUS_CELESTIAL_EQUATOR',
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_EQUATOR_DIRECTIONS_WITH_CAMERA_RELATIVE_CORE',
    coreView: Object.freeze({ x: coreViewVector.x, y: coreViewVector.y, z: coreViewVector.z }),
    directionsView,
    cameraRelativeCoreMagnitudeMeters: coreViewVector.length(),
    maximumUploadedComponentMagnitude,
    float32DirectionAngularErrorArcseconds: maximumAngularError,
  });
}
