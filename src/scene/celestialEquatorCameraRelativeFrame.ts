import * as THREE from 'three';
import type { CelestialEquatorPresentationModel } from '../presentation/celestialEquatorPresentationModel';

const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;
export const GEOCENTRIC_EQUATOR_GPU_COMPONENT_BUDGET = 2;

export interface BoundedHomogeneousEquatorPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface CelestialEquatorCameraRelativeFrame {
  readonly kind: 'CAMERA_RELATIVE_HOMOGENEOUS_GEOCENTRIC_EQUATOR';
  readonly renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_EQUATOR_RING';
  readonly coreView: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>;
  readonly normalView: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>;
  readonly ringPoints: readonly BoundedHomogeneousEquatorPoint[];
  readonly ringProjectiveW: number;
  readonly cameraRelativeCoreMagnitudeMeters: number;
  readonly maximumUploadedComponentMagnitude: number;
  readonly maximumPlaneResidual: number;
  readonly float32DirectionAngularErrorArcseconds: number;
}

function angularErrorArcseconds(source: THREE.Vector3, quantized: THREE.Vector3): number {
  const cross = new THREE.Vector3().crossVectors(source, quantized).length();
  const dot = THREE.MathUtils.clamp(source.dot(quantized), -1, 1);
  return Math.atan2(cross, dot) * RADIANS_TO_ARCSECONDS;
}

function exactDirectionMatch(
  first: Readonly<{ x: number; y: number; z: number }>,
  second: Readonly<{ x: number; y: number; z: number }>,
): boolean {
  return first.x === second.x && first.y === second.y && first.z === second.z;
}

/**
 * Encodes each finite point C + R d as the projectively equivalent bounded
 * homogeneous point (C / R + d, 1 / R). The finite Earth-core translation is
 * therefore preserved without submitting million-metre vertex components.
 */
export function createCelestialEquatorCameraRelativeFrame(
  model: CelestialEquatorPresentationModel,
  calibratedWorldMatrix: THREE.Matrix4,
  cameraWorldMatrix: THREE.Matrix4,
): CelestialEquatorCameraRelativeFrame {
  if (
    model.renderStrategy !==
      'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_EQUATOR_RING' ||
    model.depthContract !== 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY' ||
    model.geocentricStructure.validity !== 'VALIDATED' ||
    model.center !== model.earthCore ||
    model.center !== model.geocentricStructure.earthCore ||
    model.normalApplication !== model.geocentricStructure.equatorialPlaneNormal ||
    !exactDirectionMatch(
      model.normalApplication,
      model.geocentricStructure.northAxisDirection,
    ) ||
    !Number.isFinite(model.displayRadiusMeters) ||
    model.displayRadiusMeters <= 0
  ) {
    throw new Error('Celestial-equator model does not declare one validated Earth-centred render contract.');
  }

  const cameraPosition = new THREE.Vector3().setFromMatrixPosition(cameraWorldMatrix);
  const inverseCameraRotation = new THREE.Quaternion()
    .setFromRotationMatrix(cameraWorldMatrix)
    .invert();
  const coreViewVector = new THREE.Vector3(model.center.x, model.center.y, model.center.z)
    .applyMatrix4(calibratedWorldMatrix)
    .sub(cameraPosition)
    .applyQuaternion(inverseCameraRotation);
  const normalViewVector = new THREE.Vector3(
    model.normalApplication.x,
    model.normalApplication.y,
    model.normalApplication.z,
  ).transformDirection(calibratedWorldMatrix).applyQuaternion(inverseCameraRotation).normalize();
  if (![...coreViewVector.toArray(), ...normalViewVector.toArray()].every(Number.isFinite)) {
    throw new Error('Celestial-equator camera-relative frame must be finite.');
  }

  const inverseRadius = 1 / model.displayRadiusMeters;
  const scaledCore = coreViewVector.clone().multiplyScalar(inverseRadius);
  let maximumUploadedComponentMagnitude = Math.abs(inverseRadius);
  let maximumAngularError = 0;
  let maximumPlaneResidual = 0;
  const ringPoints = Object.freeze(model.samples.map((sample) => {
    const direction = new THREE.Vector3(
      sample.directionApplication.x,
      sample.directionApplication.y,
      sample.directionApplication.z,
    ).transformDirection(calibratedWorldMatrix).applyQuaternion(inverseCameraRotation).normalize();
    const quantized = new THREE.Vector3(
      Math.fround(direction.x),
      Math.fround(direction.y),
      Math.fround(direction.z),
    ).normalize();
    maximumAngularError = Math.max(maximumAngularError, angularErrorArcseconds(direction, quantized));
    // Plane membership is a property of the immutable presentation geometry,
    // not of an XR eye matrix. Rechecking it after camera transforms made a
    // scientific invariant depend on device-pose numerical conditioning.
    maximumPlaneResidual = Math.max(
      maximumPlaneResidual,
      Math.abs(
        sample.directionApplication.x * model.normalApplication.x
        + sample.directionApplication.y * model.normalApplication.y
        + sample.directionApplication.z * model.normalApplication.z
      ),
    );
    const point = Object.freeze({
      x: scaledCore.x + direction.x,
      y: scaledCore.y + direction.y,
      z: scaledCore.z + direction.z,
      w: inverseRadius,
    });
    if (![point.x, point.y, point.z, point.w].every(Number.isFinite)) {
      throw new Error('Celestial-equator bounded homogeneous points must be finite.');
    }
    maximumUploadedComponentMagnitude = Math.max(
      maximumUploadedComponentMagnitude,
      Math.abs(point.x),
      Math.abs(point.y),
      Math.abs(point.z),
    );
    return point;
  }));
  if (
    maximumUploadedComponentMagnitude > GEOCENTRIC_EQUATOR_GPU_COMPONENT_BUDGET ||
    maximumPlaneResidual > 1e-9
  ) {
    throw new Error('Celestial-equator bounded frame violates its GPU or plane contract.');
  }
  return Object.freeze({
    kind: 'CAMERA_RELATIVE_HOMOGENEOUS_GEOCENTRIC_EQUATOR',
    renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_EQUATOR_RING',
    coreView: Object.freeze({ x: coreViewVector.x, y: coreViewVector.y, z: coreViewVector.z }),
    normalView: Object.freeze({ x: normalViewVector.x, y: normalViewVector.y, z: normalViewVector.z }),
    ringPoints,
    ringProjectiveW: inverseRadius,
    cameraRelativeCoreMagnitudeMeters: coreViewVector.length(),
    maximumUploadedComponentMagnitude,
    maximumPlaneResidual,
    float32DirectionAngularErrorArcseconds: maximumAngularError,
  });
}
