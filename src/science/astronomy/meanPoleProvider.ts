import { AstronomyContractError } from './errors';
import { normalizeCartesianDirection } from './frameTransforms';
import {
  CORRECTION_PROFILES,
  type MeanPoleProvenance,
  type MeanPoleRequest,
  type MeanPoleResult,
  type RotationRow,
  type TaggedRotationMatrix,
  type TerrestrialTimeProvider,
} from './types';

const JULIAN_DATE_J2000 = 2_451_545;
const DAYS_PER_JULIAN_CENTURY = 36_525;
const ARCSECONDS_TO_RADIANS = Math.PI / (180 * 3_600);
const MINIMUM_VALIDATED_CENTURIES = -1;
const MAXIMUM_VALIDATED_CENTURIES = 1;

export const P03_MEAN_POLE_PROVIDER = 'Cosmic Calibration P03 mean-pole provider';
export const P03_MEAN_POLE_PROVIDER_VERSION = '1.0.0';

type Matrix3 = readonly [RotationRow, RotationRow, RotationRow];

function polynomial(
  t: number,
  coefficients: readonly [number, number, number, number, number, number],
): number {
  return coefficients.reduceRight(
    (value, coefficient) => coefficient + t * value,
  );
}

function rotationX(angle: number): Matrix3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    [1, 0, 0],
    [0, cosine, sine],
    [0, -sine, cosine],
  ];
}

function rotationZ(angle: number): Matrix3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    [cosine, sine, 0],
    [-sine, cosine, 0],
    [0, 0, 1],
  ];
}

function multiply(left: Matrix3, right: Matrix3): Matrix3 {
  const result = Array.from({ length: 3 }, () => [0, 0, 0]);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      for (let index = 0; index < 3; index += 1) {
        result[row]![column]! += left[row]![index]! * right[index]![column]!;
      }
    }
  }
  return result as unknown as Matrix3;
}

/**
 * Independent TypeScript implementation of the published P03
 * Fukushima-Williams angles and rotation composition. IAU SOFA pmat06 is
 * used as an external validation reference; this routine is not SOFA code
 * and is not represented as software supplied or endorsed by SOFA.
 *
 * The returned passive matrix has the documented direction:
 * V(mean equator/equinox of date) = matrix * V(GCRS).
 */
export function computeP03BiasPrecessionMatrix(
  julianDateTt: number,
): TaggedRotationMatrix {
  if (!Number.isFinite(julianDateTt)) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'P03 precession requires a finite Julian date in TT.',
    );
  }

  const t = (julianDateTt - JULIAN_DATE_J2000) / DAYS_PER_JULIAN_CENTURY;

  const gammaBar =
    polynomial(t, [
      -0.052928,
      10.556378,
      0.4932044,
      -0.00031238,
      -0.000002788,
      0.000000026,
    ]) * ARCSECONDS_TO_RADIANS;
  const phiBar =
    polynomial(t, [
      84_381.412819,
      -46.811016,
      0.0511268,
      0.00053289,
      -0.00000044,
      -0.0000000176,
    ]) * ARCSECONDS_TO_RADIANS;
  const psiBar =
    polynomial(t, [
      -0.041775,
      5_038.481484,
      1.5584175,
      -0.00018522,
      -0.000026452,
      -0.0000000148,
    ]) * ARCSECONDS_TO_RADIANS;
  const meanObliquity =
    polynomial(t, [
      84_381.406,
      -46.836769,
      -0.0001831,
      0.0020034,
      -0.000000576,
      -0.0000000434,
    ]) * ARCSECONDS_TO_RADIANS;

  // Within the bounded +/-1-century provider domain, the published angles
  // are passed directly to sin/cos. No modulo wrapping is needed or hidden;
  // the resulting pole direction is normalized at the typed output boundary.

  const rows = multiply(
    rotationX(-meanObliquity),
    multiply(
      rotationZ(-psiBar),
      multiply(rotationX(phiBar), rotationZ(gammaBar)),
    ),
  );

  return Object.freeze({
    transform: 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE',
    rows: Object.freeze(
      rows.map((row) => Object.freeze([...row])) as unknown as Matrix3,
    ),
  });
}

