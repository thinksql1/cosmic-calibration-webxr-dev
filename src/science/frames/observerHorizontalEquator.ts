import { AstronomyContractError } from '../astronomy/errors';
import type { EnuUnitDirection } from '../astronomy/types';
import type { MeanEquatorBasis } from './earthAxisState';
import type { ObserverHorizontalEarthAxis } from './observerHorizontalEarthAxis';

export interface ObserverHorizontalMeanEquator {
  readonly frame: 'HORIZONTAL_ENU';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly terminology: 'MEAN_EQUATOR_OF_DATE';
  readonly normal: EnuUnitDirection;
  readonly first: EnuUnitDirection;
  readonly second: EnuUnitDirection;
  readonly handedness: 'right-handed';
  readonly sourceBasisFrame: 'GCRS';
  readonly samplingPhase: 'LOCAL_CANONICAL_UNLABELED';
  readonly provenance: ObserverHorizontalEarthAxis['provenance'];
}

type EnuVector = Readonly<{ east: number; north: number; up: number }>;

function dot(left: EnuVector, right: EnuVector): number {
  return left.east * right.east + left.north * right.north + left.up * right.up;
}

function cross(left: EnuVector, right: EnuVector): EnuVector {
  return Object.freeze({
    east: left.north * right.up - left.up * right.north,
    north: left.up * right.east - left.east * right.up,
    up: left.east * right.north - left.north * right.east,
  });
}

function normalize(value: EnuVector): EnuUnitDirection {
  const length = Math.hypot(value.east, value.north, value.up);
  if (!Number.isFinite(length) || length === 0) {
    throw new AstronomyContractError(
      'UNSUPPORTED_FRAME_CONTRACT',
      'Observer-horizontal equator sampling requires finite, non-zero vectors.',
    );
  }
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: value.east / length,
    north: value.north / length,
    up: value.up / length,
  });
}

function validateSourceBasis(
  axis: ObserverHorizontalEarthAxis,
  basis: MeanEquatorBasis,
): void {
  const basisVectors = [basis.first, basis.second, basis.normal];
  const length = (value: { x: number; y: number; z: number }) => Math.hypot(value.x, value.y, value.z);
  const sourceDot = (left: { x: number; y: number; z: number }, right: { x: number; y: number; z: number }) =>
    left.x * right.x + left.y * right.y + left.z * right.z;
  const sourceCross = {
    x: basis.first.y * basis.second.z - basis.first.z * basis.second.y,
    y: basis.first.z * basis.second.x - basis.first.x * basis.second.z,
    z: basis.first.x * basis.second.y - basis.first.y * basis.second.x,
  };

  if (
    axis.model !== 'IAU_P03_PRECESSION_ONLY' ||
    axis.poleKind !== 'MEAN' ||
    basis.frame !== 'GCRS' ||
    basis.model !== 'IAU_P03_PRECESSION_ONLY' ||
    basis.handedness !== 'right-handed' ||
    basisVectors.some((vector) => vector.frame !== 'GCRS' || vector.units !== 'unitless') ||
    basisVectors.some((vector) => !Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) ||
    basisVectors.some((vector) => Math.abs(length(vector) - 1) > 1e-12) ||
    Math.abs(sourceDot(basis.first, basis.second)) > 1e-12 ||
    Math.abs(sourceDot(basis.first, basis.normal)) > 1e-12 ||
    Math.abs(sourceDot(basis.second, basis.normal)) > 1e-12 ||
    Math.abs(sourceDot(sourceCross, basis.normal) - 1) > 1e-12
  ) {
    throw new AstronomyContractError(
      'UNSUPPORTED_FRAME_CONTRACT',
      'Observer-horizontal equator sampling requires the validated right-handed GCRS P03 basis and mean axis.',
    );
  }
}

/**
 * Produces an immutable local sampling basis for the already selected full
 * mean-equator plane. A complete great circle has no preferred phase: rotating
 * U/V around its normal only changes where an unlabeled renderer starts its
 * samples. The GCRS P03 basis is therefore validated for scientific provenance,
 * while this deterministic ENU pair parameterizes that same plane without
 * pretending the axis-only Earth-rotation shortcut transforms individual stars.
 */
export function createObserverHorizontalMeanEquator(
  axis: ObserverHorizontalEarthAxis,
  sourceBasis: MeanEquatorBasis,
): ObserverHorizontalMeanEquator {
  validateSourceBasis(axis, sourceBasis);
  const normal = normalize(axis.north.direction);
  const reference: EnuVector = Math.abs(normal.up) < 0.9
    ? Object.freeze({ east: 0, north: 0, up: 1 })
    : Object.freeze({ east: 0, north: 1, up: 0 });
  const first = normalize(cross(reference, normal));
  const second = normalize(cross(normal, first));

  if (
    Math.abs(dot(first, normal)) > 1e-12 ||
    Math.abs(dot(second, normal)) > 1e-12 ||
    Math.abs(dot(first, second)) > 1e-12 ||
    Math.abs(dot(cross(first, second), normal) - 1) > 1e-12
  ) {
    throw new AstronomyContractError(
      'UNSUPPORTED_FRAME_CONTRACT',
      'Observer-horizontal equator sampling did not preserve the P03 plane invariants.',
    );
  }

  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_EQUATOR_OF_DATE',
    normal,
    first,
    second,
    handedness: 'right-handed',
    sourceBasisFrame: 'GCRS',
    samplingPhase: 'LOCAL_CANONICAL_UNLABELED',
    provenance: axis.provenance,
  });
}
