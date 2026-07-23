import {
  getAstronomyEngineRealSkyRotations,
  type AstronomyEngineRotationRows,
} from './astronomyEngineAdapter';
import { ASTRONOMY_ENGINE_VERSION } from '../providers/astronomyProviderIdentity';
import type {
  CartesianUnitDirection,
  EnuUnitDirection,
  SimulationInstant,
  ValidatedObserver,
} from './types';

export type Matrix3Rows = AstronomyEngineRotationRows;

export interface RealSkyApplicationDirection {
  readonly frame: 'APPLICATION_BASIS';
  readonly units: 'unitless';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RealSkyEquatorialOrientationReady {
  readonly kind: 'ready';
  readonly provider: 'Astronomy Engine';
  readonly providerVersion: typeof ASTRONOMY_ENGINE_VERSION;
  readonly catalogFrame: 'EQJ_J2000';
  readonly gridFrame: 'EQD_TRUE';
  readonly outputFrame: 'HORIZONTAL_ENU';
  readonly refractionPolicy: 'GEOMETRIC_AIRLESS_RIGID_ROTATION';
  readonly instant: SimulationInstant;
  readonly observer: ValidatedObserver;
  readonly greenwichApparentSiderealTimeHours: number;
  readonly eqjToEqdRows: Matrix3Rows;
  readonly eqdToHorRows: Matrix3Rows;
  readonly eqjToHorRows: Matrix3Rows;
  readonly horToApplicationRows: Matrix3Rows;
  readonly eqjToApplicationRows: Matrix3Rows;
  readonly eqdToApplicationRows: Matrix3Rows;
  readonly gridBasisApplication: {
    readonly zeroLongitude: RealSkyApplicationDirection;
    readonly positiveNinetyLongitude: RealSkyApplicationDirection;
    readonly northPole: RealSkyApplicationDirection;
  };
  readonly determinant: number;
  readonly orthonormalityError: number;
  readonly inverseRoundTripError: number;
  readonly elevationAffectsRigidRotation: false;
}

export interface RealSkyEquatorialOrientationFailure {
  readonly kind: 'not-ready';
  readonly code:
    | 'INVALID_INSTANT'
    | 'INVALID_OBSERVER'
    | 'MISSING_PROVIDER_ROTATION_API'
    | 'NON_FINITE_ROTATION'
    | 'NON_RIGID_ROTATION';
  readonly reason: string;
}

export type RealSkyEquatorialOrientation =
  | RealSkyEquatorialOrientationReady
  | RealSkyEquatorialOrientationFailure;

export interface EquatorialDirectionReady {
  readonly kind: 'ready';
  readonly sourceFrame: 'EQJ_J2000' | 'EQD_TRUE';
  readonly outputFrame: 'HORIZONTAL_ENU';
  readonly rightAscensionHours: number;
  readonly declinationDeg: number;
  readonly sourceDirection: CartesianUnitDirection<'EQJ_J2000' | 'EQD_TRUE'>;
  readonly direction: EnuUnitDirection;
}

export interface EquatorialDirectionFailure {
  readonly kind: 'not-ready';
  readonly code: 'ORIENTATION_NOT_READY' | 'INVALID_RIGHT_ASCENSION' | 'INVALID_DECLINATION' | 'NON_FINITE_DIRECTION';
  readonly reason: string;
}

export type EquatorialDirectionResult = EquatorialDirectionReady | EquatorialDirectionFailure;

export interface GridSourceBasis {
  readonly zeroLongitude: { readonly x: number; readonly y: number; readonly z: number };
  readonly positiveNinetyLongitude: { readonly x: number; readonly y: number; readonly z: number };
  readonly northPole: { readonly x: number; readonly y: number; readonly z: number };
}

export interface RealSkyGridRotationReady {
  readonly kind: 'ready';
  readonly rows: Matrix3Rows;
  readonly determinant: number;
  readonly orthonormalityError: number;
  readonly poleAlignmentErrorDeg: number;
}

export type RealSkyGridRotation = RealSkyGridRotationReady | EquatorialDirectionFailure;

export const ASTRONOMY_HOR_TO_APPLICATION_ROWS: Matrix3Rows = Object.freeze([
  Object.freeze([0, -1, 0] as const),
  Object.freeze([0, 0, 1] as const),
  Object.freeze([-1, 0, 0] as const),
]);

const IDENTITY: Matrix3Rows = Object.freeze([
  Object.freeze([1, 0, 0] as const),
  Object.freeze([0, 1, 0] as const),
  Object.freeze([0, 0, 1] as const),
]);

function failure(
  code: RealSkyEquatorialOrientationFailure['code'],
  reason: string,
): RealSkyEquatorialOrientationFailure {
  return Object.freeze({ kind: 'not-ready', code, reason });
}

function directionFailure(
  code: EquatorialDirectionFailure['code'],
  reason: string,
): EquatorialDirectionFailure {
  return Object.freeze({ kind: 'not-ready', code, reason });
}

function applyRows(
  rows: Matrix3Rows,
  vector: readonly [number, number, number],
): readonly [number, number, number] {
  return Object.freeze([
    rows[0][0] * vector[0] + rows[0][1] * vector[1] + rows[0][2] * vector[2],
    rows[1][0] * vector[0] + rows[1][1] * vector[1] + rows[1][2] * vector[2],
    rows[2][0] * vector[0] + rows[2][1] * vector[1] + rows[2][2] * vector[2],
  ]);
}

export function multiplyMatrix3Rows(left: Matrix3Rows, right: Matrix3Rows): Matrix3Rows {
  return Object.freeze(left.map((row) => Object.freeze([
    row[0] * right[0][0] + row[1] * right[1][0] + row[2] * right[2][0],
    row[0] * right[0][1] + row[1] * right[1][1] + row[2] * right[2][1],
    row[0] * right[0][2] + row[1] * right[1][2] + row[2] * right[2][2],
  ])) as unknown as Matrix3Rows);
}

export function transposeMatrix3Rows(rows: Matrix3Rows): Matrix3Rows {
  return Object.freeze([
    Object.freeze([rows[0][0], rows[1][0], rows[2][0]] as const),
    Object.freeze([rows[0][1], rows[1][1], rows[2][1]] as const),
    Object.freeze([rows[0][2], rows[1][2], rows[2][2]] as const),
  ]);
}

export function matrix3Determinant(rows: Matrix3Rows): number {
  return rows[0][0] * (rows[1][1] * rows[2][2] - rows[1][2] * rows[2][1])
    - rows[0][1] * (rows[1][0] * rows[2][2] - rows[1][2] * rows[2][0])
    + rows[0][2] * (rows[1][0] * rows[2][1] - rows[1][1] * rows[2][0]);
}

export function matrix3OrthonormalityError(rows: Matrix3Rows): number {
  const product = multiplyMatrix3Rows(rows, transposeMatrix3Rows(rows));
  return Math.max(...product.flatMap((row, rowIndex) => row.map(
    (value, columnIndex) => Math.abs(value - IDENTITY[rowIndex]![columnIndex]!),
  )));
}

function applicationDirection(
  rows: Matrix3Rows,
  source: readonly [number, number, number],
): RealSkyApplicationDirection {
  const value = applyRows(rows, source);
  const length = Math.hypot(...value);
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'unitless',
    x: value[0] / length,
    y: value[1] / length,
    z: value[2] / length,
  });
}

