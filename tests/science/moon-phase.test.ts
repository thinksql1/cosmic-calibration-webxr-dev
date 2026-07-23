import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createMoonPhaseState, moonPhaseName } from '../../src/science/moon/moonPhase';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';

describe('authoritative Moon phase state', () => {
  it('uses Astronomy Engine 2.1.19 phase and illumination data with the documented angle convention', () => {
    const providers = createScientificProviderRegistry();
    const state = createMoonPhaseState(
      providers,
      createSimulationInstant('2024-04-08T18:21:00.000Z', 'frozen-test'),
    );
    expect(state.providerVersion).toBe('2.1.19');
    expect(Math.min(state.phaseLongitudeDeg, 360 - state.phaseLongitudeDeg)).toBeLessThan(2);
    expect(state.illuminatedFraction).toBeLessThan(0.01);
    expect(state.phaseName).toBe('New Moon');
    expect(state.ageSinceNewMoonDays).toBeGreaterThanOrEqual(0);
    expect(state.timeUntilNextPrincipalPhaseDays).toBeGreaterThan(0);
  });

  it('maps all eight canonical phase sectors and distinguishes waxing from waning', () => {
    expect(moonPhaseName(0)).toBe('New Moon');
    expect(moonPhaseName(45)).toBe('Waxing Crescent');
    expect(moonPhaseName(90)).toBe('First Quarter');
    expect(moonPhaseName(135)).toBe('Waxing Gibbous');
    expect(moonPhaseName(180)).toBe('Full Moon');
    expect(moonPhaseName(225)).toBe('Waning Gibbous');
    expect(moonPhaseName(270)).toBe('Last Quarter');
    expect(moonPhaseName(315)).toBe('Waning Crescent');
  });
});
