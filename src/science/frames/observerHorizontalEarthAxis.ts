import { AstronomyContractError } from '../astronomy/errors';
import type {
  CartesianUnitDirection,
  EnuUnitDirection,
  MeanPoleResult,
  SimulationInstant,
  ValidatedObserver,
} from '../astronomy/types';

const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const FRAME_ALIGNMENT_TOLERANCE = 1e-12;
const HORIZON_TOLERANCE = 1e-12;

export type PoleHorizonRelation = 'above' | 'on' | 'below';

export interface ObserverHorizontalPole {
  readonly pole: 'NCP_MEAN' | 'SCP_MEAN';
  readonly direction: EnuUnitDirection;
  readonly azimuthDeg: number | null;
  readonly altitudeDeg: number;
  readonly horizonRelation: PoleHorizonRelation;
}

export interface ObserverHorizontalEarthAxis {
  readonly kind: 'OBSERVER_HORIZONTAL_EARTH_AXIS';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly poleKind: 'MEAN';
  readonly sourceFrame: 'GCRS';
  readonly meanDateFrame: 'P03_MEAN_EQUATOR_OF_DATE';
  readonly earthFixedFrame: 'WGS84_EARTH_FIXED_MEAN_AXIS';
  readonly outputFrame: 'HORIZONTAL_ENU';
  readonly horizontalModel: 'WGS84_GEODETIC_GEOMETRIC_AIRLESS';
  readonly earthRotationTreatment: 'MEAN_AXIS_INVARIANT_UNDER_EARTH_ROTATION';
  readonly meanDateNorth: CartesianUnitDirection<'P03_MEAN_EQUATOR_OF_DATE'>;
  readonly meanDateAlignmentResidual: number;
  readonly north: ObserverHorizontalPole;
  readonly south: ObserverHorizontalPole;
  readonly observer: {
    readonly geodeticLatitudeDeg: number;
    readonly longitudeDegEast: number;
    readonly elevationMeters: number;
    readonly horizontalDatum: 'WGS84';
  };
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
    readonly simulationInstant: SimulationInstant;
    readonly sourceVectorFrame: 'GCRS';
    readonly matrixTransform: 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE';
    readonly calibratedYawApplication: 'presentation-parent-only';
  };
}

function reject(message: string): never {
  throw new AstronomyContractError('UNSUPPORTED_FRAME_CONTRACT', message);
}

function multiplyMatrixVector(
  rows: MeanPoleResult['biasPrecessionMatrix']['rows'],
  vector: CartesianUnitDirection<'GCRS'>,
): readonly [number, number, number] {
  return Object.freeze(rows.map(
    (row) => row[0] * vector.x + row[1] * vector.y + row[2] * vector.z,
  )) as unknown as readonly [number, number, number];
}

function normalizeMeanDateDirection(
  value: readonly [number, number, number],
): CartesianUnitDirection<'P03_MEAN_EQUATOR_OF_DATE'> {
  const length = Math.hypot(...value);
  if (!Number.isFinite(length) || length === 0) {
    return reject('The P03 matrix did not produce a finite mean-date axis.');
  }
  return Object.freeze({
    frame: 'P03_MEAN_EQUATOR_OF_DATE',
    units: 'unitless',
    x: value[0] / length,
    y: value[1] / length,
    z: value[2] / length,
  });
}

/**
 * Full WGS84 geodetic Earth-fixed-to-ENU rotation. The selected scientific
 * axis is Earth-fixed +Z, so longitude cancels analytically; retaining the
 * complete rotation makes that invariance explicit instead of inferring a
 * pole direction from latitude alone.
 */
function earthFixedMeanAxisToEnu(observer: ValidatedObserver): EnuUnitDirection {
  const latitude = observer.latitudeDeg * DEGREES_TO_RADIANS;
  const longitude = observer.longitudeDegEast * DEGREES_TO_RADIANS;
  const sineLatitude = Math.sin(latitude);
  const cosineLatitude = Math.cos(latitude);
  const sineLongitude = Math.sin(longitude);
  const cosineLongitude = Math.cos(longitude);
  const earthFixedNorth = Object.freeze({ x: 0, y: 0, z: 1 });

  const east =
    -sineLongitude * earthFixedNorth.x +
    cosineLongitude * earthFixedNorth.y;
  const north =
    -sineLatitude * cosineLongitude * earthFixedNorth.x -
    sineLatitude * sineLongitude * earthFixedNorth.y +
    cosineLatitude * earthFixedNorth.z;
  const up =
    cosineLatitude * cosineLongitude * earthFixedNorth.x +
    cosineLatitude * sineLongitude * earthFixedNorth.y +
    sineLatitude * earthFixedNorth.z;
  const length = Math.hypot(east, north, up);
  if (!Number.isFinite(length) || length === 0) {
    return reject('The Earth-fixed mean axis did not produce a finite ENU direction.');
  }
  const clean = (component: number) =>
    Math.abs(component / length) <= Number.EPSILON * 4 ? 0 : component / length;
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: clean(east),
    north: clean(north),
    up: clean(up),
  });
}