/**
 * Builds immutable provider-native rotations. Astronomy HOR is right-handed
 * `(north, west, up)`; the final proper remap is application `(east, up, -north)`.
 * Elevation is carried for provenance but does not affect this rigid rotation.
 */
export function createRealSkyEquatorialOrientation(
  instant: SimulationInstant,
  observer: ValidatedObserver,
): RealSkyEquatorialOrientation {
  if (!Number.isFinite(instant?.unixMilliseconds)) {
    return failure('INVALID_INSTANT', 'Real-sky orientation requires one finite central-clock instant.');
  }
  if (
    observer?.kind !== 'VALIDATED_OBSERVER'
    || ![observer.latitudeDeg, observer.longitudeDegEast, observer.elevationMeters].every(Number.isFinite)
    || observer.latitudeDeg < -90
    || observer.latitudeDeg > 90
    || observer.longitudeDegEast < -180
    || observer.longitudeDegEast > 180
  ) {
    return failure('INVALID_OBSERVER', 'Real-sky orientation requires one validated finite WGS84 observer.');
  }
  if (typeof getAstronomyEngineRealSkyRotations !== 'function') {
    return failure('MISSING_PROVIDER_ROTATION_API', 'Astronomy Engine rotation APIs are unavailable.');
  }
  try {
    const provider = getAstronomyEngineRealSkyRotations(instant, observer);
    const { eqjToEqdRows, eqdToHorRows, eqjToHorRows } = provider;
    const eqjToApplicationRows = multiplyMatrix3Rows(ASTRONOMY_HOR_TO_APPLICATION_ROWS, eqjToHorRows);
    const eqdToApplicationRows = multiplyMatrix3Rows(ASTRONOMY_HOR_TO_APPLICATION_ROWS, eqdToHorRows);
    const values = [
      ...eqjToEqdRows.flat(),
      ...eqdToHorRows.flat(),
      ...eqjToHorRows.flat(),
      ...eqjToApplicationRows.flat(),
      ...eqdToApplicationRows.flat(),
    ];
    if (!values.every(Number.isFinite)) {
      return failure('NON_FINITE_ROTATION', 'Astronomy Engine returned a non-finite rotation.');
    }
    const determinant = matrix3Determinant(eqjToApplicationRows);
    const orthonormalityError = matrix3OrthonormalityError(eqjToApplicationRows);
    const roundTrip = multiplyMatrix3Rows(
      transposeMatrix3Rows(eqjToApplicationRows),
      eqjToApplicationRows,
    );
    const inverseRoundTripError = Math.max(...roundTrip.flatMap((row, rowIndex) => row.map(
      (value, columnIndex) => Math.abs(value - IDENTITY[rowIndex]![columnIndex]!),
    )));
    if (Math.abs(determinant - 1) > 1e-10 || orthonormalityError > 1e-10) {
      return failure('NON_RIGID_ROTATION', 'EQJ-to-application transform is not a proper orthonormal rotation.');
    }
    return Object.freeze({
      kind: 'ready',
      provider: 'Astronomy Engine',
      providerVersion: ASTRONOMY_ENGINE_VERSION,
      catalogFrame: 'EQJ_J2000',
      gridFrame: 'EQD_TRUE',
      outputFrame: 'HORIZONTAL_ENU',
      refractionPolicy: 'GEOMETRIC_AIRLESS_RIGID_ROTATION',
      instant,
      observer,
      greenwichApparentSiderealTimeHours: provider.greenwichApparentSiderealTimeHours,
      eqjToEqdRows,
      eqdToHorRows,
      eqjToHorRows,
      horToApplicationRows: ASTRONOMY_HOR_TO_APPLICATION_ROWS,
      eqjToApplicationRows,
      eqdToApplicationRows,
      gridBasisApplication: Object.freeze({
        zeroLongitude: applicationDirection(eqdToApplicationRows, [1, 0, 0]),
        positiveNinetyLongitude: applicationDirection(eqdToApplicationRows, [0, 1, 0]),
        northPole: applicationDirection(eqdToApplicationRows, [0, 0, 1]),
      }),
      determinant,
      orthonormalityError,
      inverseRoundTripError,
      elevationAffectsRigidRotation: false,
    });
  } catch (error) {
    return failure(
      'NON_FINITE_ROTATION',
      `Astronomy Engine rotation failed locally: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function equatorialToHorizontal(
  rightAscensionHours: number,
  declinationDeg: number,
  orientation: RealSkyEquatorialOrientation,
  sourceFrame: 'EQJ_J2000' | 'EQD_TRUE',
): EquatorialDirectionResult {
  if (orientation.kind !== 'ready') {
    return directionFailure('ORIENTATION_NOT_READY', orientation.reason);
  }
  if (!Number.isFinite(rightAscensionHours)) {
    return directionFailure('INVALID_RIGHT_ASCENSION', 'Right ascension must be finite sidereal hours.');
  }
  if (!Number.isFinite(declinationDeg) || declinationDeg < -90 || declinationDeg > 90) {
    return directionFailure('INVALID_DECLINATION', 'Declination must be finite degrees within [-90, +90].');
  }
  const wrappedHours = ((rightAscensionHours % 24) + 24) % 24;
  const ra = wrappedHours * Math.PI / 12;
  const dec = declinationDeg * Math.PI / 180;
  const equatorialRadius = Math.cos(dec);
  const sourceTuple = Object.freeze([
    equatorialRadius * Math.cos(ra),
    equatorialRadius * Math.sin(ra),
    Math.sin(dec),
  ]) as readonly [number, number, number];
  const hor = applyRows(
    sourceFrame === 'EQJ_J2000' ? orientation.eqjToHorRows : orientation.eqdToHorRows,
    sourceTuple,
  );
  const length = Math.hypot(...hor);
  if (!Number.isFinite(length) || length === 0) {
    return directionFailure('NON_FINITE_DIRECTION', 'Provider rotation did not produce a finite non-zero direction.');
  }
  const sourceDirection = Object.freeze({
    frame: sourceFrame,
    units: 'unitless' as const,
    x: sourceTuple[0],
    y: sourceTuple[1],
    z: sourceTuple[2],
  });
  return Object.freeze({
    kind: 'ready',
    sourceFrame,
    outputFrame: 'HORIZONTAL_ENU',
    rightAscensionHours: wrappedHours,
    declinationDeg,
    sourceDirection,
    direction: Object.freeze({
      frame: 'HORIZONTAL_ENU',
      units: 'unitless',
      east: -hor[1] / length,
      north: hor[0] / length,
      up: hor[2] / length,
    }),
  });
}

/** Catalog contract: J2000 mean-equator RA hours/declination degrees to airless local ENU. */
export function catalogEquatorialJ2000ToHorizontalEnu(
  rightAscensionHours: number,
  declinationDeg: number,
  orientation: RealSkyEquatorialOrientation,
): EquatorialDirectionResult {
  return equatorialToHorizontal(rightAscensionHours, declinationDeg, orientation, 'EQJ_J2000');
}

/** Direct provider cross-check path for true equator/equinox-of-date coordinates. */
export function equatorialOfDateToHorizontalEnu(
  rightAscensionHours: number,
  declinationDeg: number,
  orientation: RealSkyEquatorialOrientation,
): EquatorialDirectionResult {
  return equatorialToHorizontal(rightAscensionHours, declinationDeg, orientation, 'EQD_TRUE');
}

/**
 * Rotates the already validated local grid basis to Astronomy Engine's
 * true-equator/equinox-of-date phase. This preserves the existing Earth-axis
 * pole exactly while replacing only the arbitrary longitude phase.
 */
export function createRealSkyGridDirectionRotation(
  sourceBasis: GridSourceBasis,
  orientation: RealSkyEquatorialOrientation,
): RealSkyGridRotation {
  if (orientation.kind !== 'ready') {
    return directionFailure('ORIENTATION_NOT_READY', orientation.reason);
  }
  const sourceRows: Matrix3Rows = Object.freeze([
    Object.freeze([sourceBasis.zeroLongitude.x, sourceBasis.positiveNinetyLongitude.x, sourceBasis.northPole.x] as const),
    Object.freeze([sourceBasis.zeroLongitude.y, sourceBasis.positiveNinetyLongitude.y, sourceBasis.northPole.y] as const),
    Object.freeze([sourceBasis.zeroLongitude.z, sourceBasis.positiveNinetyLongitude.z, sourceBasis.northPole.z] as const),
  ]);
  const target = orientation.gridBasisApplication;
  const targetRows: Matrix3Rows = Object.freeze([
    Object.freeze([target.zeroLongitude.x, target.positiveNinetyLongitude.x, target.northPole.x] as const),
    Object.freeze([target.zeroLongitude.y, target.positiveNinetyLongitude.y, target.northPole.y] as const),
    Object.freeze([target.zeroLongitude.z, target.positiveNinetyLongitude.z, target.northPole.z] as const),
  ]);
  const sourceError = matrix3OrthonormalityError(sourceRows);
  const targetError = matrix3OrthonormalityError(targetRows);
  if (
    ![...sourceRows.flat(), ...targetRows.flat()].every(Number.isFinite)
    || sourceError > 1e-10
    || targetError > 1e-10
  ) {
    return directionFailure('NON_FINITE_DIRECTION', 'Grid orientation requires finite orthonormal source and target bases.');
  }
  const rows = multiplyMatrix3Rows(targetRows, transposeMatrix3Rows(sourceRows));
  const determinant = matrix3Determinant(rows);
  const orthonormalityError = matrix3OrthonormalityError(rows);
  const transformedPole = applyRows(rows, [
    sourceBasis.northPole.x,
    sourceBasis.northPole.y,
    sourceBasis.northPole.z,
  ]);
  const poleDot = Math.max(-1, Math.min(1,
    transformedPole[0] * target.northPole.x
      + transformedPole[1] * target.northPole.y
      + transformedPole[2] * target.northPole.z,
  ));
  const poleAlignmentErrorDeg = Math.acos(poleDot) * 180 / Math.PI;
  const poleAlignmentResidual = Math.max(
    Math.abs(transformedPole[0] - target.northPole.x),
    Math.abs(transformedPole[1] - target.northPole.y),
    Math.abs(transformedPole[2] - target.northPole.z),
  );
  if (
    !Number.isFinite(determinant)
    || Math.abs(determinant - 1) > 1e-10
    || orthonormalityError > 1e-10
    || poleAlignmentResidual > 1e-10
  ) {
    return directionFailure('NON_FINITE_DIRECTION', 'Grid orientation did not preserve a proper rotation and exact pole convergence.');
  }
  return Object.freeze({ kind: 'ready', rows, determinant, orthonormalityError, poleAlignmentErrorDeg });
}
