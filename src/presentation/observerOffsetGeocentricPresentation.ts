import { WGS84_SEMI_MAJOR_AXIS_METERS } from '../science/frames/observerGeocentricEarthAxis';
import type {
  ApplicationBasisDirection,
  ApplicationBasisPosition,
} from './mapEnuToApplicationBasis';
import { mapEnuToApplicationBasis } from './mapEnuToApplicationBasis';
import type { GeocentricCelestialStructurePresentation } from './geocentricCelestialStructurePresentation';

/** Matches the validated finite-core grid and equator attribute budget. */
export const OBSERVER_OFFSET_GEOCENTRIC_GPU_COMPONENT_BUDGET = 2;
export const OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE = 1e-10;

export interface BoundedHomogeneousFiniteAnchor {
  readonly kind: 'FINITE_GEOCENTRIC_HOMOGENEOUS_ANCHOR';
  readonly sourceUnits: 'scientific-meters';
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  readonly scaleDivisorMeters: number;
}

export interface BoundedHomogeneousDirection {
  readonly kind: 'PROJECTIVE_DIRECTION_AT_INFINITY';
  readonly sourceUnits: 'unitless-direction';
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: 0;
}

export interface ObserverOffsetGeocentricPresentation {
  readonly kind: 'OBSERVER_OFFSET_GEOCENTRIC_PRESENTATION';
  readonly validity: 'VALIDATED';
  readonly coordinateFrameIdentity:
    'APPLICATION_BASIS_UNCALIBRATED_BELOW_ONE_GEOGRAPHIC_PARENT';
  readonly presentationScale:
    'RATIO_PRESERVING_FINITE_HOMOGENEOUS_ANCHORS_SCALED_BY_CELESTIAL_GRID_RADIUS';
  readonly geocentricStructure: GeocentricCelestialStructurePresentation;
  /** The same object identity used by the grid, equator, core marker, and pole anchors. */
  readonly scientificEarthCore: ApplicationBasisPosition;
  /** The actual WGS84 observer origin; it remains distinct from the Earth core. */
  readonly scientificObserver: ApplicationBasisPosition;
  readonly scientificObserverToCore: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>;
  readonly scientificObserverToCoreDistanceMeters: number;
  /** The WGS84 semi-major reference radius used by the existing two-radius grid. */
  readonly scientificEarthReferenceRadiusMeters: number;
  readonly scientificCelestialGridRadiusMeters: number;
  readonly observerRadialDirection: ApplicationBasisDirection;
  /** WGS84 local geodetic ENU basis, retained for the local-horizon tangent plane. */
  readonly localEast: ApplicationBasisDirection;
  readonly localNorth: ApplicationBasisDirection;
  readonly localUp: ApplicationBasisDirection;
  /**
   * The spherical reference surface point at one WGS84 semi-major radius.
   * It is deliberately separate from the actual ellipsoidal observer origin.
   */
  readonly referenceEarthSphereSurfacePoint: ApplicationBasisPosition;
  readonly referenceEarthSphereRadiusMeters: number;
  readonly ellipsoidToReferenceSphereOffsetMeters: number;
  readonly earthCoreAnchor: BoundedHomogeneousFiniteAnchor;
  readonly observerAnchor: BoundedHomogeneousFiniteAnchor;
  readonly referenceEarthSphereSurfaceAnchor: BoundedHomogeneousFiniteAnchor;
  readonly localEastDirectionAnchor: BoundedHomogeneousDirection;
  readonly localNorthDirectionAnchor: BoundedHomogeneousDirection;
  readonly localUpDirectionAnchor: BoundedHomogeneousDirection;
  readonly maximumUploadedComponentMagnitude: number;
  encodeFiniteAnchor(point: ApplicationBasisPosition): FiniteAnchorResult;
  encodeOffsetFromCore(
    direction: ApplicationBasisDirection,
    distanceMeters: number,
  ): FiniteAnchorResult;
  encodeTangentPoint(
    eastOffsetMeters: number,
    northOffsetMeters: number,
  ): FiniteAnchorResult;
}

export interface ObserverOffsetGeocentricPresentationFailure {
  readonly kind: 'not-ready';
  readonly reason:
    | 'INVALID_GEOCENTRIC_STRUCTURE'
    | 'INVALID_FINITE_POINT'
    | 'INVALID_DIRECTION'
    | 'INVALID_DISTANCE'
    | 'GPU_COMPONENT_BUDGET_EXCEEDED';
  readonly detail: string;
}