function createPole(
  pole: ObserverHorizontalPole['pole'],
  direction: EnuUnitDirection,
): ObserverHorizontalPole {
  const horizontalLength = Math.hypot(direction.east, direction.north);
  const azimuthDeg = horizontalLength <= HORIZON_TOLERANCE
    ? null
    : ((Math.atan2(direction.east, direction.north) * RADIANS_TO_DEGREES) % 360 + 360) % 360;
  const altitudeDeg = Math.asin(Math.max(-1, Math.min(1, direction.up))) * RADIANS_TO_DEGREES;
  const horizonRelation: PoleHorizonRelation =
    direction.up > HORIZON_TOLERANCE
      ? 'above'
      : direction.up < -HORIZON_TOLERANCE
        ? 'below'
        : 'on';
  return Object.freeze({ pole, direction, azimuthDeg, altitudeDeg, horizonRelation });
}

/**
 * Proves the validated GCRS pole is the P03 mean-date +Z axis, then maps the
 * same mean rotation axis into the observer's WGS84 geodetic ENU frame. Earth
 * rotation about +Z does not alter the axis, so no sidereal-angle calculation
 * is required or fabricated for this axis-only milestone.
 */
export function createObserverHorizontalEarthAxis(
  earthAxis: MeanPoleResult,
  observer: ValidatedObserver,
): ObserverHorizontalEarthAxis {
  if (
    earthAxis.poleKind !== 'MEAN' ||
    earthAxis.model !== 'IAU_P03_PRECESSION_ONLY' ||
    earthAxis.vectorFrame !== 'GCRS' ||
    earthAxis.meanEquatorFrame !== 'P03_MEAN_EQUATOR_OF_DATE' ||
    earthAxis.north.frame !== 'GCRS' ||
    earthAxis.biasPrecessionMatrix.transform !== 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE' ||
    observer.kind !== 'VALIDATED_OBSERVER' ||
    observer.horizontalDatum !== 'WGS84'
  ) {
    return reject('Observer-horizontal Earth-axis conversion requires the validated P03 mean GCRS and WGS84 observer contracts.');
  }

  const matrixValues = earthAxis.biasPrecessionMatrix.rows.flat();
  if (!matrixValues.every(Number.isFinite)) {
    return reject('The P03 bias-precession matrix must contain only finite values.');
  }

  const meanDateNorth = normalizeMeanDateDirection(
    multiplyMatrixVector(earthAxis.biasPrecessionMatrix.rows, earthAxis.north),
  );
  const meanDateAlignmentResidual = Math.max(
    Math.abs(meanDateNorth.x),
    Math.abs(meanDateNorth.y),
    Math.abs(meanDateNorth.z - 1),
  );
  if (meanDateNorth.z <= 0 || meanDateAlignmentResidual > FRAME_ALIGNMENT_TOLERANCE) {
    return reject('The supplied GCRS pole and P03 matrix do not identify one coherent mean-date +Z axis.');
  }

  const northDirection = earthFixedMeanAxisToEnu(observer);
  const southDirection: EnuUnitDirection = Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: -northDirection.east,
    north: -northDirection.north,
    up: -northDirection.up,
  });

  return Object.freeze({
    kind: 'OBSERVER_HORIZONTAL_EARTH_AXIS',
    model: 'IAU_P03_PRECESSION_ONLY',
    poleKind: 'MEAN',
    sourceFrame: 'GCRS',
    meanDateFrame: 'P03_MEAN_EQUATOR_OF_DATE',
    earthFixedFrame: 'WGS84_EARTH_FIXED_MEAN_AXIS',
    outputFrame: 'HORIZONTAL_ENU',
    horizontalModel: 'WGS84_GEODETIC_GEOMETRIC_AIRLESS',
    earthRotationTreatment: 'MEAN_AXIS_INVARIANT_UNDER_EARTH_ROTATION',
    meanDateNorth,
    meanDateAlignmentResidual,
    north: createPole('NCP_MEAN', northDirection),
    south: createPole('SCP_MEAN', southDirection),
    observer: Object.freeze({
      geodeticLatitudeDeg: observer.latitudeDeg,
      longitudeDegEast: observer.longitudeDegEast,
      elevationMeters: observer.elevationMeters,
      horizontalDatum: 'WGS84',
    }),
    provenance: Object.freeze({
      provider: earthAxis.provenance.provider,
      providerVersion: earthAxis.provenance.providerVersion,
      simulationInstant: earthAxis.provenance.simulationInstant,
      sourceVectorFrame: 'GCRS',
      matrixTransform: 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE',
      calibratedYawApplication: 'presentation-parent-only',
    }),
  });
}
