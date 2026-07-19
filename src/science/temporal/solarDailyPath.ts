import { AstronomyContractError, type AstronomyContractErrorCode } from '../astronomy/errors';
import type {
  ApparentTopocentricBodyResult,
  EnuUnitDirection,
  SimulationInstant,
  ValidatedObserver,
} from '../astronomy/types';
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

export interface SolarDailyPathSamplingPolicy {
  readonly id: string;
  readonly cadenceMinutes: number;
  readonly maximumSamples: number;
}

export type SolarDailyPathWarningCode =
  | 'TIER_1_UTC_APPROXIMATES_UT1'
  | 'AIRLESS_APPARENT_TOPOCENTRIC_POSITION'
  | 'NO_ATMOSPHERIC_REFRACTION'
  | 'BROWSER_INTL_CIVIL_TIME_RESOLVER'
  | 'BROWSER_DEFAULT_TIME_ZONE_SOURCE'
  | 'USER_SELECTED_TIME_ZONE_SOURCE'
  | 'NO_PERSISTED_TIME_ZONE_SETTING'
  | 'NO_PRECISION_CLAIM_BEYOND_TIER_1';

export interface SolarDailyPathWarning {
  readonly code: SolarDailyPathWarningCode;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

const MAX_CACHED_DAILY_PATHS = 8;
export const SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION =
  'SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_V1' as const;
export const SOLAR_DAILY_PATH_OBSERVER_MODEL = 'WGS84_GEODETIC' as const;
const SOLAR_DAILY_PATH_FAILURE_CONTEXT_SCHEMA_VERSION =
  'SOLAR_DAILY_PATH_FAILURE_CONTEXT_V1' as const;

export interface SolarDailyPathObserverProvenance {
  readonly observerProvenanceSchemaVersion: typeof SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION;
  readonly observerRevision: number;
  readonly geodeticModel: typeof SOLAR_DAILY_PATH_OBSERVER_MODEL;
  readonly observer: ValidatedObserver;
}

export interface SolarDailyPathSample {
  readonly instant: SimulationInstant;
  readonly direction: EnuUnitDirection;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number;
  readonly aboveHorizon: boolean;
  readonly observer: ValidatedObserver;
  readonly observerProvenance: SolarDailyPathObserverProvenance;
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
    readonly observer: ValidatedObserver;
    readonly observerRevision: number;
    readonly observerModel: 'WGS84_GEODETIC';
    readonly observerProvenanceSchemaVersion: typeof SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION;
    readonly observerProvenance: SolarDailyPathObserverProvenance;
    readonly pathSamplingPolicyId: string;
    readonly pathSamplingPolicy: SolarDailyPathSamplingPolicy;
  };
  readonly warnings: readonly SolarDailyPathWarning[];
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
  samplingPolicy: SolarDailyPathSamplingPolicy,
): string {
  return JSON.stringify({
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
    selectedCivilDate: date,
    timeZone: timeZone.ianaName,
    timeZoneResolverVersion: timeZone.resolverVersion,
    tzdbVersion: timeZone.tzdbVersion,
    timeZoneRevision,
    configurationRevision: snapshot.revisions.configuration,
    correctionProfile: snapshot.configuration.bodyCorrectionProfile,
    activeProvider,
    pathSamplingPolicy: samplingPolicy,
    framePolicy: Object.freeze({
      equatorialSourceFrame: activeProvider.equatorialSourceFrame,
      equatorialOutputFrame: activeProvider.equatorialOutputFrame,
      horizontalSourceFrame: activeProvider.horizontalSourceFrame,
      horizontalOutputFrame: activeProvider.horizontalOutputFrame,
    }),
  });
}

function createObserverProvenance(snapshot: ScientificSnapshot): SolarDailyPathObserverProvenance {
  return immutableClone({
    observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
    observerRevision: snapshot.revisions.observer,
    geodeticModel: SOLAR_DAILY_PATH_OBSERVER_MODEL,
    observer: snapshot.observer.observer,
  });
}

function sameObserverProvenance(
  left: SolarDailyPathObserverProvenance,
  right: SolarDailyPathObserverProvenance,
): boolean {
  return (
    left.observerProvenanceSchemaVersion === right.observerProvenanceSchemaVersion &&
    left.observerRevision === right.observerRevision &&
    left.geodeticModel === right.geodeticModel &&
    left.observer.kind === right.observer.kind &&
    left.observer.latitudeDeg === right.observer.latitudeDeg &&
    left.observer.longitudeDegEast === right.observer.longitudeDegEast &&
    left.observer.elevationMeters === right.observer.elevationMeters &&
    left.observer.horizontalDatum === right.observer.horizontalDatum &&
    left.observer.verticalDatum === right.observer.verticalDatum &&
    left.observer.source === right.observer.source &&
    left.observer.uncertainty?.horizontalMeters === right.observer.uncertainty?.horizontalMeters &&
    left.observer.uncertainty?.verticalMeters === right.observer.uncertainty?.verticalMeters
  );
}