export class P03MeanPoleProvider {
  constructor(private readonly timeProvider: TerrestrialTimeProvider) {}

  getMeanPole(request: MeanPoleRequest): MeanPoleResult {
    if (
      request.sourceFrame !== 'GCRS' ||
      request.modelReferenceEpoch !== 'J2000.0' ||
      request.outputFrame !== 'P03_MEAN_EQUATOR_OF_DATE'
    ) {
      throw new AstronomyContractError(
        'UNSUPPORTED_FRAME_CONTRACT',
        'P03 mean-pole requests must declare GCRS as the source frame, J2000.0 as the model reference epoch, and P03 mean equator/equinox of date as the matrix output frame.',
      );
    }

    const { instant } = request;
    const time = this.timeProvider.toTerrestrialTime(instant);
    if (
      !Number.isFinite(time.julianDateTt) ||
      !Number.isFinite(time.julianCenturiesSinceJ2000) ||
      !Number.isFinite(time.deltaTSeconds)
    ) {
      throw new AstronomyContractError(
        'INVALID_INSTANT',
        'Mean-pole time provider returned a non-finite TT value.',
      );
    }
    const derivedJulianCenturies =
      (time.julianDateTt - JULIAN_DATE_J2000) / DAYS_PER_JULIAN_CENTURY;
    if (
      Math.abs(derivedJulianCenturies - time.julianCenturiesSinceJ2000) >
      1e-12
    ) {
      throw new AstronomyContractError(
        'INVALID_INSTANT',
        'Mean-pole TT Julian date and Julian-century fields are inconsistent.',
      );
    }
    if (
      derivedJulianCenturies < MINIMUM_VALIDATED_CENTURIES ||
      derivedJulianCenturies > MAXIMUM_VALIDATED_CENTURIES
    ) {
      throw new AstronomyContractError(
        'MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN',
        'P03 mean-pole output is validated only for J2000.0 +/- 1 Julian century.',
      );
    }

    const biasPrecessionMatrix = computeP03BiasPrecessionMatrix(
      time.julianDateTt,
    );
    // Transpose(matrix) * [0, 0, 1] is the third row: the mean-date +Z
    // axis expressed in GCRS.
    const meanDateNorthInGcrs = biasPrecessionMatrix.rows[2];
    const north = normalizeCartesianDirection(
      'GCRS',
      ...meanDateNorthInGcrs,
    );
    const south = Object.freeze({
      frame: 'GCRS' as const,
      units: 'unitless' as const,
      x: -north.x,
      y: -north.y,
      z: -north.z,
    });
    const provenance: MeanPoleProvenance = Object.freeze({
      provider: P03_MEAN_POLE_PROVIDER,
      providerVersion: P03_MEAN_POLE_PROVIDER_VERSION,
      simulationInstant: instant,
      matrixSourceFrame: 'GCRS',
      matrixOutputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
      poleVectorFrame: 'GCRS',
      correctionProfile: CORRECTION_PROFILES.IAU_P03_MEAN_PRECESSION_ONLY,
    });

    return Object.freeze({
      poleKind: 'MEAN',
      model: 'IAU_P03_PRECESSION_ONLY',
      modelReference:
        'Capitaine, Wallace, and Chapront (2003) P03; IAU 2006 Resolution 1; checked against IAU SOFA pmat06 release 2023-10-11',
      referenceEpoch: 'J2000.0',
      vectorFrame: 'GCRS',
      meanEquatorFrame: 'P03_MEAN_EQUATOR_OF_DATE',
      north,
      south,
      biasPrecessionMatrix,
      correctionProfile: CORRECTION_PROFILES.IAU_P03_MEAN_PRECESSION_ONLY,
      validDomain: Object.freeze({
        minimumJulianCenturiesSinceJ2000: -1,
        maximumJulianCenturiesSinceJ2000: 1,
      }),
      time,
      provenance,
    });
  }
}
