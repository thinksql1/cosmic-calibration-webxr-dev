import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';

export type RightAscensionUnit = 'hours' | 'degrees';

/**
 * A right-handed equatorial basis. `zeroLongitude` is the deterministic
 * project reference used for 0h; it is not a claimed vernal-equinox or
 * sidereal direction. Positive right ascension rotates from zeroLongitude
 * toward positiveNinetyLongitude about northPole by the right-hand rule.
 */
export interface EquatorialCoordinateBasis {
  readonly frame: 'APPLICATION_BASIS';
  readonly handedness: 'RIGHT_HANDED';
  readonly longitudeReference: 'LOCAL_CANONICAL_NON_SIDEREAL';
  readonly zeroLongitude: ApplicationBasisDirection;
  readonly positiveNinetyLongitude: ApplicationBasisDirection;
  readonly northPole: ApplicationBasisDirection;
}

export interface CanonicalCelestialPoleDirections {
  readonly north: ApplicationBasisDirection;
  readonly south: ApplicationBasisDirection;
}

function dot(a: ApplicationBasisDirection, b: ApplicationBasisDirection): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function length(value: ApplicationBasisDirection): number {
  return Math.hypot(value.x, value.y, value.z);
}

function valid(value: ApplicationBasisDirection): boolean {
  return [value.x, value.y, value.z].every(Number.isFinite) && Math.abs(length(value) - 1) <= 1e-10;
}

export function createEquatorialCoordinateBasis(
  zeroLongitude: ApplicationBasisDirection,
  positiveNinetyLongitude: ApplicationBasisDirection,
  northPole: ApplicationBasisDirection,
): EquatorialCoordinateBasis {
  if (!valid(zeroLongitude) || !valid(positiveNinetyLongitude) || !valid(northPole)
    || Math.abs(dot(zeroLongitude, positiveNinetyLongitude)) > 1e-10
    || Math.abs(dot(zeroLongitude, northPole)) > 1e-10
    || Math.abs(dot(positiveNinetyLongitude, northPole)) > 1e-10) {
    throw new Error('Equatorial coordinate basis requires finite orthonormal application directions.');
  }
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    handedness: 'RIGHT_HANDED',
    longitudeReference: 'LOCAL_CANONICAL_NON_SIDEREAL',
    zeroLongitude,
    positiveNinetyLongitude,
    northPole,
  });
}

export function rightAscensionToRadians(value: number, units: RightAscensionUnit): number {
  if (!Number.isFinite(value)) throw new Error('Right ascension must be finite.');
  if (units === 'hours') return value * Math.PI / 12;
  return value * Math.PI / 180;
}

/** The single source for the grid, pole markers, labels, and future stars. */
export function getCanonicalCelestialPoleDirections(
  basis: EquatorialCoordinateBasis,
): CanonicalCelestialPoleDirections {
  return Object.freeze({
    north: basis.northPole,
    south: Object.freeze({
      frame: 'APPLICATION_BASIS',
      units: 'unitless',
      x: -basis.northPole.x,
      y: -basis.northPole.y,
      z: -basis.northPole.z,
    }),
  });
}

/** Converts RA/declination to a finite normalized application-basis direction. */
export function equatorialCoordinatesToDirection(
  rightAscension: number,
  rightAscensionUnits: RightAscensionUnit,
  declinationDegrees: number,
  basis: EquatorialCoordinateBasis,
): ApplicationBasisDirection {
  if (!Number.isFinite(declinationDegrees) || declinationDegrees < -90 || declinationDegrees > 90) {
    throw new Error('Declination must be finite and within -90 through +90 degrees.');
  }
  const poles = getCanonicalCelestialPoleDirections(basis);
  if (declinationDegrees === 90) return poles.north;
  if (declinationDegrees === -90) return poles.south;
  const ra = rightAscensionToRadians(rightAscension, rightAscensionUnits);
  const dec = declinationDegrees * Math.PI / 180;
  const equatorialRadius = Math.cos(dec);
  const x = equatorialRadius * (Math.cos(ra) * basis.zeroLongitude.x + Math.sin(ra) * basis.positiveNinetyLongitude.x)
    + Math.sin(dec) * basis.northPole.x;
  const y = equatorialRadius * (Math.cos(ra) * basis.zeroLongitude.y + Math.sin(ra) * basis.positiveNinetyLongitude.y)
    + Math.sin(dec) * basis.northPole.y;
  const z = equatorialRadius * (Math.cos(ra) * basis.zeroLongitude.z + Math.sin(ra) * basis.positiveNinetyLongitude.z)
    + Math.sin(dec) * basis.northPole.z;
  const magnitude = Math.hypot(x, y, z);
  if (!Number.isFinite(magnitude) || magnitude === 0) throw new Error('Equatorial coordinate result must be finite.');
  return Object.freeze({ frame: 'APPLICATION_BASIS', units: 'unitless', x: x / magnitude, y: y / magnitude, z: z / magnitude });
}