export function assertSolarDailyPathObserverProvenance(
  expected: SolarDailyPathObserverProvenance,
  samples: readonly SolarDailyPathSample[],
  hourNotches: readonly SolarDailyHourNotch[],
): void {
  const mismatchedSampleIndex = samples.findIndex(
    (sample) => !sameObserverProvenance(sample.observerProvenance, expected),
  );
  const mismatchedNotchIndex = hourNotches.findIndex(
    (notch) => !sameObserverProvenance(notch.observerProvenance, expected),
  );
  if (mismatchedSampleIndex < 0 && mismatchedNotchIndex < 0) return;
  throw new AstronomyContractError(
    'TEMPORAL_PATH_FAILURE',
    'Solar daily-path aggregation mixed incompatible observer provenance.',
    immutableClone({
      operation: 'SolarDailyPathService.capture.validateObserverProvenance',
      expected: { ...expected },
      actual: mismatchedSampleIndex >= 0
        ? { ...samples[mismatchedSampleIndex]!.observerProvenance }
        : { ...hourNotches[mismatchedNotchIndex]!.observerProvenance },
      details: {
        ...(mismatchedSampleIndex >= 0 ? { sampleIndex: mismatchedSampleIndex } : {}),
        ...(mismatchedNotchIndex >= 0 ? { civilHourBoundaryIndex: mismatchedNotchIndex } : {}),
      },
    }),
  );
}

function toSample(
  result: ApparentTopocentricBodyResult,
  observerProvenance: SolarDailyPathObserverProvenance,
): SolarDailyPathSample {
  return Object.freeze({
    instant: result.horizontal.provenance.simulationInstant,
    direction: result.horizontal.direction,
    altitudeDeg: result.horizontal.altitudeDeg,
    azimuthDeg: result.horizontal.azimuthDeg,
    aboveHorizon: result.aboveHorizon,
    observer: observerProvenance.observer,
    observerProvenance,
  });
}

function validateSamplingPolicy(policy: SolarDailyPathSamplingPolicy): SolarDailyPathSamplingPolicy {
  if (
    typeof policy.id !== 'string' || policy.id.length === 0 ||
    !Number.isSafeInteger(policy.cadenceMinutes) || policy.cadenceMinutes <= 0 ||
    !Number.isSafeInteger(policy.maximumSamples) || policy.maximumSamples <= 0 ||
    policy.maximumSamples > SOLAR_DAILY_PATH_SAMPLING_POLICY.maximumSamples
  ) {
    throw new AstronomyContractError(
      'TEMPORAL_PATH_FAILURE',
      'Solar daily-path sampling policy is invalid or exceeds the bounded geometry capacity.',
      immutableClone({
        operation: 'SolarDailyPathService.capture.samplingPolicy',
        details: { samplingPolicy: policy },
      }),
    );
  }
  return immutableClone(policy);
}

function createWarnings(
  snapshot: ScientificSnapshot,
  timeZone: ResolvedTimeZone,
): readonly SolarDailyPathWarning[] {
  const warnings: SolarDailyPathWarning[] = [
    {
      code: 'TIER_1_UTC_APPROXIMATES_UT1',
      message: 'Tier 1 astronomy treats UTC as an approximation to UT1.',
      context: { timeScale: 'UTC_APPROXIMATES_UT1' },
    },
    ...(snapshot.configuration.bodyCorrectionProfile === 'AE_APPARENT_TOPOCENTRIC_AIRLESS'
      ? [{
          code: 'AIRLESS_APPARENT_TOPOCENTRIC_POSITION' as const,
          message: 'The daily Sun path uses the configured airless apparent-topocentric profile.',
          context: { correctionProfile: snapshot.configuration.bodyCorrectionProfile },
        }, {
          code: 'NO_ATMOSPHERIC_REFRACTION' as const,
          message: 'Atmospheric refraction is not applied to this daily Sun path.',
          context: { refraction: 'disabled' },
        }]
      : []),
    {
      code: 'BROWSER_INTL_CIVIL_TIME_RESOLVER',
      message: 'Civil boundaries are resolved through the browser Intl IANA implementation.',
      context: {
        ianaName: timeZone.ianaName,
        resolverVersion: timeZone.resolverVersion,
        tzdbVersion: timeZone.tzdbVersion,
      },
    },
    timeZone.source === 'browser-intl'
      ? {
          code: 'BROWSER_DEFAULT_TIME_ZONE_SOURCE' as const,
          message: 'The civil time zone originated from the browser default.',
          context: { source: timeZone.source },
        }
      : {
          code: 'USER_SELECTED_TIME_ZONE_SOURCE' as const,
          message: 'The civil time zone was explicitly selected by the user.',
          context: { source: timeZone.source },
        },
    {
      code: 'NO_PERSISTED_TIME_ZONE_SETTING',
      message: 'The application does not persist a civil time-zone setting.',
      context: { persistence: 'not-implemented' },
    },
    {
      code: 'NO_PRECISION_CLAIM_BEYOND_TIER_1',
      message: 'The daily path makes no precision claim beyond the validated Tier 1 contract.',
      context: { precisionClassification: 'TIER_1_NON_FATAL' },
    },
  ];
  return immutableClone([...new Map(warnings.map((warning) => [warning.code, warning])).values()]);
}

