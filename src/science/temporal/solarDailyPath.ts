import type { ApparentTopocentricBodyResult, EnuUnitDirection, SimulationInstant } from '../astronomy/types';
import {
  assertActiveProviderIdentity,
  assertValidApparentTopocentricBodyResult,
  immutableClone,
} from '../bodies/solarSystemBodyState';
import type { AstronomyProviderIdentity } from '../providers/astronomyProviderIdentity';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { ScientificSnapshot } from '../snapshot/scientificSnapshot';
import {
  createLocalCivilDaySchedule,
  localCivilDateAt,
  type CivilHourBoundary,
  type LocalCivilDate,
  type LocalCivilDaySchedule,
  type ResolvedTimeZone,
} from './civilTime';

export const SOLAR_DAILY_PATH_SAMPLING_POLICY = Object.freeze({
  id: 'LOCAL_CIVIL_DAY_EXACT_HOURS_PLUS_10_MINUTES_V1',
  cadenceMinutes: 10,
  maximumSamples: 192,
});

const MAX_CACHED_DAILY_PATHS = 8;
const SAMPLE_MS = SOLAR_DAILY_PATH_SAMPLING_POLICY.cadenceMinutes * 60_000;

export interface SolarDailyPathSample {
  readonly instant: SimulationInstant;
  readonly direction: EnuUnitDirection;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number;
  readonly aboveHorizon: boolean;
}

export interface SolarDailyHourNotch extends SolarDailyPathSample {
  readonly civil: CivilHourBoundary;
  readonly pathSampleIndex: number;
}

export interface SolarDailyPath {
  readonly kind: 'READY_SOLAR_DAILY_APPARENT_PATH';
  readonly cacheKey: string;
  readonly schedule: LocalCivilDaySchedule;
  readonly samples: readonly SolarDailyPathSample[];
  readonly hourNotches: readonly SolarDailyHourNotch[];
  readonly correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION';
  readonly provenance: {
    readonly identity: AstronomyProviderIdentity;
    readonly sourceFrame: 'EQD_TRUE';
    readonly outputFrame: 'HORIZONTAL_ENU';
    readonly pathSamplingPolicyId: typeof SOLAR_DAILY_PATH_SAMPLING_POLICY.id;
  };
  readonly snapshotIdentity: {
    readonly observerRevision: number;
    readonly configurationRevision: number;
    readonly selectedCivilDate: LocalCivilDate;
    readonly timeZoneRevision: number;
  };
}

function addInstant(instants: Map<number, SimulationInstant>, instant: SimulationInstant): void {
  instants.set(instant.unixMilliseconds, instant);
}

function createCacheKey(
  snapshot: ScientificSnapshot,
  activeProvider: AstronomyProviderIdentity,
  timeZone: ResolvedTimeZone,
  timeZoneRevision: number,
  date: LocalCivilDate,
): string {
  return JSON.stringify({
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    selectedCivilDate: date,
    timeZone: timeZone.ianaName,
    timeZoneResolverVersion: timeZone.resolverVersion,
    tzdbVersion: timeZone.tzdbVersion,
    timeZoneRevision,
    configurationRevision: snapshot.revisions.configuration,
    correctionProfile: snapshot.configuration.bodyCorrectionProfile,
    activeProvider,
    pathSamplingPolicy: SOLAR_DAILY_PATH_SAMPLING_POLICY,
    framePolicy: Object.freeze({
      equatorialSourceFrame: activeProvider.equatorialSourceFrame,
      equatorialOutputFrame: activeProvider.equatorialOutputFrame,
      horizontalSourceFrame: activeProvider.horizontalSourceFrame,
      horizontalOutputFrame: activeProvider.horizontalOutputFrame,
    }),
  });
}

function toSample(result: ApparentTopocentricBodyResult): SolarDailyPathSample {
  return Object.freeze({
    instant: result.horizontal.provenance.simulationInstant,
    direction: result.horizontal.direction,
    altitudeDeg: result.horizontal.altitudeDeg,
    azimuthDeg: result.horizontal.azimuthDeg,
    aboveHorizon: result.aboveHorizon,
  });
}

