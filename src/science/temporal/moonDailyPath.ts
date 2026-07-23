import { AstronomyContractError } from '../astronomy/errors';
import type { EnuUnitDirection, SimulationInstant, ValidatedObserver } from '../astronomy/types';
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
  type LocalCivilDate,
  type LocalCivilDaySchedule,
  type ResolvedTimeZone,
} from './civilTime';

export const MOON_DAILY_PATH_SAMPLING_POLICY = Object.freeze({
  id: 'LOCAL_CIVIL_DAY_MOON_5_MINUTES_V1',
  cadenceMinutes: 5,
  maximumSamples: 320,
});

export interface MoonDailyPathSample {
  readonly instant: SimulationInstant;
  readonly direction: EnuUnitDirection;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number;
  readonly aboveHorizon: boolean;
  readonly observer: ValidatedObserver;
}

export interface MoonDailyPath {
  readonly kind: 'READY_MOON_DAILY_APPARENT_PATH';
  readonly cacheKey: string;
  readonly schedule: LocalCivilDaySchedule;
  readonly samples: readonly MoonDailyPathSample[];
  readonly correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION';
  readonly provenance: {
    readonly identity: AstronomyProviderIdentity;
    readonly sourceFrame: 'EQD_TRUE';
    readonly outputFrame: 'HORIZONTAL_ENU';
    readonly observer: ValidatedObserver;
    readonly samplingPolicy: typeof MOON_DAILY_PATH_SAMPLING_POLICY;
    readonly topocentricParallax: 'included';
  };
  readonly snapshotIdentity: {
    readonly observerRevision: number;
    readonly configurationRevision: number;
    readonly selectedCivilDate: LocalCivilDate;
    readonly timeZoneRevision: number;
  };
}

const MAX_CACHED_MOON_PATHS = 8;

function cacheKey(
  snapshot: ScientificSnapshot,
  timeZone: ResolvedTimeZone,
  timeZoneRevision: number,
  date: LocalCivilDate,
  identity: AstronomyProviderIdentity,
): string {
  return JSON.stringify({
    body: 'Moon',
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    configurationRevision: snapshot.revisions.configuration,
    correctionProfile: snapshot.configuration.bodyCorrectionProfile,
    date,
    timeZone,
    timeZoneRevision,
    identity,
    samplingPolicy: MOON_DAILY_PATH_SAMPLING_POLICY,
  });
}

function instant(unixMilliseconds: number): SimulationInstant {
  return Object.freeze({
    utcIso: new Date(unixMilliseconds).toISOString(),
    unixMilliseconds,
    source: 'frozen-test',
  });
}

export class MoonDailyPathService {
  private readonly cache = new Map<string, MoonDailyPath>();

  constructor(private readonly providers: ScientificProviderRegistry) {}

  capture(
    snapshot: ScientificSnapshot,
    timeZone: ResolvedTimeZone,
    timeZoneRevision: number,
    selectedDate?: LocalCivilDate,
  ): MoonDailyPath {
    try {
      const date = selectedDate ?? localCivilDateAt(snapshot.clock.instant, timeZone);
      const activeProvider = assertActiveProviderIdentity(snapshot, this.providers);
      const key = cacheKey(snapshot, timeZone, timeZoneRevision, date, activeProvider);
      const cached = this.cache.get(key);
      if (cached) return cached;
      const schedule = createLocalCivilDaySchedule(date, timeZone);
      const instants = new Map<number, SimulationInstant>();
      for (
        let milliseconds = schedule.start.unixMilliseconds;
        milliseconds <= schedule.end.unixMilliseconds;
        milliseconds += MOON_DAILY_PATH_SAMPLING_POLICY.cadenceMinutes * 60_000
      ) {
        instants.set(milliseconds, instant(milliseconds));
      }
      instants.set(schedule.end.unixMilliseconds, schedule.end);
      const ordered = [...instants.values()].sort((left, right) =>
        left.unixMilliseconds - right.unixMilliseconds);
      if (ordered.length > MOON_DAILY_PATH_SAMPLING_POLICY.maximumSamples) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Moon daily-path sampling exceeded its bounded capacity.',
          Object.freeze({
            operation: 'MoonDailyPathService.capture',
            actual: Object.freeze({ sampleCount: ordered.length }),
          }),
        );
      }
      const samples = Object.freeze(ordered.map((sampleInstant, sampleIndex) => {
        const sampleSnapshot = Object.freeze({
          ...snapshot,
          clock: Object.freeze({ ...snapshot.clock, instant: sampleInstant }),
        });
        const result = this.providers.astronomy.getApparentTopocentricBody(
          'Moon',
          sampleInstant,
          snapshot.observer.observer,
          snapshot.configuration.bodyCorrectionProfile,
        );
        try {
          assertValidApparentTopocentricBodyResult(
            result,
            'Moon',
            activeProvider,
            sampleSnapshot,
          );
        } catch (error) {
          throw new AstronomyContractError(
            error instanceof AstronomyContractError ? error.code : 'TEMPORAL_PATH_FAILURE',
            error instanceof Error ? error.message : 'Moon daily-path sample is invalid.',
            Object.freeze({
              operation: 'MoonDailyPathService.capture.calculateSample',
              actual: Object.freeze({ sampleIndex, instantUtc: sampleInstant.utcIso }),
            }),
          );
        }
        return immutableClone({
          instant: sampleInstant,
          direction: result.horizontal.direction,
          altitudeDeg: result.horizontal.altitudeDeg,
          azimuthDeg: result.horizontal.azimuthDeg,
          aboveHorizon: result.aboveHorizon,
          observer: snapshot.observer.observer,
        });
      }));
      const path = immutableClone({
        kind: 'READY_MOON_DAILY_APPARENT_PATH' as const,
        cacheKey: key,
        schedule,
        samples,
        correctionProfile: snapshot.configuration.bodyCorrectionProfile,
        provenance: {
          identity: activeProvider,
          sourceFrame: 'EQD_TRUE' as const,
          outputFrame: 'HORIZONTAL_ENU' as const,
          observer: snapshot.observer.observer,
          samplingPolicy: MOON_DAILY_PATH_SAMPLING_POLICY,
          topocentricParallax: 'included' as const,
        },
        snapshotIdentity: {
          observerRevision: snapshot.revisions.observer,
          configurationRevision: snapshot.revisions.configuration,
          selectedCivilDate: date,
          timeZoneRevision,
        },
      });
      this.cache.set(key, path);
      if (this.cache.size > MAX_CACHED_MOON_PATHS) {
        const oldest = this.cache.keys().next().value as string | undefined;
        if (oldest) this.cache.delete(oldest);
      }
      return path;
    } catch (error) {
      if (error instanceof AstronomyContractError) throw error;
      throw new AstronomyContractError(
        'TEMPORAL_PATH_FAILURE',
        'Moon daily-path construction failed.',
        Object.freeze({
          operation: 'MoonDailyPathService.capture',
          actual: Object.freeze({ message: error instanceof Error ? error.message : String(error) }),
        }),
      );
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