function temporalDetails(
  snapshot: ScientificSnapshot,
  timeZone: ResolvedTimeZone,
  timeZoneRevision: number,
  selectedDate: LocalCivilDate | undefined,
  samplingPolicy: SolarDailyPathSamplingPolicy,
  details: Readonly<Record<string, unknown>> = {},
  activeProvider: unknown = snapshot.providers.astronomy,
): Readonly<Record<string, unknown>> {
  return immutableClone({
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    observerProvenance: createObserverProvenance(snapshot),
    selectedCivilDate: selectedDate,
    timeZone: {
      ianaName: timeZone.ianaName,
      source: timeZone.source,
      resolverVersion: timeZone.resolverVersion,
      tzdbVersion: timeZone.tzdbVersion,
      revision: timeZoneRevision,
    },
    provider: {
      expected: snapshot.providers.astronomy,
      active: activeProvider,
    },
    correctionProfile: snapshot.configuration.bodyCorrectionProfile,
    framePolicy: {
      sourceFrame: 'EQD_TRUE',
      outputFrame: 'HORIZONTAL_ENU',
    },
    samplingPolicy,
    scientificConfigurationRevision: snapshot.revisions.configuration,
    ...details,
  });
}

function withTemporalContext(
  error: unknown,
  snapshot: ScientificSnapshot,
  timeZone: ResolvedTimeZone,
  timeZoneRevision: number,
  selectedDate: LocalCivilDate | undefined,
  samplingPolicy: SolarDailyPathSamplingPolicy,
  operation: string,
  details: Readonly<Record<string, unknown>> = {},
  activeProvider: unknown = snapshot.providers.astronomy,
): AstronomyContractError {
  if (
    error instanceof AstronomyContractError &&
    error.context?.details?.temporalFailureContextSchemaVersion === SOLAR_DAILY_PATH_FAILURE_CONTEXT_SCHEMA_VERSION
  ) return error;
  const code: AstronomyContractErrorCode = error instanceof AstronomyContractError
    ? error.code
    : 'TEMPORAL_PATH_FAILURE';
  const safeCause = error instanceof AstronomyContractError
    ? { code: error.code, message: error.message }
    : { message: error instanceof Error ? error.message : String(error) };
  const existingContext = error instanceof AstronomyContractError ? error.context : undefined;
  const existingDetails = existingContext?.details ?? {};
  const underlyingCode = existingContext?.underlyingCode ?? (
    error instanceof AstronomyContractError && error.code !== 'TEMPORAL_PATH_FAILURE'
      ? error.code
      : undefined
  );
  return new AstronomyContractError(
    code,
    error instanceof AstronomyContractError
      ? error.message
      : 'Solar daily-path construction failed unexpectedly.',
    immutableClone({
      operation: code === 'TEMPORAL_PATH_FAILURE' && existingContext?.operation
        ? existingContext.operation
        : operation,
      ...(existingContext?.expected === undefined ? {} : { expected: existingContext.expected }),
      ...(existingContext?.actual === undefined ? {} : { actual: existingContext.actual }),
      ...(existingContext?.mismatchedFields === undefined
        ? {}
        : { mismatchedFields: existingContext.mismatchedFields }),
      ...(underlyingCode === undefined ? {} : { underlyingCode }),
      details: temporalDetails(
        snapshot,
        timeZone,
        timeZoneRevision,
        selectedDate,
        samplingPolicy,
        {
          ...details,
          ...(existingContext?.operation && existingContext.operation !== operation
            ? { causeOperation: existingContext.operation }
            : {}),
          ...existingDetails,
          temporalFailureContextSchemaVersion: SOLAR_DAILY_PATH_FAILURE_CONTEXT_SCHEMA_VERSION,
          cause: safeCause,
        },
        activeProvider,
      ),
    }),
  );
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
    selectedDate?: LocalCivilDate,
    requestedSamplingPolicy: SolarDailyPathSamplingPolicy = SOLAR_DAILY_PATH_SAMPLING_POLICY,
  ): SolarDailyPath {
    let resolvedDate: LocalCivilDate | undefined = selectedDate;
    let samplingPolicy: SolarDailyPathSamplingPolicy = requestedSamplingPolicy;
    try {
      resolvedDate = selectedDate ?? localCivilDateAt(snapshot.clock.instant, timeZone);
      samplingPolicy = validateSamplingPolicy(requestedSamplingPolicy);
      const activeProvider = assertActiveProviderIdentity(snapshot, this.providers);
      const cacheKey = createCacheKey(snapshot, activeProvider, timeZone, timeZoneRevision, resolvedDate, samplingPolicy);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const schedule = createLocalCivilDaySchedule(resolvedDate, timeZone);
    const observerProvenance = createObserverProvenance(snapshot);
    const instants = new Map<number, SimulationInstant>();
    for (
      let unixMilliseconds = schedule.start.unixMilliseconds;
      unixMilliseconds <= schedule.end.unixMilliseconds;
      unixMilliseconds += samplingPolicy.cadenceMinutes * 60_000
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
    if (sortedInstants.length > samplingPolicy.maximumSamples) {
      throw new AstronomyContractError(
        'TEMPORAL_PATH_FAILURE',
        'Solar daily-path sampling exceeded the bounded geometry capacity.',
        immutableClone({
          operation: 'SolarDailyPathService.capture.aggregateSamples',
          details: temporalDetails(snapshot, timeZone, timeZoneRevision, resolvedDate, samplingPolicy, {
            sampleCount: sortedInstants.length,
          }, this.providers.astronomy.identity),
        }),
      );
    }

    const byUnixMilliseconds = new Map<number, SolarDailyPathSample>();
    for (const [sampleIndex, instant] of sortedInstants.entries()) {
      try {
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
        byUnixMilliseconds.set(instant.unixMilliseconds, immutableClone(toSample(result, observerProvenance)));
      } catch (error) {
        throw withTemporalContext(
          error,
          snapshot,
          timeZone,
          timeZoneRevision,
          resolvedDate,
          samplingPolicy,
          'SolarDailyPathService.capture.calculateSample',
          { sampleIndex, sampleInstantUtc: instant.utcIso },
          this.providers.astronomy.identity,
        );
      }
    }
    const samples = Object.freeze(sortedInstants.map((instant) => {
      const sample = byUnixMilliseconds.get(instant.unixMilliseconds);
      if (!sample) throw new AstronomyContractError(
        'TEMPORAL_PATH_FAILURE',
        'Solar daily-path sample is missing after provider calculation.',
        immutableClone({
          operation: 'SolarDailyPathService.capture.aggregateSamples',
          details: temporalDetails(snapshot, timeZone, timeZoneRevision, resolvedDate, samplingPolicy, {
            sampleInstantUtc: instant.utcIso,
          }, this.providers.astronomy.identity),
        }),
      );
      return sample;
    }));
    const sampleIndexByInstant = new Map(samples.map((sample, index) => [sample.instant.unixMilliseconds, index]));
    const hourNotches = Object.freeze(schedule.hourBoundaries.map((civil) => {
      const pathSampleIndex = sampleIndexByInstant.get(civil.instant.unixMilliseconds);
      const sample = byUnixMilliseconds.get(civil.instant.unixMilliseconds);
      if (pathSampleIndex === undefined || !sample) {
        throw new AstronomyContractError(
          'TEMPORAL_PATH_FAILURE',
          'Civil-hour Sun notch must be an exact calculated daily-path sample.',
          immutableClone({
            operation: 'SolarDailyPathService.capture.createHourNotches',
            details: temporalDetails(snapshot, timeZone, timeZoneRevision, resolvedDate, samplingPolicy, {
              civilHourBoundary: civil,
            }, this.providers.astronomy.identity),
          }),
        );
      }
      return Object.freeze({ ...sample, civil, pathSampleIndex });
    }));
    assertSolarDailyPathObserverProvenance(observerProvenance, samples, hourNotches);
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
        observer: snapshot.observer.observer,
        observerRevision: snapshot.revisions.observer,
        observerModel: 'WGS84_GEODETIC' as const,
        observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
        observerProvenance,
        pathSamplingPolicyId: samplingPolicy.id,
        pathSamplingPolicy: samplingPolicy,
      },
      warnings: createWarnings(snapshot, timeZone),
      snapshotIdentity: {
        observerRevision: snapshot.revisions.observer,
        configurationRevision: snapshot.revisions.configuration,
        selectedCivilDate: resolvedDate,
        timeZoneRevision,
      },
    });
    this.cache.set(cacheKey, path);
    if (this.cache.size > MAX_CACHED_DAILY_PATHS) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest) this.cache.delete(oldest);
    }
      return path;
    } catch (error) {
      throw withTemporalContext(
        error,
        snapshot,
        timeZone,
        timeZoneRevision,
        resolvedDate,
        samplingPolicy,
        'SolarDailyPathService.capture',
        {},
        this.providers.astronomy.identity,
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
