import { AstronomyContractError } from '../astronomy/errors';
import type {
  ApparentTopocentricEqjDirectionResult,
  CartesianUnitDirection,
  SimulationInstant,
  ValidatedObserver,
} from '../astronomy/types';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { ScientificSnapshot } from '../snapshot/scientificSnapshot';
import { CANONICAL_MOON_PHASES, type CanonicalMoonPhase } from './moonPhase';

export const LUNAR_PHASE_TRANSIT_SAMPLING_POLICY = Object.freeze({
  id: 'APPARENT_TOPOCENTRIC_EQJ_LUNATION_60_MINUTES_V1',
  cadenceMinutes: 60,
  maximumProviderSamples: 800,
  maximumRenderedSamples: 1600,
  maximumRenderedAngularStepDeg: 1,
});

export interface LunarPhaseTransitSample {
  readonly instant: SimulationInstant;
  readonly phaseLongitudeDeg: number;
  readonly directionEqj: CartesianUnitDirection<'EQJ_J2000'>;
  readonly source: 'cadence' | 'phase-event' | 'current' | 'lunation-boundary';
}

export interface LunarPhaseTransitEvent {
  readonly phase: CanonicalMoonPhase;
  readonly instant: SimulationInstant;
  readonly directionEqj: CartesianUnitDirection<'EQJ_J2000'>;
  readonly pathParameter: number;
}

export interface LunarPhaseTransit {
  readonly kind: 'READY_LUNAR_PHASE_TRANSIT';
  readonly cacheKey: string;
  readonly previousNewMoon: SimulationInstant;
  readonly nextNewMoon: SimulationInstant;
  readonly durationDays: number;
  readonly observer: ValidatedObserver;
  readonly samples: readonly LunarPhaseTransitSample[];
  readonly events: readonly LunarPhaseTransitEvent[];
  readonly current: {
    readonly instant: SimulationInstant;
    readonly phaseLongitudeDeg: number;
    readonly illuminationFraction: number;
    readonly waxing: boolean;
    readonly previousPhase: CanonicalMoonPhase;
    readonly nextPhase: CanonicalMoonPhase;
    readonly progressFraction: number;
    readonly directionEqj: CartesianUnitDirection<'EQJ_J2000'>;
    readonly pathParameter: number;
    readonly timeUntilNextEventMilliseconds: number;
  };
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
    readonly coordinateMode: 'APPARENT_TOPOCENTRIC_EQJ';
    readonly sourceFrame: 'EQJ_J2000';
    readonly topocentricParallax: 'included';
    readonly aberration: 'included';
    readonly lightTime: 'included';
    readonly phaseEvents: 'ASTRONOMY_ENGINE_SEARCH_MOON_PHASE';
    readonly samplingPolicy: typeof LUNAR_PHASE_TRANSIT_SAMPLING_POLICY;
  };
}

const MINUTE = 60_000;
const DAY = 86_400_000;
const MAX_CACHE = 4;

function instant(milliseconds: number): SimulationInstant {
  return Object.freeze({
    utcIso: new Date(milliseconds).toISOString(),
    unixMilliseconds: milliseconds,
    source: 'frozen-test',
  });
}

function eventSearchStart(milliseconds: number): SimulationInstant {
  return instant(milliseconds + MINUTE);
}

function assertDirection(
  result: ApparentTopocentricEqjDirectionResult,
  expectedInstant: SimulationInstant,
  observer: ValidatedObserver,
): CartesianUnitDirection<'EQJ_J2000'> {
  const direction = result.direction;
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (
    result.kind !== 'VALID_APPARENT_TOPOCENTRIC_EQJ_DIRECTION'
    || result.frame !== 'EQJ_J2000'
    || result.simulationInstant.utcIso !== expectedInstant.utcIso
    || result.observer !== observer
    || ![direction.x, direction.y, direction.z, length].every(Number.isFinite)
    || Math.abs(length - 1) > 1e-10
  ) {
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Lunar phase-transit direction violates its apparent topocentric EQJ contract.',
      Object.freeze({
        operation: 'LunarPhaseTransitService.assertDirection',
        actual: Object.freeze({ instant: expectedInstant.utcIso, length }),
      }),
    );
  }
  return direction;
}

