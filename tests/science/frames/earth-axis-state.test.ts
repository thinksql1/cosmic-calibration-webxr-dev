import { describe, expect, it } from 'vitest';
import { createMeanEquatorBasis } from '../../../src/science/frames/earthAxisState';

describe('non-visual mean-equator basis', () => {
  it('owns and freezes a normalized normal instead of aliasing caller input', () => {
    const north = {
      frame: 'GCRS' as const,
      units: 'unitless' as const,
      x: 0.2,
      y: -0.3,
      z: 0.9327379053,
    };
    const basis = createMeanEquatorBasis(north);
    const originalNormal = { ...basis.normal };
    expect(basis.normal).not.toBe(north);
    expect(Object.isFrozen(basis.normal)).toBe(true);
    expect(Object.isFrozen(basis.first)).toBe(true);
    expect(Object.isFrozen(basis.second)).toBe(true);

    north.x = 1;
    north.y = 0;
    north.z = 0;
    expect(basis.normal).toEqual(originalNormal);
    expect(() => { (basis.normal as { x: number }).x = 42; }).toThrow();
    expect(() => { (basis.first as { y: number }).y = 42; }).toThrow();
    expect(() => { (basis.second as { z: number }).z = 42; }).toThrow();

    const length = Math.hypot(basis.normal.x, basis.normal.y, basis.normal.z);
    const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
    const cross = {
      x: basis.first.y * basis.second.z - basis.first.z * basis.second.y,
      y: basis.first.z * basis.second.x - basis.first.x * basis.second.z,
      z: basis.first.x * basis.second.y - basis.first.y * basis.second.x,
    };
    expect(length).toBeCloseTo(1, 14);
    expect(dot(basis.first, basis.normal)).toBeCloseTo(0, 14);
    expect(dot(basis.second, basis.normal)).toBeCloseTo(0, 14);
    expect(dot(cross, basis.normal)).toBeCloseTo(1, 12);
  });

  it.each([
    { x: 0, y: 0, z: 0 },
    { x: Number.NaN, y: 0, z: 1 },
    { x: 0, y: Number.POSITIVE_INFINITY, z: 1 },
  ])('rejects an unusable caller normal %#', ({ x, y, z }) => {
    expect(() => createMeanEquatorBasis({
      frame: 'GCRS',
      units: 'unitless',
      x,
      y,
      z,
    })).toThrow('finite equator basis');
  });

  it.each([
    { x: 0, y: 0, z: 1 },
    { x: 0.2, y: -0.3, z: 0.9327379053 },
  ])('is finite, unit, perpendicular, and right handed for %#', (pole) => {
    const length = Math.hypot(pole.x, pole.y, pole.z);
    const north = Object.freeze({ frame: 'GCRS' as const, units: 'unitless' as const, x: pole.x / length, y: pole.y / length, z: pole.z / length });
    const basis = createMeanEquatorBasis(north);
    const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
    expect(Math.hypot(basis.first.x, basis.first.y, basis.first.z)).toBeCloseTo(1, 14);
    expect(Math.hypot(basis.second.x, basis.second.y, basis.second.z)).toBeCloseTo(1, 14);
    expect(dot(basis.first, north)).toBeCloseTo(0, 14);
    expect(dot(basis.second, north)).toBeCloseTo(0, 14);
    const cross = { x: basis.first.y * basis.second.z - basis.first.z * basis.second.y, y: basis.first.z * basis.second.x - basis.first.x * basis.second.z, z: basis.first.x * basis.second.y - basis.first.y * basis.second.x };
    expect(dot(cross, north)).toBeCloseTo(1, 12);
  });
});
