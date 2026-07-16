import type { CartesianUnitDirection } from '../astronomy/types';

export interface MeanEquatorBasis {
  readonly frame: 'GCRS';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly first: CartesianUnitDirection<'GCRS'>;
  readonly second: CartesianUnitDirection<'GCRS'>;
  readonly normal: CartesianUnitDirection<'GCRS'>;
  readonly handedness: 'right-handed';
}

type Vector = readonly [number, number, number];

function cross(left: Vector, right: Vector): Vector {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function normalize(vector: Vector): CartesianUnitDirection<'GCRS'> {
  const length = Math.hypot(...vector);
  if (!Number.isFinite(length) || length === 0) throw new Error('Cannot create a finite equator basis.');
  return Object.freeze({ frame: 'GCRS', units: 'unitless', x: vector[0] / length, y: vector[1] / length, z: vector[2] / length });
}

/**
 * Forms a deterministic right-handed pair in the mean equator plane. This is
 * mathematical preparation only: no circle vertices or presentation radius
 * are created here.
 */
export function createMeanEquatorBasis(
  north: CartesianUnitDirection<'GCRS'>,
): MeanEquatorBasis {
  const normal: Vector = [north.x, north.y, north.z];
  const reference: Vector = Math.abs(north.z) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const first = normalize(cross(reference, normal));
  const second = normalize(cross(normal, [first.x, first.y, first.z]));
  return Object.freeze({
    frame: 'GCRS',
    model: 'IAU_P03_PRECESSION_ONLY',
    first,
    second,
    normal: north,
    handedness: 'right-handed',
  });
}