function cacheKey(
  snapshot: ScientificSnapshot,
  previousNewMoon: SimulationInstant,
  nextNewMoon: SimulationInstant,
): string {
  return JSON.stringify({
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    configurationRevision: snapshot.revisions.configuration,
    previousNewMoonUtc: previousNewMoon.utcIso,
    nextNewMoonUtc: nextNewMoon.utcIso,
    samplingPolicy: LUNAR_PHASE_TRANSIT_SAMPLING_POLICY,
  });
}

export class LunarPhaseTransitService {
  private readonly cache = new Map<string, Omit<LunarPhaseTransit, 'current'>>();

  constructor(private readonly providers: ScientificProviderRegistry) {}

  capture(snapshot: ScientificSnapshot): LunarPhaseTransit {
    try {
      if (snapshot.kind !== 'ready') {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Lunar phase transit requires a ready scientific snapshot.',
        );
      }
      const now = snapshot.clock.instant;
      const phaseState = this.providers.astronomy.getMoonPhaseState(now);
      const previousSearch = this.providers.astronomy.searchMoonPhaseEvent(0, now, -35);
      const nextSearch = this.providers.astronomy.searchMoonPhaseEvent(0, now, 35);
      if (!previousSearch || !nextSearch) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Astronomy Engine could not bracket the active lunation.',
        );
      }
      const previousNewMoon = previousSearch.eventInstant;
      const nextNewMoon = nextSearch.eventInstant;
      if (
        previousNewMoon.unixMilliseconds >= now.unixMilliseconds
        || nextNewMoon.unixMilliseconds <= now.unixMilliseconds
      ) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Moon phase-event search did not bracket the current simulation instant.',
        );
      }
      const key = cacheKey(snapshot, previousNewMoon, nextNewMoon);
      let staticModel = this.cache.get(key);
      if (!staticModel) {
        staticModel = this.buildStaticModel(snapshot, previousNewMoon, nextNewMoon, key);
        this.cache.set(key, staticModel);
        if (this.cache.size > MAX_CACHE) {
          const oldest = this.cache.keys().next().value as string | undefined;
          if (oldest) this.cache.delete(oldest);
        }
      }

      const currentDirection = assertDirection(
        this.providers.astronomy.getApparentTopocentricEqjMoonDirection(
          now,
          snapshot.observer.observer,
        ),
        now,
        snapshot.observer.observer,
      );
      const normalizedPhase = ((phaseState.phaseLongitudeDeg % 360) + 360) % 360;
      const previousIndex = Math.floor(normalizedPhase / 45) % 8;
      const nextIndex = (previousIndex + 1) % 8;
      const previousPhase = CANONICAL_MOON_PHASES[previousIndex]!;
      const nextPhase = CANONICAL_MOON_PHASES[nextIndex]!;
      const nextEvent = nextIndex === 0
        ? nextNewMoon
        : staticModel.events[nextIndex]!.instant;
      const previousEvent = staticModel.events[previousIndex]!.instant;
      const progressFraction = (now.unixMilliseconds - previousEvent.unixMilliseconds)
        / (nextEvent.unixMilliseconds - previousEvent.unixMilliseconds);
      const pathParameter = (now.unixMilliseconds - previousNewMoon.unixMilliseconds)
        / (nextNewMoon.unixMilliseconds - previousNewMoon.unixMilliseconds);
      return Object.freeze({
        ...staticModel,
        current: Object.freeze({
          instant: now,
          phaseLongitudeDeg: normalizedPhase,
          illuminationFraction: phaseState.illuminatedFraction,
          waxing: normalizedPhase > 0 && normalizedPhase < 180,
          previousPhase,
          nextPhase,
          progressFraction: Math.max(0, Math.min(1, progressFraction)),
          directionEqj: currentDirection,
          pathParameter: Math.max(0, Math.min(1, pathParameter)),
          timeUntilNextEventMilliseconds: Math.max(0, nextEvent.unixMilliseconds - now.unixMilliseconds),
        }),
      });
    } catch (error) {
      if (error instanceof AstronomyContractError) throw error;
      throw new AstronomyContractError(
        'TEMPORAL_PATH_FAILURE',
        'Lunar phase-transit construction failed.',
        Object.freeze({
          operation: 'LunarPhaseTransitService.capture',
          actual: Object.freeze({ message: error instanceof Error ? error.message : String(error) }),
        }),
      );
    }
  }

  private buildStaticModel(
    snapshot: ScientificSnapshot,
    previousNewMoon: SimulationInstant,
    nextNewMoon: SimulationInstant,
    key: string,
  ): Omit<LunarPhaseTransit, 'current'> {
    const observer = snapshot.observer.observer;
    const eventInstants = CANONICAL_MOON_PHASES.map((phase, index) => {
      if (index === 0) return previousNewMoon;
      const event = this.providers.astronomy.searchMoonPhaseEvent(
        phase.angleDeg,
        eventSearchStart(previousNewMoon.unixMilliseconds),
        35,
      );
      if (
        !event
        || event.eventInstant.unixMilliseconds <= previousNewMoon.unixMilliseconds
        || event.eventInstant.unixMilliseconds >= nextNewMoon.unixMilliseconds
      ) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          `Astronomy Engine did not return ${phase.name} inside the active lunation.`,
        );
      }
      return event.eventInstant;
    });
    for (let index = 1; index < eventInstants.length; index += 1) {
      if (eventInstants[index]!.unixMilliseconds <= eventInstants[index - 1]!.unixMilliseconds) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Canonical Moon phase events are not strictly chronological.',
        );
      }
    }

    const timestamps = new Map<number, LunarPhaseTransitSample['source']>();
    for (
      let milliseconds = previousNewMoon.unixMilliseconds;
      milliseconds <= nextNewMoon.unixMilliseconds;
      milliseconds += LUNAR_PHASE_TRANSIT_SAMPLING_POLICY.cadenceMinutes * MINUTE
    ) {
      timestamps.set(milliseconds, 'cadence');
    }
    timestamps.set(previousNewMoon.unixMilliseconds, 'lunation-boundary');
    timestamps.set(nextNewMoon.unixMilliseconds, 'lunation-boundary');
    for (const value of eventInstants) timestamps.set(value.unixMilliseconds, 'phase-event');
    if (timestamps.size > LUNAR_PHASE_TRANSIT_SAMPLING_POLICY.maximumProviderSamples) {
      throw new AstronomyContractError(
        'TEMPORAL_PATH_FAILURE',
        'Lunar phase transit exceeds its provider-sample budget.',
      );
    }

    const orderedTimes = [...timestamps.entries()].sort(([left], [right]) => left - right);
    const samples = Object.freeze(orderedTimes.map(([milliseconds, source]) => {
      const sampleInstant = instant(milliseconds);
      const phaseLongitudeDeg = this.providers.astronomy.getMoonPhaseLongitudeDeg(sampleInstant);
      const directionEqj = assertDirection(
        this.providers.astronomy.getApparentTopocentricEqjMoonDirection(sampleInstant, observer),
        sampleInstant,
        observer,
      );
      return Object.freeze({
        instant: sampleInstant,
        phaseLongitudeDeg,
        directionEqj,
        source,
      });
    }));
    const duration = nextNewMoon.unixMilliseconds - previousNewMoon.unixMilliseconds;
    const events = Object.freeze(CANONICAL_MOON_PHASES.map((phase, index) => {
      const eventInstant = eventInstants[index]!;
      const match = samples.find((sample) =>
        sample.instant.unixMilliseconds === eventInstant.unixMilliseconds);
      if (!match) throw new Error(`Missing sampled direction for ${phase.name}.`);
      return Object.freeze({
        phase,
        instant: eventInstant,
        directionEqj: match.directionEqj,
        pathParameter: (eventInstant.unixMilliseconds - previousNewMoon.unixMilliseconds) / duration,
      });
    }));
    return Object.freeze({
      kind: 'READY_LUNAR_PHASE_TRANSIT',
      cacheKey: key,
      previousNewMoon,
      nextNewMoon,
      durationDays: duration / DAY,
      observer,
      samples,
      events,
      provenance: Object.freeze({
        provider: this.providers.astronomy.identity.provider,
        providerVersion: this.providers.astronomy.identity.providerVersion,
        coordinateMode: 'APPARENT_TOPOCENTRIC_EQJ',
        sourceFrame: 'EQJ_J2000',
        topocentricParallax: 'included',
        aberration: 'included',
        lightTime: 'included',
        phaseEvents: 'ASTRONOMY_ENGINE_SEARCH_MOON_PHASE',
        samplingPolicy: LUNAR_PHASE_TRANSIT_SAMPLING_POLICY,
      }),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
