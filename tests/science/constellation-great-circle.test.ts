import { describe, expect, it } from 'vitest';
import {
  catalogJ2000Direction,
  CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
  sampleMinorGreatCircleArc,
} from '../../src/science/constellations/greatCircleArc';

const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

describe('constellation EQJ great-circle geometry', () => {
  it('converts catalog RA/declination into normalized EQJ basis directions with RA wrapping', () => {
    expect(catalogJ2000Direction(0, 0)).toEqual({ x: 1, y: 0, z: 0 });
    const six = catalogJ2000Direction(6, 0)!;
    expect(six.x).toBeCloseTo(0, 12); expect(six.y).toBeCloseTo(1, 12); expect(six.z).toBeCloseTo(0, 12);
    expect(catalogJ2000Direction(24, 0)).toEqual(catalogJ2000Direction(0, 0));
    expect(catalogJ2000Direction(-6, 0)).toEqual(catalogJ2000Direction(18, 0));
    expect(catalogJ2000Direction(0, 91)).toBeUndefined();
  });

  it('samples a deterministic open minor arc with exact endpoints and bounded spacing', () => {
    const start = catalogJ2000Direction(0, 0)!;
    const end = catalogJ2000Direction(6, 0)!;
    const arc = sampleMinorGreatCircleArc(start, end);
    expect(arc.kind).toBe('ready');
    if (arc.kind !== 'ready') return;
    expect(arc.points[0]).toEqual(start);
    expect(arc.points.at(-1)).toEqual(end);
    expect(arc.intervalCount).toBe(Math.ceil(90 / CONSTELLATION_MAX_ANGULAR_STEP_DEGREES));
    expect(arc.maximumAdjacentAngularSeparationDegrees).toBeLessThanOrEqual(CONSTELLATION_MAX_ANGULAR_STEP_DEGREES + 1e-10);
    expect(arc.minorArc).toBe(true);
  });

  it('keeps samples normalized, monotonic, and in one great-circle plane', () => {
    const start = catalogJ2000Direction(5.9, 7.4)!;
    const end = catalogJ2000Direction(5.24, -8.2)!;
    const arc = sampleMinorGreatCircleArc(start, end);
    expect(arc.kind).toBe('ready');
    if (arc.kind !== 'ready') return;
    const planeNormal = cross(start, end);
    let previousProgress = -1;
    for (const point of arc.points) {
      expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(1, 12);
      expect(Math.abs(dot(planeNormal, point))).toBeLessThan(1e-10);
      const progress = Math.acos(Math.max(-1, Math.min(1, dot(start, point))));
      expect(progress).toBeGreaterThanOrEqual(previousProgress - 1e-12);
      previousProgress = progress;
    }
  });

  it('contains malformed endpoints locally and bounds sampling', () => {
    const x = { x: 1, y: 0, z: 0 };
    expect(sampleMinorGreatCircleArc(x, x)).toMatchObject({ kind: 'not-ready', code: 'DEGENERATE_ENDPOINTS' });
    expect(sampleMinorGreatCircleArc(x, { x: -1, y: 0, z: 0 })).toMatchObject({ kind: 'not-ready', code: 'NEARLY_ANTIPODAL_ENDPOINTS' });
    expect(sampleMinorGreatCircleArc({ x: Number.NaN, y: 0, z: 1 }, x)).toMatchObject({ kind: 'not-ready', code: 'NON_FINITE_ENDPOINT' });
    expect(sampleMinorGreatCircleArc(x, { x: 0, y: 1, z: 0 }, 0)).toMatchObject({ kind: 'not-ready', code: 'INVALID_SAMPLING_POLICY' });
  });
});
