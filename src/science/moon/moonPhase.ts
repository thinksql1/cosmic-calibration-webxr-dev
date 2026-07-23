import { AstronomyContractError } from '../astronomy/errors';
import type { MoonPhaseProviderResult, SimulationInstant } from '../astronomy/types';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';

export const CANONICAL_MOON_PHASES = Object.freeze([
  Object.freeze({ id: 'new-moon', name: 'New Moon', angleDeg: 0, waxing: false }),
  Object.freeze({ id: 'waxing-crescent', name: 'Waxing Crescent', angleDeg: 45, waxing: true }),
  Object.freeze({ id: 'first-quarter', name: 'First Quarter', angleDeg: 90, waxing: true }),
  Object.freeze({ id: 'waxing-gibbous', name: 'Waxing Gibbous', angleDeg: 135, waxing: true }),
  Object.freeze({ id: 'full-moon', name: 'Full Moon', angleDeg: 180, waxing: false }),
  Object.freeze({ id: 'waning-gibbous', name: 'Waning Gibbous', angleDeg: 225, waxing: false }),
  Object.freeze({ id: 'last-quarter', name: 'Last Quarter', angleDeg: 270, waxing: false }),
  Object.freeze({ id: 'waning-crescent', name: 'Waning Crescent', angleDeg: 315, waxing: false }),
] as const);

export type CanonicalMoonPhase = (typeof CANONICAL_MOON_PHASES)[number];

export interface MoonPhaseState extends MoonPhaseProviderResult {
  readonly phaseName: CanonicalMoonPhase['name'];
  readonly waxing: boolean;
  readonly ageSinceNewMoonDays: number;
  readonly timeUntilNextPrincipalPhaseDays: number;
}

function normalizedPhase(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function moonPhaseName(phaseLongitudeDeg: number): CanonicalMoonPhase['name'] {
  if (!Number.isFinite(phaseLongitudeDeg)) return 'New Moon';
  const index = Math.floor((normalizedPhase(phaseLongitudeDeg) + 22.5) / 45) % 8;
  return CANONICAL_MOON_PHASES[index]!.name;
}

export function createMoonPhaseState(
  providers: ScientificProviderRegistry,
  instant: SimulationInstant,
): MoonPhaseState {
  let result: MoonPhaseProviderResult;
  try {
    result = providers.astronomy.getMoonPhaseState(instant);
  } catch (error) {
    if (error instanceof AstronomyContractError) throw error;
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Moon phase provider failed.',
      Object.freeze({
        operation: 'createMoonPhaseState',
        actual: Object.freeze({ message: error instanceof Error ? error.message : String(error) }),
      }),
    );
  }
  const ageSinceNewMoonDays =
    (instant.unixMilliseconds - Date.parse(result.previousNewMoonUtc)) / 86_400_000;
  const timeUntilNextPrincipalPhaseDays =
    (Date.parse(result.nextPrincipalPhaseUtc) - instant.unixMilliseconds) / 86_400_000;
  const values = [
    result.phaseLongitudeDeg,
    result.phaseAngleDeg,
    result.illuminatedFraction,
    ageSinceNewMoonDays,
    timeUntilNextPrincipalPhaseDays,
  ];
  if (
    result.kind !== 'VALID_MOON_PHASE_STATE' ||
    result.simulationInstant.utcIso !== instant.utcIso ||
    result.provider !== providers.astronomy.identity.provider ||
    result.providerVersion !== providers.astronomy.identity.providerVersion ||
    !values.every(Number.isFinite) ||
    ageSinceNewMoonDays < 0 ||
    ageSinceNewMoonDays > 35 ||
    timeUntilNextPrincipalPhaseDays < 0 ||
    timeUntilNextPrincipalPhaseDays > 10
  ) {
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Moon phase state violates the bounded provider contract.',
      Object.freeze({
        operation: 'createMoonPhaseState',
        actual: Object.freeze({
          kind: result.kind,
          phaseLongitudeDeg: result.phaseLongitudeDeg,
          phaseAngleDeg: result.phaseAngleDeg,
          illuminatedFraction: result.illuminatedFraction,
          previousNewMoonUtc: result.previousNewMoonUtc,
          nextPrincipalPhaseUtc: result.nextPrincipalPhaseUtc,
        }),
      }),
    );
  }
  return Object.freeze({
    ...result,
    phaseName: moonPhaseName(result.phaseLongitudeDeg),
    waxing: result.phaseLongitudeDeg > 0 && result.phaseLongitudeDeg < 180,
    ageSinceNewMoonDays,
    timeUntilNextPrincipalPhaseDays,
  });
}
