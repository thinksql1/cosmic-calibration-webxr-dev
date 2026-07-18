import type { EnuUnitDirection, ValidatedObserver } from '../astronomy/types';
import type { ObserverHorizontalEarthAxis } from './observerHorizontalEarthAxis';

const DEGREES_TO_RADIANS = Math.PI / 180;

export const WGS84_SEMI_MAJOR_AXIS_METERS = 6_378_137;
export const WGS84_INVERSE_FLATTENING = 298.257_223_563;

export interface EnuPositionMeters {
  readonly frame: 'HORIZONTAL_ENU';
  readonly units: 'meters';
  readonly east: number;
  readonly north: number;
  readonly up: number;
}

export interface ObserverGeocentricEarthAxis {
  readonly kind: 'OBSERVER_GEOCENTRIC_EARTH_AXIS';
  readonly earthModel: 'WGS84_REFERENCE_ELLIPSOID';
  readonly centerModel: 'MODELED_WGS84_EARTH_CENTER';
  readonly presentationTopology: 'GEOCENTRIC_LINE_WITH_PROJECTIVE_POLES_AT_INFINITY';
  readonly outputFrame: 'HORIZONTAL_ENU';
  readonly observerSurfaceOrigin: EnuPositionMeters;
  readonly earthCore: EnuPositionMeters;
  readonly northDirection: EnuUnitDirection;
  readonly southDirection: EnuUnitDirection;
  readonly observerToCoreDistanceMeters: number;
  readonly observerToAxisDistanceMeters: number;
  readonly elevationTreatment:
    | 'WGS84_ELLIPSOID_HEIGHT'
    | 'MEAN_SEA_LEVEL_NUMERICALLY_APPROXIMATED_AS_ELLIPSOID_HEIGHT_TIER_1';
}

function position(east: number, north: number, up: number): EnuPositionMeters {
  if (![east, north, up].every(Number.isFinite)) {
    throw new Error('Geocentric Earth-axis placement requires finite ENU coordinates.');
  }
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'meters',
    east,
    north,
    up,
  });
}

function exactAntipode(direction: EnuUnitDirection): EnuUnitDirection {
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: -direction.east,
    north: -direction.north,
    up: -direction.up,
  });
}

function ownDirection(direction: EnuUnitDirection): EnuUnitDirection {
  const length = Math.hypot(direction.east, direction.north, direction.up);
  if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-12) {
    throw new Error('Geocentric Earth-axis placement requires a unit ENU direction.');
  }
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: direction.east,
    north: direction.north,
    up: direction.up,
  });
}

/**
 * Places the WGS84 Earth center in the observer's local tangent ENU frame.
 *
 * The local origin is the modeled observer surface point. The geocentric axis
 * is the line through `earthCore` parallel to the validated P03 mean-axis
 * direction. NCP/SCP are projective directions at infinity on that one line;
 * no finite astronomical pole distance is invented here.
 */
export function createObserverGeocentricEarthAxis(
  horizontalAxis: ObserverHorizontalEarthAxis,
  observer: ValidatedObserver,
): ObserverGeocentricEarthAxis {
  if (
    horizontalAxis.outputFrame !== 'HORIZONTAL_ENU' ||
    horizontalAxis.model !== 'IAU_P03_PRECESSION_ONLY'
  ) {
    throw new Error('Geocentric placement requires the validated P03 horizontal-axis contract.');
  }

  const latitude = observer.latitudeDeg * DEGREES_TO_RADIANS;
  const longitude = observer.longitudeDegEast * DEGREES_TO_RADIANS;
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const sinLongitude = Math.sin(longitude);
  const cosLongitude = Math.cos(longitude);
  const flattening = 1 / WGS84_INVERSE_FLATTENING;
  const eccentricitySquared = flattening * (2 - flattening);
  const primeVerticalRadius = WGS84_SEMI_MAJOR_AXIS_METERS /
    Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);
  const height = observer.elevationMeters;

  const observerEcef = {
    x: (primeVerticalRadius + height) * cosLatitude * cosLongitude,
    y: (primeVerticalRadius + height) * cosLatitude * sinLongitude,
    z: (primeVerticalRadius * (1 - eccentricitySquared) + height) * sinLatitude,
  };
  const centerDelta = {
    x: -observerEcef.x,
    y: -observerEcef.y,
    z: -observerEcef.z,
  };

  const earthCore = position(
    -sinLongitude * centerDelta.x + cosLongitude * centerDelta.y,
    -sinLatitude * cosLongitude * centerDelta.x -
      sinLatitude * sinLongitude * centerDelta.y +
      cosLatitude * centerDelta.z,
    cosLatitude * cosLongitude * centerDelta.x +
      cosLatitude * sinLongitude * centerDelta.y +
      sinLatitude * centerDelta.z,
  );
  const northDirection = ownDirection(horizontalAxis.north.direction);
  const southDirection = exactAntipode(northDirection);
  const coreDotAxis =
    earthCore.east * northDirection.east +
    earthCore.north * northDirection.north +
    earthCore.up * northDirection.up;
  const closestAxisPoint = {
    east: earthCore.east - northDirection.east * coreDotAxis,
    north: earthCore.north - northDirection.north * coreDotAxis,
    up: earthCore.up - northDirection.up * coreDotAxis,
  };

  return Object.freeze({
    kind: 'OBSERVER_GEOCENTRIC_EARTH_AXIS',
    earthModel: 'WGS84_REFERENCE_ELLIPSOID',
    centerModel: 'MODELED_WGS84_EARTH_CENTER',
    presentationTopology: 'GEOCENTRIC_LINE_WITH_PROJECTIVE_POLES_AT_INFINITY',
    outputFrame: 'HORIZONTAL_ENU',
    observerSurfaceOrigin: position(0, 0, 0),
    earthCore,
    northDirection,
    southDirection,
    observerToCoreDistanceMeters: Math.hypot(
      earthCore.east,
      earthCore.north,
      earthCore.up,
    ),
    observerToAxisDistanceMeters: Math.hypot(
      closestAxisPoint.east,
      closestAxisPoint.north,
      closestAxisPoint.up,
    ),
    elevationTreatment: observer.verticalDatum === 'WGS84_ELLIPSOID'
      ? 'WGS84_ELLIPSOID_HEIGHT'
      : 'MEAN_SEA_LEVEL_NUMERICALLY_APPROXIMATED_AS_ELLIPSOID_HEIGHT_TIER_1',
  });
}