export type FiniteAnchorResult =
  | BoundedHomogeneousFiniteAnchor
  | ObserverOffsetGeocentricPresentationFailure;

function finite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function length(value: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function dot(
  left: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>,
  right: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>,
): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function cross(
  left: ApplicationBasisDirection,
  right: ApplicationBasisDirection,
): Readonly<{ readonly x: number; readonly y: number; readonly z: number }> {
  return Object.freeze({
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  });
}

function point(x: number, y: number, z: number): ApplicationBasisPosition {
  return Object.freeze({ frame: 'APPLICATION_BASIS', units: 'meters', x, y, z });
}

function direction(x: number, y: number, z: number): ApplicationBasisDirection | undefined {
  const magnitude = Math.hypot(x, y, z);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return undefined;
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: x / magnitude,
    y: y / magnitude,
    z: z / magnitude,
  });
}

function failure(
  reason: ObserverOffsetGeocentricPresentationFailure['reason'],
  detail: string,
): ObserverOffsetGeocentricPresentationFailure {
  return Object.freeze({ kind: 'not-ready', reason, detail });
}

function validDirection(value: ApplicationBasisDirection): boolean {
  return finite([value.x, value.y, value.z]) &&
    Math.abs(length(value) - 1) <= OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE;
}

/**
 * Encodes the finite point P as (P / R, 1 / R), which reconstructs exactly
 * to P after homogeneous division. R is the existing celestial-grid radius,
 * so this uses the same finite-anchor convention as the validated grid.
 */
export function encodeGeocentricFiniteAnchor(
  pointValue: ApplicationBasisPosition,
  scaleDivisorMeters: number,
): BoundedHomogeneousFiniteAnchor | ObserverOffsetGeocentricPresentationFailure {
  if (!finite([pointValue.x, pointValue.y, pointValue.z])) {
    return failure('INVALID_FINITE_POINT', 'Finite geocentric anchor requires finite scientific meters.');
  }
  if (!Number.isFinite(scaleDivisorMeters) || scaleDivisorMeters <= 0) {
    return failure('INVALID_DISTANCE', 'Finite geocentric anchor requires a positive finite scale divisor.');
  }
  const w = 1 / scaleDivisorMeters;
  const anchor: BoundedHomogeneousFiniteAnchor = Object.freeze({
    kind: 'FINITE_GEOCENTRIC_HOMOGENEOUS_ANCHOR',
    sourceUnits: 'scientific-meters',
    x: pointValue.x * w,
    y: pointValue.y * w,
    z: pointValue.z * w,
    w,
    scaleDivisorMeters,
  });
  if (!finite([anchor.x, anchor.y, anchor.z, anchor.w])) {
    return failure('INVALID_FINITE_POINT', 'Finite geocentric anchor encoding produced a non-finite component.');
  }
  return anchor;
}

/** Reconstructs a finite scientific-meter point; directions at infinity are rejected by type. */
export function reconstructGeocentricFiniteAnchor(
  anchor: BoundedHomogeneousFiniteAnchor,
): ApplicationBasisPosition | ObserverOffsetGeocentricPresentationFailure {
  if (!finite([anchor.x, anchor.y, anchor.z, anchor.w]) || anchor.w === 0) {
    return failure('INVALID_FINITE_POINT', 'Finite geocentric anchor requires finite non-zero homogeneous w.');
  }
  return point(anchor.x / anchor.w, anchor.y / anchor.w, anchor.z / anchor.w);
}

/** Encodes a true projective direction. Finite observer/surface anchors never use this path. */
export function encodeGeocentricDirection(
  value: ApplicationBasisDirection,
): BoundedHomogeneousDirection | ObserverOffsetGeocentricPresentationFailure {
  if (!validDirection(value)) {
    return failure('INVALID_DIRECTION', 'Projective geocentric direction requires a finite normalized direction.');
  }
  return Object.freeze({
    kind: 'PROJECTIVE_DIRECTION_AT_INFINITY',
    sourceUnits: 'unitless-direction',
    x: value.x,
    y: value.y,
    z: value.z,
    w: 0,
  });
}

function largestComponent(...anchors: readonly BoundedHomogeneousFiniteAnchor[]): number {
  return Math.max(...anchors.flatMap((anchor) => [
    Math.abs(anchor.x), Math.abs(anchor.y), Math.abs(anchor.z), Math.abs(anchor.w),
  ]));
}

