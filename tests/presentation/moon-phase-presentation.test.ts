import { describe, expect, it } from 'vitest';
import {
  createMoonPhasePixels,
  createMoonPhasePresentationModel,
  createMoonTangentBasis,
} from '../../src/presentation/moonPhasePresentation';
import type { MoonPhaseState } from '../../src/science/moon/moonPhase';

const direction = (x: number, y: number, z: number) =>
  Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x, y, z });

function phase(angle: number): MoonPhaseState {
  return Object.freeze({
    kind: 'VALID_MOON_PHASE_STATE',
    provider: 'Astronomy Engine',
    providerVersion: '2.1.19',
    simulationInstant: Object.freeze({ utcIso: '2025-01-01T00:00:00.000Z', unixMilliseconds: 1735689600000, source: 'frozen-test' as const }),
    phaseLongitudeDeg: angle,
    phaseAngleDeg: Math.abs(180 - angle),
    illuminatedFraction: (1 - Math.cos(angle * Math.PI / 180)) / 2,
    previousNewMoonUtc: '2024-12-30T22:00:00.000Z',
    nextPrincipalPhaseUtc: '2025-01-06T00:00:00.000Z',
    nextPrincipalQuarter: 1,
    phaseName: 'New Moon',
    waxing: angle > 0 && angle < 180,
    ageSinceNewMoonDays: 1,
    timeUntilNextPrincipalPhaseDays: 5,
  });
}

describe('procedural Moon phase presentation', () => {
  it('generates deterministic visible phase disks with a light border and correct opposing halves', () => {
    const newMoon = createMoonPhasePixels(0);
    const fullMoon = createMoonPhasePixels(180);
    const first = createMoonPhasePixels(90);
    const last = createMoonPhasePixels(270);
    expect(newMoon).toEqual(createMoonPhasePixels(0));
    expect(newMoon.visibleAlphaPixelCount).toBeGreaterThan(0);
    expect(newMoon.borderPixelCount).toBeGreaterThan(0);
    expect(newMoon.illuminatedPixelCount).toBeLessThan(fullMoon.illuminatedPixelCount / 20);
    expect(fullMoon.illuminatedPixelCount).toBeGreaterThan(newMoon.illuminatedPixelCount);
    expect(first.illuminatedPixelCount).toBeCloseTo(last.illuminatedPixelCount, -2);
    expect(first.pixels).not.toEqual(last.pixels);
  });

  it('creates a right-handed tangent plane and eight evenly spaced world-locked phase anchors', () => {
    const basis = createMoonTangentBasis(direction(0.2, 0.4, -0.8944271909999159));
    expect(basis.orthonormalityError).toBeLessThan(1e-12);
    expect(basis.handedness).toBe('RIGHT_HANDED');
    const model = createMoonPhasePresentationModel(
      phase(73),
      direction(0.2, 0.4, -0.8944271909999159),
      direction(-0.7, 0.2, -0.6855654600401044),
    );
    expect(model.positions).toHaveLength(8);
    expect(model.positions.map((item) => item.phaseAngleDeg)).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    expect(model.positions.every((item) => [...item.imagePosition, ...item.labelPosition].every(Number.isFinite))).toBe(true);
    expect(model.orientationPolicy).toBe('STANDARDIZED_WAXING_RIGHT_WANING_LEFT');
  });
});