/**
 * Caches only date-stable civil-day geometry. The live current Sun remains the
 * existing authoritative body marker and is refreshed from the central clock.
 */
export class SolarDailyPathService {
  private readonly cache = new Map<string, SolarDailyPath>();

  constructor(private readonly providers: ScientificProviderRegistry) {}

  capture(
    snapshot: ScientificSnapshot,
    timeZone: ResolvedTimeZone,
    timeZoneRevision: number,
    selectedDate = localCivilDateAt(snapshot.clock.instant, timeZone),
  ): SolarDailyPath {
    const activeProvider = assertActiveProviderIdentity(snapshot, this.providers);
    const cacheKey = createCacheKey(snapshot, activeProvider, timeZone, timeZoneRevision, selectedDate);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const schedule = createLocalCivilDaySchedule(selectedDate, timeZone);
    const instants = new Map<number, SimulationInstant>();
    for (
      let unixMilliseconds = schedule.start.unixMilliseconds;
      unixMilliseconds <= schedule.end.unixMilliseconds;
      unixMilliseconds += SAMPLE_MS
    ) {
      addInstant(instants, Object.freeze({
        utcIso: new Date(unixMilliseconds).toISOString(),
        unixMilliseconds,
        source: 'frozen-test' as const,
      }));
    }
    addInstant(instants, schedule.end);
    for (const notch of schedule.hourBoundaries) addInstant(instants, notch.instant);
    const sortedInstants = [...instants.values()].sort((left, right) =>
      left.unixMilliseconds - right.unixMilliseconds,
    );
    if (sortedInstants.length > SOLAR_DAILY_PATH_SAMPLING_POLICY.maximumSamples) {
      throw new Error('Solar daily-path sampling exceeded the bounded geometry capacity.');
    }

    const byUnixMilliseconds = new Map<number, SolarDailyPathSample>();
    for (const instant of sortedInstants) {
      const result = this.providers.astronomy.getApparentTopocentricBody(
        'Sun',
        instant,
        snapshot.observer.observer,
        snapshot.configuration.bodyCorrectionProfile,
      );
      assertValidApparentTopocentricBodyResult(result, 'Sun', activeProvider, Object.freeze({
        ...snapshot,
        clock: Object.freeze({ ...snapshot.clock, instant }),
      }));
      byUnixMilliseconds.set(instant.unixMilliseconds, immutableClone(toSample(result)));
    }
    const samples = Object.freeze(sortedInstants.map((instant) => {
      const sample = byUnixMilliseconds.get(instant.unixMilliseconds);
      if (!sample) throw new Error('Solar daily-path sample is missing after provider calculation.');
      return sample;
    }));
    const sampleIndexByInstant = new Map(samples.map((sample, index) => [sample.instant.unixMilliseconds, index]));
    const hourNotches = Object.freeze(schedule.hourBoundaries.map((civil) => {
      const pathSampleIndex = sampleIndexByInstant.get(civil.instant.unixMilliseconds);
      const sample = byUnixMilliseconds.get(civil.instant.unixMilliseconds);
      if (pathSampleIndex === undefined || !sample) {
        throw new Error('Civil-hour Sun notch must be an exact calculated daily-path sample.');
      }
      return Object.freeze({ ...sample, civil, pathSampleIndex });
    }));
    const path = immutableClone({
      kind: 'READY_SOLAR_DAILY_APPARENT_PATH' as const,
      cacheKey,
      schedule,
      samples,
      hourNotches,
      correctionProfile: snapshot.configuration.bodyCorrectionProfile,
      provenance: {
        identity: activeProvider,
        sourceFrame: 'EQD_TRUE' as const,
        outputFrame: 'HORIZONTAL_ENU' as const,
        pathSamplingPolicyId: SOLAR_DAILY_PATH_SAMPLING_POLICY.id,
      },
      snapshotIdentity: {
        observerRevision: snapshot.revisions.observer,
        configurationRevision: snapshot.revisions.configuration,
        selectedCivilDate: selectedDate,
        timeZoneRevision,
      },
    });
    this.cache.set(cacheKey, path);
    if (this.cache.size > MAX_CACHED_DAILY_PATHS) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest) this.cache.delete(oldest);
    }
    return path;
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
