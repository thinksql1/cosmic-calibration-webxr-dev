import { describe, expect, it } from 'vitest';
import { createEquatorialCoordinateBasis, equatorialCoordinatesToDirection } from '../../src/presentation/equatorialCoordinates';

const basis = createEquatorialCoordinateBasis(
  Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 1, y: 0, z: 0 }),
  Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: 1, z: 0 }),
  Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: 0, z: 1 }),
);
describe('deterministic equatorial coordinate conversion', () => {
  it('maps poles, equator, opposite hours, signs, and units explicitly', () => {
    expect(equatorialCoordinatesToDirection(0, 'hours', 90, basis).z).toBeCloseTo(1, 12);
    expect(equatorialCoordinatesToDirection(0, 'hours', -90, basis).z).toBeCloseTo(-1, 12);
    expect(equatorialCoordinatesToDirection(0, 'hours', 0, basis).z).toBeCloseTo(0, 12);
    const zero = equatorialCoordinatesToDirection(0, 'hours', 0, basis);
    const opposite = equatorialCoordinatesToDirection(12, 'hours', 0, basis);
    expect(zero.x * opposite.x + zero.y * opposite.y + zero.z * opposite.z).toBeCloseTo(-1, 12);
    expect(equatorialCoordinatesToDirection(6, 'hours', 30, basis).z).toBeGreaterThan(0);
    expect(equatorialCoordinatesToDirection(90, 'degrees', 0, basis).y).toBeCloseTo(1, 12);
  });
  it('always returns finite normalized directions from the right-handed local canonical basis', () => {
    expect(basis).toMatchObject({ handedness: 'RIGHT_HANDED', longitudeReference: 'LOCAL_CANONICAL_NON_SIDEREAL' });
    for (const hours of [0, 2, 6, 12, 18, 22]) for (const declination of [-90, -60, -30, 0, 30, 60, 90]) {
      const direction = equatorialCoordinatesToDirection(hours, 'hours', declination, basis);
      expect([direction.x, direction.y, direction.z].every(Number.isFinite)).toBe(true);
      expect(Math.hypot(direction.x, direction.y, direction.z)).toBeCloseTo(1, 12);
    }
  });
});