/**
 * Creates the shared, immutable observer-offset geocentric contract. It is
 * scene-object-free: future prototypes must consume these anchors rather than
 * adding a second center, scale, or per-eye geometry path.
 */
export function createObserverOffsetGeocentricPresentation(
  structure: GeocentricCelestialStructurePresentation,
): ObserverOffsetGeocentricPresentation | ObserverOffsetGeocentricPresentationFailure {
  if (
    structure.validity !== 'VALIDATED' ||
    structure.celestialEquatorCenter !== structure.earthCore ||
    !finite([
      structure.earthCore.x,
      structure.earthCore.y,
      structure.earthCore.z,
      structure.observerSurfaceOrigin.x,
      structure.observerSurfaceOrigin.y,
      structure.observerSurfaceOrigin.z,
      structure.celestialEquatorDisplayRadiusMeters,
    ]) ||
    structure.celestialEquatorDisplayRadiusMeters <= 0
  ) {
    return failure('INVALID_GEOCENTRIC_STRUCTURE', 'Observer-offset presentation requires the validated shared Earth-core structure.');
  }

  const scientificEarthCore = structure.earthCore;
  const scientificObserver = structure.observerSurfaceOrigin;
  const observerToCore = Object.freeze({
    x: scientificEarthCore.x - scientificObserver.x,
    y: scientificEarthCore.y - scientificObserver.y,
    z: scientificEarthCore.z - scientificObserver.z,
  });
  const observerToCoreDistanceMeters = length(observerToCore);
  const observerRadialDirection = direction(
    scientificObserver.x - scientificEarthCore.x,
    scientificObserver.y - scientificEarthCore.y,
    scientificObserver.z - scientificEarthCore.z,
  );
  const localEast = mapEnuToApplicationBasis({
    frame: 'HORIZONTAL_ENU', units: 'unitless', east: 1, north: 0, up: 0,
  });
  const localNorth = mapEnuToApplicationBasis({
    frame: 'HORIZONTAL_ENU', units: 'unitless', east: 0, north: 1, up: 0,
  });
  const localUp = mapEnuToApplicationBasis({
    frame: 'HORIZONTAL_ENU', units: 'unitless', east: 0, north: 0, up: 1,
  });
  if (
    !observerRadialDirection || !localEast || !localNorth || !localUp ||
    !Number.isFinite(observerToCoreDistanceMeters) || observerToCoreDistanceMeters <= 0 ||
    Math.abs(dot(localEast, localNorth)) > OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE ||
    Math.abs(dot(localEast, localUp)) > OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE ||
    Math.abs(dot(localNorth, localUp)) > OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE ||
    dot(cross(localEast, localNorth), localUp) < 1 - OBSERVER_OFFSET_GEOCENTRIC_ORTHONORMAL_TOLERANCE
  ) {
    return failure('INVALID_GEOCENTRIC_STRUCTURE', 'Observer-offset presentation requires a finite right-handed ENU application basis.');
  }

  const referenceEarthSphereRadiusMeters = WGS84_SEMI_MAJOR_AXIS_METERS;
  const scientificCelestialGridRadiusMeters = structure.celestialEquatorDisplayRadiusMeters;
  if (Math.abs(scientificCelestialGridRadiusMeters - referenceEarthSphereRadiusMeters * 2) > 1e-6) {
    return failure('INVALID_GEOCENTRIC_STRUCTURE', 'Observer-offset presentation requires the existing two-WGS84-radius celestial grid.');
  }
  const referenceEarthSphereSurfacePoint = point(
    scientificEarthCore.x + observerRadialDirection.x * referenceEarthSphereRadiusMeters,
    scientificEarthCore.y + observerRadialDirection.y * referenceEarthSphereRadiusMeters,
    scientificEarthCore.z + observerRadialDirection.z * referenceEarthSphereRadiusMeters,
  );
  const earthCoreAnchor = encodeGeocentricFiniteAnchor(
    scientificEarthCore,
    scientificCelestialGridRadiusMeters,
  );
  const observerAnchor = encodeGeocentricFiniteAnchor(
    scientificObserver,
    scientificCelestialGridRadiusMeters,
  );
  const referenceEarthSphereSurfaceAnchor = encodeGeocentricFiniteAnchor(
    referenceEarthSphereSurfacePoint,
    scientificCelestialGridRadiusMeters,
  );
  const localEastDirectionAnchor = encodeGeocentricDirection(localEast);
  const localNorthDirectionAnchor = encodeGeocentricDirection(localNorth);
  const localUpDirectionAnchor = encodeGeocentricDirection(localUp);
  if (
    earthCoreAnchor.kind === 'not-ready' || observerAnchor.kind === 'not-ready' ||
    referenceEarthSphereSurfaceAnchor.kind === 'not-ready' ||
    localEastDirectionAnchor.kind === 'not-ready' || localNorthDirectionAnchor.kind === 'not-ready' ||
    localUpDirectionAnchor.kind === 'not-ready'
  ) {
    return failure('INVALID_GEOCENTRIC_STRUCTURE', 'Observer-offset presentation could not encode a validated shared anchor.');
  }
  const maximumUploadedComponentMagnitude = largestComponent(
    earthCoreAnchor,
    observerAnchor,
    referenceEarthSphereSurfaceAnchor,
  );
  if (maximumUploadedComponentMagnitude > OBSERVER_OFFSET_GEOCENTRIC_GPU_COMPONENT_BUDGET) {
    return failure('GPU_COMPONENT_BUDGET_EXCEEDED', 'Observer-offset finite anchors exceed the validated bounded GPU component budget.');
  }

  const encodeFiniteAnchor = (value: ApplicationBasisPosition): FiniteAnchorResult => {
    const encoded = encodeGeocentricFiniteAnchor(value, scientificCelestialGridRadiusMeters);
    if (encoded.kind === 'not-ready') return encoded;
    return largestComponent(encoded) <= OBSERVER_OFFSET_GEOCENTRIC_GPU_COMPONENT_BUDGET
      ? encoded
      : failure('GPU_COMPONENT_BUDGET_EXCEEDED', 'Requested finite anchor exceeds the bounded GPU component budget.');
  };
  const encodeOffsetFromCore = (
    value: ApplicationBasisDirection,
    distanceMeters: number,
  ): FiniteAnchorResult => {
    if (!validDirection(value)) return failure('INVALID_DIRECTION', 'Offset anchor requires a finite normalized direction.');
    if (!Number.isFinite(distanceMeters)) return failure('INVALID_DISTANCE', 'Offset anchor requires a finite distance.');
    return encodeFiniteAnchor(point(
      scientificEarthCore.x + value.x * distanceMeters,
      scientificEarthCore.y + value.y * distanceMeters,
      scientificEarthCore.z + value.z * distanceMeters,
    ));
  };
  const encodeTangentPoint = (
    eastOffsetMeters: number,
    northOffsetMeters: number,
  ): FiniteAnchorResult => {
    if (!finite([eastOffsetMeters, northOffsetMeters])) {
      return failure('INVALID_DISTANCE', 'Tangent point offsets require finite meters.');
    }
    return encodeFiniteAnchor(point(
      scientificObserver.x + localEast.x * eastOffsetMeters + localNorth.x * northOffsetMeters,
      scientificObserver.y + localEast.y * eastOffsetMeters + localNorth.y * northOffsetMeters,
      scientificObserver.z + localEast.z * eastOffsetMeters + localNorth.z * northOffsetMeters,
    ));
  };

  return Object.freeze({
    kind: 'OBSERVER_OFFSET_GEOCENTRIC_PRESENTATION',
    validity: 'VALIDATED',
    coordinateFrameIdentity: 'APPLICATION_BASIS_UNCALIBRATED_BELOW_ONE_GEOGRAPHIC_PARENT',
    presentationScale: 'RATIO_PRESERVING_FINITE_HOMOGENEOUS_ANCHORS_SCALED_BY_CELESTIAL_GRID_RADIUS',
    geocentricStructure: structure,
    scientificEarthCore,
    scientificObserver,
    scientificObserverToCore: observerToCore,
    scientificObserverToCoreDistanceMeters: observerToCoreDistanceMeters,
    scientificEarthReferenceRadiusMeters: referenceEarthSphereRadiusMeters,
    scientificCelestialGridRadiusMeters,
    observerRadialDirection,
    localEast,
    localNorth,
    localUp,
    referenceEarthSphereSurfacePoint,
    referenceEarthSphereRadiusMeters,
    ellipsoidToReferenceSphereOffsetMeters:
      observerToCoreDistanceMeters - referenceEarthSphereRadiusMeters,
    earthCoreAnchor,
    observerAnchor,
    referenceEarthSphereSurfaceAnchor,
    localEastDirectionAnchor,
    localNorthDirectionAnchor,
    localUpDirectionAnchor,
    maximumUploadedComponentMagnitude,
    encodeFiniteAnchor,
    encodeOffsetFromCore,
    encodeTangentPoint,
  });
}
