import { AstronomyContractError } from './errors';
import type {
  SimulationInstant,
  SimulationInstantSource,
} from './types';

const UTC_DESIGNATOR = /(Z|[+-]00:00)$/i;

export const SIMULATION_INSTANT_SOURCES = Object.freeze([
  'frozen-test',
  'user-selected',
  'system-selected',
] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isSimulationInstantSource(
  value: unknown,
): value is SimulationInstantSource {
  return SIMULATION_INSTANT_SOURCES.includes(value as SimulationInstantSource);
}

export function createSimulationInstant(
  utcIso: string,
  source: SimulationInstantSource,
): SimulationInstant {
  if (typeof utcIso !== 'string' || !UTC_DESIGNATOR.test(utcIso)) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'Simulation instants must declare UTC with Z or +00:00.',
    );
  }

  if (!isSimulationInstantSource(source)) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'Simulation instant source is unsupported.',
    );
  }

  const unixMilliseconds = Date.parse(utcIso);
  if (!Number.isFinite(unixMilliseconds)) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'Simulation instant is not a valid UTC timestamp.',
    );
  }

  return Object.freeze({
    utcIso: new Date(unixMilliseconds).toISOString(),
    unixMilliseconds,
    source,
  });
}

/**
 * Validates and owns a structural instant supplied at a runtime boundary.
 * Rebuilding through the canonical factory prevents caller-owned references
 * or disagreeing ISO/millisecond fields from entering scientific state.
 */
export function cloneImmutableSimulationInstant(value: unknown): SimulationInstant {
  if (
    !isRecord(value) ||
    typeof value.utcIso !== 'string' ||
    !isSimulationInstantSource(value.source) ||
    typeof value.unixMilliseconds !== 'number' ||
    !Number.isFinite(value.unixMilliseconds)
  ) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'Simulation instant must contain a valid UTC string, finite milliseconds, and supported source.',
    );
  }

  const owned = createSimulationInstant(value.utcIso, value.source);
  if (owned.unixMilliseconds !== value.unixMilliseconds) {
    throw new AstronomyContractError(
      'INVALID_INSTANT',
      'Simulation instant UTC and millisecond fields disagree.',
    );
  }
  return owned;
}
