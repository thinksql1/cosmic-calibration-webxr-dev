import { describe, expect, it } from 'vitest';
import { FIRST_CONSTELLATION_CANONICAL_GEOMETRY } from '../../src/presentation/firstConstellationLinePresentation';
import { catalogJ2000Direction } from '../../src/science/constellations/greatCircleArc';

describe('first constellation canonical presentation geometry', () => {
  it('contains seven figures and forty open minor-arc segments', () => {
    expect(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures).toHaveLength(7);
    expect(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.segmentCount).toBe(40);
    expect(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.starCount).toBe(43);
  });

  it('reconstructs every catalog endpoint exactly and keeps adjacent spacing bounded', () => {
    for (const figure of FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures) {
      for (const segment of figure.segments) {
        const expectedStart = catalogJ2000Direction(segment.startStar.rightAscensionHours, segment.startStar.declinationDegrees)!;
        const expectedEnd = catalogJ2000Direction(segment.endStar.rightAscensionHours, segment.endStar.declinationDegrees)!;
        expect(segment.directions[0]).toEqual(expectedStart);
        expect(segment.directions.at(-1)).toEqual(expectedEnd);
        expect(segment.maximumAdjacentAngularSeparationDegrees).toBeLessThanOrEqual(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.maximumAngularStepDegrees + 1e-9);
        expect(segment.intervalCount).toBeGreaterThan(0);
        expect(segment.intervalCount).toBeLessThanOrEqual(120);
        expect(segment.minorArc).toBe(true);
      }
    }
  });

  it('keeps all uploaded canonical components finite and within the unit-vector budget', () => {
    for (const figure of FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures) {
      for (const segment of figure.segments) {
        for (const direction of segment.directions) {
          expect([direction.x, direction.y, direction.z].every(Number.isFinite)).toBe(true);
          expect(Math.max(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z))).toBeLessThanOrEqual(1);
          expect(Math.hypot(direction.x, direction.y, direction.z)).toBeCloseTo(1, 11);
        }
      }
    }
  });
});
