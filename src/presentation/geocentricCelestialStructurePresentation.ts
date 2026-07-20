import type { EnuUnitDirection } from '../science/astronomy/types';
import { WGS84_SEMI_MAJOR_AXIS_METERS } from '../science/frames/observerGeocentricEarthAxis';
import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import {
  mapEnuPositionToApplicationBasis,
  mapEnuToApplicationBasis,
  type ApplicationBasisDirection,
  type ApplicationBasisPosition,
} from './mapEnuToApplicationBasis';

/**
 * A bounded reference cross-section of the infinite celestial-equatorial plane.
 * Two WGS84 equatorial radii keeps the observer inside the explanatory ring,
 * avoids a camera/ring coincidence at latitude zero, and remains traceable to
 * Earth scale without claiming a physical celestial-sphere distance.
 */
export const GEOCENTRIC_EQUATOR_DISPLAY_RADIUS_METERS =
  WGS84_SEMI_MAJOR_AXIS_METERS * 2;

export interface GeocentricCelestialStructurePresentation {
  readonly kind: 'GEOCENTRIC_CELESTIAL_STRUCTURE_PRESENTATION';
  readonly validity: 'VALIDATED';
  readonly geometryContract:
    'ONE_EARTH_CORE_ONE_AXIS_ONE_PERPENDICULAR_EQUATORIAL_PLANE';
  readonly coordinateFrameIdentity:
    'APPLICATION_BASIS_UNCALIBRATED_BELOW_ONE_GEOGRAPHIC_PARENT';
  readonly earthCore: ApplicationBasisPosition;
  readonly observerSurfaceOrigin: ApplicationBasisPosition;
  readonly northAxisDirectionEnu: EnuUnitDirection;
  readonly southAxisDirectionEnu: EnuUnitDirection;
  readonly northAxisDirection: ApplicationBasisDirection;
  readonly southAxisDirection: ApplicationBasisDirection;
  readonly equatorialPlaneNormal: ApplicationBasisDirection;
  readonly equatorialBasisFirstEnu: EnuUnitDirection;
  readonly equatorialBasisSecondEnu: EnuUnitDirection;
  readonly equatorialBasisFirst: ApplicationBasisDirection;
  readonly equatorialBasisSecond: ApplicationBasisDirection;
  readonly celestialEquatorCenter: ApplicationBasisPosition;
  readonly celestialEquatorDisplayRadiusMeters: number;
  readonly celestialEquatorRepresentation:
    'FINITE_BOUNDED_REFERENCE_RING_IN_INFINITE_EARTH_EQUATORIAL_PLANE';
  readonly northCelestialPoleDirection: ApplicationBasisDirection;
  readonly southCelestialPoleDirection: ApplicationBasisDirection;
  readonly observerRevision: number;
  readonly calibrationRevision: number;
  readonly acceptedCalibrationRevision: number | null;
  readonly timeRevision: number;
  readonly configurationRevision: number;
  readonly snapshotCacheKey: string;
  readonly provenance: {
    readonly model: 'IAU_P03_PRECESSION_ONLY';
    readonly provider: string;
    readonly providerVersion: string;
    readonly sourceBasisFrame: 'GCRS';
    readonly simulationInstantUtc: string;
    readonly earthModel: 'WGS84_REFERENCE_ELLIPSOID';
  };
}

function dot(
  left: ApplicationBasisDirection,
  right: ApplicationBasisDirection,
): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function length(value: ApplicationBasisDirection): number {
  return Math.hypot(value.x, value.y, value.z);
}

function dotEnu(left: EnuUnitDirection, right: EnuUnitDirection): number {
  return left.east * right.east + left.north * right.north + left.up * right.up;
}

function exactAntipodeEnu(direction: EnuUnitDirection): EnuUnitDirection {
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: -direction.east,
    north: -direction.north,
    up: -direction.up,
  });
}

function exactAntipodeApplication(
  direction: ApplicationBasisDirection,
): ApplicationBasisDirection {
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: -direction.x,
    y: -direction.y,
    z: -direction.z,
  });
}

/**
 * Creates the only presentation-owned source for the finite Earth core,
 * rotational spindle, projective poles, and Earth-core-centred equatorial
 * plane. Geographic yaw is deliberately absent and remains parent-only.
 */
