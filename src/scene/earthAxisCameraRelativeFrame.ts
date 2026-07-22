import * as THREE from 'three';
import type {
  EarthAxisPresentationModel,
  PresentationPoint,
} from '../presentation/earthAxisPresentationModel';
import type { ApplicationBasisDirection } from '../presentation/mapEnuToApplicationBasis';

const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;
const UNIT_DIRECTION_TOLERANCE = 1e-9;

export const CAMERA_RELATIVE_CORE_COMPONENT_BUDGET_METERS = 7_000_000;

export interface CameraRelativeVector {
  readonly frame: 'CAMERA_VIEW';
  readonly units: 'meters' | 'unitless';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface BoundedHomogeneousSpindlePoint {
  readonly frame: 'CAMERA_VIEW_HOMOGENEOUS';
  readonly units: 'DISPLAY_EXTENT_SCALED';
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface EarthAxisCameraRelativeFrame {
  readonly kind: 'CAMERA_RELATIVE_HOMOGENEOUS_EARTH_AXIS';
  readonly renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES';
  readonly coreView: CameraRelativeVector;
  readonly northDirectionView: CameraRelativeVector;
  readonly southDirectionView: CameraRelativeVector;
  readonly northGridConvergenceView?: BoundedHomogeneousSpindlePoint;
  readonly southGridConvergenceView?: BoundedHomogeneousSpindlePoint;
  readonly spindleCore: BoundedHomogeneousSpindlePoint;
  readonly spindleNorthEndpoint: BoundedHomogeneousSpindlePoint;
  readonly spindleSouthEndpoint: BoundedHomogeneousSpindlePoint;
  readonly spindleDisplayExtentMeters: number;
  readonly cameraRelativeCoreMagnitudeMeters: number;
  readonly maximumUploadedComponentMagnitude: number;
  readonly float32CoreQuantizationErrorMeters: number;
  readonly float32DirectionAngularErrorArcseconds: number;
}

export interface EarthAxisProjectedCenterline {
  readonly kind: 'PROJECTED_RIGID_EARTH_AXIS_CENTERLINE';
  readonly visibleInViewport: boolean;
  readonly endOnDegenerate: boolean;
  readonly lineNdc: Readonly<{ x: number; y: number; z: number }>;
  readonly sideClassificationAvailable: boolean;
  readonly coreImage: Readonly<{ x: number; y: number; z: number }>;
  readonly northDirectionImage: Readonly<{ x: number; y: number; z: number }>;
  readonly maximumUploadedComponentMagnitude: number;
}

export type EarthAxisProjectedSide = 'north' | 'south' | 'unavailable';

function finiteVector(
  value: THREE.Vector3,
  units: CameraRelativeVector['units'],
): CameraRelativeVector {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new Error('Camera-relative Earth-axis rendering requires finite vectors.');
  }
  return Object.freeze({
    frame: 'CAMERA_VIEW',
    units,
    x: value.x,
    y: value.y,
    z: value.z,
  });
}

function asVector3(value: PresentationPoint | ApplicationBasisDirection): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function exactAntipode(value: CameraRelativeVector): CameraRelativeVector {
  return Object.freeze({
    frame: 'CAMERA_VIEW',
    units: 'unitless',
    x: -value.x,
    y: -value.y,
    z: -value.z,
  });
}

function spindlePoint(
  coreView: CameraRelativeVector,
  directionView: CameraRelativeVector,
  coefficient: -1 | 0 | 1,
  inverseDisplayExtent: number,
): BoundedHomogeneousSpindlePoint {
  const point = {
    frame: 'CAMERA_VIEW_HOMOGENEOUS' as const,
    units: 'DISPLAY_EXTENT_SCALED' as const,
    x: coreView.x * inverseDisplayExtent + directionView.x * coefficient,
    y: coreView.y * inverseDisplayExtent + directionView.y * coefficient,
    z: coreView.z * inverseDisplayExtent + directionView.z * coefficient,
    w: inverseDisplayExtent,
  };
  if (![point.x, point.y, point.z, point.w].every(Number.isFinite)) {
    throw new Error('Bounded homogeneous Earth-axis spindle points must be finite.');
  }
  return Object.freeze(point);
}

function exactDirectionMatch(
  first: ApplicationBasisDirection,
  second: ApplicationBasisDirection,
): boolean {
  return first.x === second.x && first.y === second.y && first.z === second.z;
}

function float32Vector(value: CameraRelativeVector): THREE.Vector3 {
  return new THREE.Vector3(
    Math.fround(value.x),
    Math.fround(value.y),
    Math.fround(value.z),
  );
}

function angularSeparationArcseconds(
  first: CameraRelativeVector,
  second: THREE.Vector3,
): number {
  const a = new THREE.Vector3(first.x, first.y, first.z).normalize();
  const b = second.normalize();
  const cross = new THREE.Vector3().crossVectors(a, b).length();
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  return Math.atan2(cross, dot) * RADIANS_TO_ARCSECONDS;
}

function normalizedImageVector(value: THREE.Vector3): Readonly<{ x: number; y: number; z: number }> | undefined {
  const scale = Math.max(Math.abs(value.x), Math.abs(value.y), Math.abs(value.z));
  if (!Number.isFinite(scale) || scale < 1e-30) return undefined;
  return Object.freeze({
    x: value.x / scale,
    y: value.y / scale,
    z: value.z / scale,
  });
}

/**
 * Projects the one world-space spindle into one exact image-space line.
 *
 * The line equation is the homogeneous cross product of the scaled finite
 * core and the shared ideal axis direction. Rendering one viewport-clipped
 * strip from this equation avoids assembling two independently rasterized
 * pole-to-core primitives. A camera exactly on the axis is the legitimate
 * end-on degenerate case and produces no invented line direction.
 */
export function projectEarthAxisCenterline(
  frame: EarthAxisCameraRelativeFrame,
  projectionMatrix: THREE.Matrix4,
): EarthAxisProjectedCenterline {
  const coreClip = new THREE.Vector4(
    frame.spindleCore.x,
    frame.spindleCore.y,
    frame.spindleCore.z,
    frame.spindleCore.w,
  ).applyMatrix4(projectionMatrix);
  const directionClip = new THREE.Vector4(
    frame.northDirectionView.x,
    frame.northDirectionView.y,
    frame.northDirectionView.z,
    0,
  ).applyMatrix4(projectionMatrix);
  if (![...coreClip.toArray(), ...directionClip.toArray()].every(Number.isFinite)) {
    throw new Error('Projected Earth-axis centerline requires finite clip coordinates.');
  }

  const rawCoreImage = new THREE.Vector3(coreClip.x, coreClip.y, coreClip.w);
  const rawDirectionImage = new THREE.Vector3(
    directionClip.x,
    directionClip.y,
    directionClip.w,
  );
  const boundedCoreImage = normalizedImageVector(rawCoreImage);
  const boundedDirectionImage = normalizedImageVector(rawDirectionImage);
  const rawLine = boundedCoreImage && boundedDirectionImage
    ? new THREE.Vector3().crossVectors(
      new THREE.Vector3(boundedCoreImage.x, boundedCoreImage.y, boundedCoreImage.z),
      new THREE.Vector3(
        boundedDirectionImage.x,
        boundedDirectionImage.y,
        boundedDirectionImage.z,
      ),
    )
    : new THREE.Vector3();
  const imageNormalLength = Math.hypot(rawLine.x, rawLine.y);
  const endOnDegenerate = !Number.isFinite(imageNormalLength) || imageNormalLength < 1e-12;
  if (endOnDegenerate) {
    return Object.freeze({
      kind: 'PROJECTED_RIGID_EARTH_AXIS_CENTERLINE',
      visibleInViewport: false,
      endOnDegenerate: true,
      lineNdc: Object.freeze({ x: 0, y: 0, z: 1 }),
      sideClassificationAvailable: false,
      coreImage: Object.freeze({ x: 1, y: 0, z: 0 }),
      northDirectionImage: Object.freeze({ x: 0, y: 1, z: 0 }),
      maximumUploadedComponentMagnitude: 1,
    });
  }

  const lineScale = Math.max(
    Math.abs(rawLine.x),
    Math.abs(rawLine.y),
    Math.abs(rawLine.z),
  );
  const lineNdc = Object.freeze({
    x: rawLine.x / lineScale,
    y: rawLine.y / lineScale,
    z: rawLine.z / lineScale,
  });
  const visibleInViewport = Math.abs(lineNdc.z) <=
    Math.abs(lineNdc.x) + Math.abs(lineNdc.y) + 1e-9;

  const coreImage = boundedCoreImage!;
  const northDirectionImage = boundedDirectionImage!;
  const sideClassificationDeterminant = rawLine.lengthSq();
  const sideClassificationAvailable =
    Number.isFinite(sideClassificationDeterminant) && sideClassificationDeterminant > 1e-12;
  const maximumUploadedComponentMagnitude = Math.max(
    Math.abs(lineNdc.x),
    Math.abs(lineNdc.y),
    Math.abs(lineNdc.z),
    Math.abs(coreImage.x),
    Math.abs(coreImage.y),
    Math.abs(coreImage.z),
    Math.abs(northDirectionImage.x),
    Math.abs(northDirectionImage.y),
    Math.abs(northDirectionImage.z),
  );

  return Object.freeze({
    kind: 'PROJECTED_RIGID_EARTH_AXIS_CENTERLINE',
    visibleInViewport,
    endOnDegenerate: false,
    lineNdc,
    sideClassificationAvailable,
    coreImage,
    northDirectionImage,
    maximumUploadedComponentMagnitude,
  });
}

/** Mirrors the spindle shader's bounded homogeneous side decision for tests and diagnostics. */
export function classifyEarthAxisProjectedSide(
  projected: EarthAxisProjectedCenterline,
  pointNdc: Readonly<{ x: number; y: number }>,
): EarthAxisProjectedSide {
  if (
    !projected.sideClassificationAvailable ||
    !Number.isFinite(pointNdc.x) ||
    !Number.isFinite(pointNdc.y)
  ) {
    return 'unavailable';
  }
  const point = new THREE.Vector3(pointNdc.x, pointNdc.y, 1);
  const core = new THREE.Vector3(
    projected.coreImage.x,
    projected.coreImage.y,
    projected.coreImage.z,
  );
  const direction = new THREE.Vector3(
    projected.northDirectionImage.x,
    projected.northDirectionImage.y,
    projected.northDirectionImage.z,
  );
  const coreCore = core.dot(core);
  const directionDirection = direction.dot(direction);
  const coreDirection = core.dot(direction);
  const pointCore = point.dot(core);
  const pointDirection = point.dot(direction);
  const alphaNumerator =
    pointCore * directionDirection - pointDirection * coreDirection;
  const betaNumerator =
    pointDirection * coreCore - pointCore * coreDirection;
  return alphaNumerator * betaNumerator >= 0 ? 'north' : 'south';
}

/**
 * Produces the only values uploaded to the geocentric renderer.
 *
 * JavaScript keeps the scientific coordinates in double precision. The
 * active calibrated parent is applied once in world space, the current eye
 * position is subtracted before float32 upload, and the eye rotation places
 * the result in view coordinates. Projective poles remain unit directions;
 * no finite celestial distance enters a GPU attribute or object transform.
 */
export function createEarthAxisCameraRelativeFrame(
  model: EarthAxisPresentationModel,
  calibratedWorldMatrix: THREE.Matrix4,
  cameraWorldMatrix: THREE.Matrix4,
): EarthAxisCameraRelativeFrame {
  if (
    model.renderStrategy !==
      'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES' ||
    model.depthContract !== 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY'
  ) {
    throw new Error('Earth-axis render model does not declare the hardened projective contract.');
  }
  const { spindle } = model;
  if (
    spindle.validity !== 'VALIDATED' ||
    spindle.lineContract !== 'ONE_CORE_ONE_DIRECTION_ONE_EXACT_ANTIPODE' ||
    spindle.renderTopology !== 'ONE_PROJECTIVELY_CLIPPED_SCREEN_SPACE_SPINDLE' ||
    spindle.earthCore !== model.earthCore ||
    !exactDirectionMatch(spindle.northDirection, model.north.directionApplication) ||
    !exactDirectionMatch(spindle.southDirection, model.south.directionApplication) ||
    spindle.southDirection.x !== -spindle.northDirection.x ||
    spindle.southDirection.y !== -spindle.northDirection.y ||
    spindle.southDirection.z !== -spindle.northDirection.z
  ) {
    throw new Error('Earth-axis render model must expose one core and one exact antipodal spindle direction.');
  }
  if (!Number.isFinite(spindle.displayExtentMeters) || spindle.displayExtentMeters <= 0) {
    throw new Error('Earth-axis spindle display extent must be finite and positive.');
  }
  const gridConvergenceRadius = model.gridConvergenceRadiusMeters ?? spindle.displayExtentMeters;
  if (!Number.isFinite(gridConvergenceRadius) || gridConvergenceRadius <= 0) {
    throw new Error('Pole marker convergence requires a finite positive grid radius.');
  }

  const cameraPositionWorld = new THREE.Vector3().setFromMatrixPosition(cameraWorldMatrix);
  const cameraWorldRotation = new THREE.Quaternion().setFromRotationMatrix(cameraWorldMatrix);
  const worldToCameraRotation = cameraWorldRotation.clone().invert();

  const coreWorld = asVector3(spindle.earthCore).applyMatrix4(calibratedWorldMatrix);
  const coreViewValue = coreWorld
    .sub(cameraPositionWorld)
    .applyQuaternion(worldToCameraRotation);

  const northApplication = asVector3(spindle.northDirection);
  const northApplicationLength = northApplication.length();
  if (
    !Number.isFinite(northApplicationLength)
    || Math.abs(northApplicationLength - 1) > UNIT_DIRECTION_TOLERANCE
  ) {
    throw new Error('Projective Earth-axis rendering requires a finite unit pole direction.');
  }
  const northWorld = northApplication.transformDirection(calibratedWorldMatrix);
  const northViewValue = northWorld
    .applyQuaternion(worldToCameraRotation)
    .normalize();

  const coreView = finiteVector(coreViewValue, 'meters');
  const northDirectionView = finiteVector(northViewValue, 'unitless');
  const southDirectionView = exactAntipode(northDirectionView);
  const inverseDisplayExtent = 1 / spindle.displayExtentMeters;
  const inverseGridRadius = 1 / gridConvergenceRadius;
  const spindleCore = spindlePoint(coreView, northDirectionView, 0, inverseDisplayExtent);
  const spindleNorthEndpoint = spindlePoint(
    coreView,
    northDirectionView,
    1,
    inverseDisplayExtent,
  );
  const spindleSouthEndpoint = spindlePoint(
    coreView,
    northDirectionView,
    -1,
    inverseDisplayExtent,
  );
  const northGridConvergenceView = spindlePoint(
    coreView,
    northDirectionView,
    1,
    inverseGridRadius,
  );
  const southGridConvergenceView = spindlePoint(
    coreView,
    northDirectionView,
    -1,
    inverseGridRadius,
  );
  const floatCore = float32Vector(coreView);
  const floatNorth = float32Vector(northDirectionView);
  const cameraRelativeCoreMagnitudeMeters = coreViewValue.length();
  const maximumUploadedComponentMagnitude = Math.max(
    Math.abs(coreView.x),
    Math.abs(coreView.y),
    Math.abs(coreView.z),
    Math.abs(northDirectionView.x),
    Math.abs(northDirectionView.y),
    Math.abs(northDirectionView.z),
  );

  if (maximumUploadedComponentMagnitude > CAMERA_RELATIVE_CORE_COMPONENT_BUDGET_METERS) {
    throw new Error('Camera-relative Earth-core coordinates exceed the validated GPU budget.');
  }

  return Object.freeze({
    kind: 'CAMERA_RELATIVE_HOMOGENEOUS_EARTH_AXIS',
    renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES',
    coreView,
    northDirectionView,
    southDirectionView,
    northGridConvergenceView,
    southGridConvergenceView,
    spindleCore,
    spindleNorthEndpoint,
    spindleSouthEndpoint,
    spindleDisplayExtentMeters: spindle.displayExtentMeters,
    cameraRelativeCoreMagnitudeMeters,
    maximumUploadedComponentMagnitude,
    float32CoreQuantizationErrorMeters: floatCore.distanceTo(coreViewValue),
    float32DirectionAngularErrorArcseconds: angularSeparationArcseconds(
      northDirectionView,
      floatNorth,
    ),
  });
}