export function createGeocentricCelestialStructurePresentation(
  snapshot: ScientificSnapshot,
): GeocentricCelestialStructurePresentation {
  const placement = snapshot.observerGeocentricEarthAxis;
  const equator = snapshot.observerHorizontalEquator;
  if (
    snapshot.kind !== 'ready' ||
    placement.centerModel !== 'MODELED_WGS84_EARTH_CENTER' ||
    placement.earthModel !== 'WGS84_REFERENCE_ELLIPSOID' ||
    equator.frame !== 'HORIZONTAL_ENU' ||
    equator.model !== 'IAU_P03_PRECESSION_ONLY' ||
    equator.sourceBasisFrame !== 'GCRS' ||
    equator.provenance.provider !== snapshot.earthAxis.provenance.provider ||
    equator.provenance.providerVersion !== snapshot.earthAxis.provenance.providerVersion
  ) {
    throw new Error(
      'Geocentric celestial structure requires one validated WGS84 core and P03 equatorial plane.',
    );
  }

  const earthCore = mapEnuPositionToApplicationBasis(placement.earthCore);
  const observerSurfaceOrigin = mapEnuPositionToApplicationBasis(
    placement.observerSurfaceOrigin,
  );
  const northAxisDirection = mapEnuToApplicationBasis(placement.northDirection);
  const southAxisDirection = exactAntipodeApplication(northAxisDirection);
  const northAxisDirectionEnu = placement.northDirection;
  const southAxisDirectionEnu = exactAntipodeEnu(northAxisDirectionEnu);
  const equatorialBasisFirst = mapEnuToApplicationBasis(equator.first);
  const equatorialBasisSecond = mapEnuToApplicationBasis(equator.second);

  if (
    Math.abs(length(northAxisDirection) - 1) > 1e-12 ||
    Math.abs(length(equatorialBasisFirst) - 1) > 1e-12 ||
    Math.abs(length(equatorialBasisSecond) - 1) > 1e-12 ||
    Math.abs(dotEnu(equator.normal, placement.northDirection) - 1) > 1e-12 ||
    Math.abs(dot(northAxisDirection, equatorialBasisFirst)) > 1e-12 ||
    Math.abs(dot(northAxisDirection, equatorialBasisSecond)) > 1e-12 ||
    Math.abs(dot(equatorialBasisFirst, equatorialBasisSecond)) > 1e-12 ||
    placement.southDirection.east !== -placement.northDirection.east ||
    placement.southDirection.north !== -placement.northDirection.north ||
    placement.southDirection.up !== -placement.northDirection.up
  ) {
    throw new Error(
      'Geocentric celestial structure requires one unit axis and one perpendicular orthonormal equatorial basis.',
    );
  }

  return Object.freeze({
    kind: 'GEOCENTRIC_CELESTIAL_STRUCTURE_PRESENTATION',
    validity: 'VALIDATED',
    geometryContract: 'ONE_EARTH_CORE_ONE_AXIS_ONE_PERPENDICULAR_EQUATORIAL_PLANE',
    coordinateFrameIdentity:
      'APPLICATION_BASIS_UNCALIBRATED_BELOW_ONE_GEOGRAPHIC_PARENT',
    earthCore,
    observerSurfaceOrigin,
    northAxisDirectionEnu,
    southAxisDirectionEnu,
    northAxisDirection,
    southAxisDirection,
    equatorialPlaneNormal: northAxisDirection,
    equatorialBasisFirstEnu: equator.first,
    equatorialBasisSecondEnu: equator.second,
    equatorialBasisFirst,
    equatorialBasisSecond,
    celestialEquatorCenter: earthCore,
    celestialEquatorDisplayRadiusMeters: GEOCENTRIC_EQUATOR_DISPLAY_RADIUS_METERS,
    celestialEquatorRepresentation:
      'FINITE_BOUNDED_REFERENCE_RING_IN_INFINITE_EARTH_EQUATORIAL_PLANE',
    northCelestialPoleDirection: northAxisDirection,
    southCelestialPoleDirection: southAxisDirection,
    observerRevision: snapshot.revisions.observer,
    calibrationRevision: snapshot.revisions.geographicCalibration,
    acceptedCalibrationRevision:
      snapshot.geographicCalibration.acceptedCalibrationRevision ?? null,
    timeRevision: snapshot.revisions.time,
    configurationRevision: snapshot.revisions.configuration,
    snapshotCacheKey: snapshot.cacheKey,
    provenance: Object.freeze({
      model: 'IAU_P03_PRECESSION_ONLY',
      provider: snapshot.earthAxis.provenance.provider,
      providerVersion: snapshot.earthAxis.provenance.providerVersion,
      sourceBasisFrame: 'GCRS',
      simulationInstantUtc: snapshot.clock.instant.utcIso,
      earthModel: 'WGS84_REFERENCE_ELLIPSOID',
    }),
  });
}
