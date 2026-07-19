import { describe, expect, it } from 'vitest';
import { AstronomyContractError } from '../../src/science/astronomy/errors';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import type { ApparentTopocentricBodyResult } from '../../src/science/astronomy/types';
import {
  assertSolarDailyPathObserverProvenance,
  SOLAR_DAILY_PATH_OBSERVER_MODEL,
  SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
  SolarDailyPathService,
  type SolarDailyHourNotch,
  type SolarDailyPathObserverProvenance,
  type SolarDailyPathSample,
  type SolarDailyPathWarning,
} from '../../src/science/temporal/solarDailyPath';
import { resolveTimeZone } from '../../src/science/temporal/civilTime';
import {
  createScientificProviderRegistry,
  type ScientificProviderRegistry,
} from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function snapshot(
  instantUtc = '2025-06-21T16:00:00.000Z',
  latitudeDeg = 42,
  longitudeDegEast = -83,
) {
  const observer = new ObserverStateStore();
  observer.set({
    latitudeDeg,
    longitudeDegEast,
    elevationMeters: 250,
    source: 'solar path fixture',
    uncertainty: { horizontalMeters: 3, verticalMeters: 5 },
  });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true },
  });
  const input: ScientificSnapshotInput = {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant(instantUtc, 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  };
  const built = buildScientificSnapshot(input);
  if (built.kind !== 'ready') throw new Error('Expected ready solar daily-path fixture.');
  return built.snapshot;
}

const detroit = resolveTimeZone('America/Detroit', 'user-selected');

const observerProvenanceMismatchCases: readonly [
  string,
  (value: SolarDailyPathObserverProvenance) => SolarDailyPathObserverProvenance,
][] = [
  ['observer values', (value) => ({
    ...value,
    observer: { ...value.observer, latitudeDeg: value.observer.latitudeDeg + 1 },
  }) as SolarDailyPathObserverProvenance],
  ['observer revision', (value) => ({
    ...value,
    observerRevision: value.observerRevision + 1,
  })],
  ['observer provenance schema version', (value) => ({
    ...value,
    observerProvenanceSchemaVersion: 'SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_V0',
  }) as unknown as SolarDailyPathObserverProvenance],
  ['geodetic model identity', (value) => ({
    ...value,
    geodeticModel: 'NOT_WGS84',
  }) as unknown as SolarDailyPathObserverProvenance],
];

function expectContractError(
  operation: () => unknown,
  code: AstronomyContractError['code'],
): AstronomyContractError {
  try {
    operation();
    throw new Error('Expected a structured astronomy contract error.');
  } catch (error) {
    expect(error).toBeInstanceOf(AstronomyContractError);
    expect((error as AstronomyContractError).code).toBe(code);
    return error as AstronomyContractError;
  }
}

function registryWithBodyOperation(
  operation: ScientificProviderRegistry['astronomy']['getApparentTopocentricBody'],
): ScientificProviderRegistry {
  const base = createScientificProviderRegistry();
  return Object.freeze({
    ...base,
    astronomy: Object.freeze({ ...base.astronomy, getApparentTopocentricBody: operation }),
  });
}

describe('observer-relative daily apparent Sun path', () => {
  it('calculates an airless topocentric path with independently calculated exact civil-hour notches', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const path = service.capture(snapshot(), detroit, 1);
    expect(path.samples.length).toBeGreaterThan(100);
    expect(path.samples.length).toBeLessThanOrEqual(192);
    expect(path.hourNotches).toHaveLength(24);
    expect(path.correctionProfile).toBe('AE_APPARENT_TOPOCENTRIC_AIRLESS');
    expect(path.provenance.outputFrame).toBe('HORIZONTAL_ENU');
    for (const notch of path.hourNotches) {
      expect(path.samples[notch.pathSampleIndex]!.instant.utcIso).toBe(notch.instant.utcIso);
      expect(path.samples[notch.pathSampleIndex]!.direction).toEqual(notch.direction);
    }
    expect(path.samples.some((sample) => sample.aboveHorizon)).toBe(true);
    expect(path.samples.some((sample) => !sample.aboveHorizon)).toBe(true);
  });

  it('varies with the civil date and observer, retains a daily cache only for matching scientific identities', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const summer = service.capture(snapshot('2025-06-21T16:00:00.000Z'), detroit, 1);
    const sameDayDifferentCurrentTime = service.capture(snapshot('2025-06-21T20:00:00.000Z'), detroit, 1);
    const winter = service.capture(snapshot('2025-12-21T16:00:00.000Z'), detroit, 1);
    const equatorial = service.capture(snapshot('2025-06-21T16:00:00.000Z', 0), detroit, 1);
    expect(sameDayDifferentCurrentTime).toBe(summer);
    expect(winter.cacheKey).not.toBe(summer.cacheKey);
    expect(equatorial.cacheKey).not.toBe(summer.cacheKey);
    expect(winter.samples[72]!.direction).not.toEqual(summer.samples[72]!.direction);
  });

  it('has no celestial-equator constraint or non-finite output, including a DST day', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const detroitSpring = service.capture(snapshot('2025-03-09T16:00:00.000Z'), detroit, 1);
    expect(detroitSpring.hourNotches).toHaveLength(23);
    expect(detroitSpring.hourNotches.map((notch) => notch.civil.localLabel)).not.toContain('2025-03-09 02:00');
    for (const sample of detroitSpring.samples) {
      expect(Number.isFinite(sample.altitudeDeg)).toBe(true);
      expect(Number.isFinite(sample.azimuthDeg)).toBe(true);
      expect(sample.direction.frame).toBe('HORIZONTAL_ENU');
      expect(sample.direction.units).toBe('unitless');
    }
    const uniqueAltitudes = new Set(detroitSpring.samples.map((sample) => sample.altitudeDeg.toFixed(3)));
    expect(uniqueAltitudes.size).toBeGreaterThan(8);
  });

  it('rebuilds daily geometry at the resolved local-midnight boundary rather than retaining a stale date', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const beforeMidnight = service.capture(snapshot('2025-06-22T03:59:00.000Z'), detroit, 1);
    const afterMidnight = service.capture(snapshot('2025-06-22T04:00:00.000Z'), detroit, 1);
    expect(beforeMidnight.snapshotIdentity.selectedCivilDate).toEqual({ year: 2025, month: 6, day: 21 });
    expect(afterMidnight.snapshotIdentity.selectedCivilDate).toEqual({ year: 2025, month: 6, day: 22 });
    expect(afterMidnight.cacheKey).not.toBe(beforeMidnight.cacheKey);
  });

  it('returns complete immutable observer provenance and deterministic, source-aware scientific warnings', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const path = service.capture(snapshot(), detroit, 1);
    expect(path.provenance.observer).toMatchObject({
      kind: 'VALIDATED_OBSERVER',
      latitudeDeg: 42,
      longitudeDegEast: -83,
      elevationMeters: 250,
      horizontalDatum: 'WGS84',
      verticalDatum: 'MEAN_SEA_LEVEL',
      source: 'solar path fixture',
      uncertainty: { horizontalMeters: 3, verticalMeters: 5 },
    });
    expect(path.provenance.observerRevision).toBe(1);
    expect(path.provenance.observerModel).toBe('WGS84_GEODETIC');
    expect(path.provenance.observerProvenanceSchemaVersion)
      .toBe(SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION);
    expect(path.provenance.observerProvenance).toEqual({
      observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
      observerRevision: path.provenance.observerRevision,
      geodeticModel: SOLAR_DAILY_PATH_OBSERVER_MODEL,
      observer: path.provenance.observer,
    });
    for (const sample of path.samples) {
      expect(sample.observer).toEqual(path.provenance.observer);
      expect(sample.observerProvenance).toEqual(path.provenance.observerProvenance);
    }
    for (const notch of path.hourNotches) {
      expect(notch.observer).toEqual(path.provenance.observer);
      expect(notch.observerProvenance).toEqual(path.provenance.observerProvenance);
    }
    expect(path.warnings.map((warning) => warning.code)).toEqual([
      'TIER_1_UTC_APPROXIMATES_UT1',
      'AIRLESS_APPARENT_TOPOCENTRIC_POSITION',
      'NO_ATMOSPHERIC_REFRACTION',
      'BROWSER_INTL_CIVIL_TIME_RESOLVER',
      'USER_SELECTED_TIME_ZONE_SOURCE',
      'NO_PERSISTED_TIME_ZONE_SETTING',
      'NO_PRECISION_CLAIM_BEYOND_TIER_1',
    ]);
    expect(Object.isFrozen(path.provenance.observer)).toBe(true);
    expect(Object.isFrozen(path.provenance.observerProvenance)).toBe(true);
    expect(Object.isFrozen(path.provenance.observerProvenance.observer.uncertainty)).toBe(true);
    expect(Object.isFrozen(path.warnings)).toBe(true);
    expect(Object.isFrozen(path.warnings[0]!.context)).toBe(true);
    expect(JSON.parse(JSON.stringify(path.provenance.observer))).toMatchObject({ latitudeDeg: 42 });
    expect(() => {
      (path.provenance.observer as { latitudeDeg: number }).latitudeDeg = 0;
    }).toThrow();
    expect(path.provenance.observer.latitudeDeg).toBe(42);
    expect(() => {
      (path.warnings as SolarDailyPathWarning[]).push({
        code: 'NO_ATMOSPHERIC_REFRACTION',
        message: 'mutation',
        context: {},
      });
    }).toThrow();
    expect(path.warnings).toHaveLength(7);
    expect(JSON.parse(JSON.stringify(path.provenance.observerProvenance))).toEqual(
      path.provenance.observerProvenance,
    );
    const browserPath = service.capture(snapshot(), resolveTimeZone('America/Detroit', 'browser-intl'), 2);
    expect(browserPath.warnings.some((warning) => warning.code === 'BROWSER_DEFAULT_TIME_ZONE_SOURCE')).toBe(true);
  });

  it.each(observerProvenanceMismatchCases)(
    'rejects mixed %s in samples and notches',
    (_label, alterProvenance) => {
    const path = new SolarDailyPathService(createScientificProviderRegistry()).capture(snapshot(), detroit, 1);
    const expected = path.provenance.observerProvenance;
    expect(expected.observerRevision).toBe(1);
    expect(expected.observerProvenanceSchemaVersion).not.toBe(String(expected.observerRevision));
    expect(expected.observerProvenanceSchemaVersion).not.toBe(expected.geodeticModel);

    const mismatchedSample = {
      ...path.samples[0]!,
      observerProvenance: alterProvenance(path.samples[0]!.observerProvenance),
    } as SolarDailyPathSample;
    const sampleError = expectContractError(
      () => assertSolarDailyPathObserverProvenance(
        expected,
        [mismatchedSample, ...path.samples.slice(1)],
        path.hourNotches,
      ),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(sampleError.context).toMatchObject({
      operation: 'SolarDailyPathService.capture.validateObserverProvenance',
      details: { sampleIndex: 0 },
    });

    const mismatchedNotch = {
      ...path.hourNotches[0]!,
      observerProvenance: alterProvenance(path.hourNotches[0]!.observerProvenance),
    } as SolarDailyHourNotch;
    const notchError = expectContractError(
      () => assertSolarDailyPathObserverProvenance(
        expected,
        path.samples,
        [mismatchedNotch, ...path.hourNotches.slice(1)],
      ),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(notchError.context).toMatchObject({
      operation: 'SolarDailyPathService.capture.validateObserverProvenance',
      details: { civilHourBoundaryIndex: 0 },
    });
  });

  it('uniformly enriches an early invalid sampling-policy failure before cache access', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const cachedValidPath = service.capture(snapshot(), detroit, 7);
    const error = expectContractError(
      () => service.capture(snapshot(), detroit, 7, undefined, {
        id: 'INVALID_ZERO_CADENCE_V1',
        cadenceMinutes: 0,
        maximumSamples: 192,
      }),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(error.context?.operation).toBe('SolarDailyPathService.capture.samplingPolicy');
    expect(error.context?.details).toMatchObject({
      temporalFailureContextSchemaVersion: 'SOLAR_DAILY_PATH_FAILURE_CONTEXT_V1',
      observer: { latitudeDeg: 42, longitudeDegEast: -83, elevationMeters: 250 },
      observerRevision: 1,
      observerProvenance: {
        observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
        observerRevision: 1,
        geodeticModel: SOLAR_DAILY_PATH_OBSERVER_MODEL,
      },
      selectedCivilDate: { year: 2025, month: 6, day: 21 },
      timeZone: { ianaName: 'America/Detroit', source: 'user-selected', revision: 7 },
      provider: {
        expected: { provider: 'Astronomy Engine', providerVersion: '2.1.19' },
        active: { provider: 'Astronomy Engine', providerVersion: '2.1.19' },
      },
      correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      framePolicy: { sourceFrame: 'EQD_TRUE', outputFrame: 'HORIZONTAL_ENU' },
      samplingPolicy: { id: 'INVALID_ZERO_CADENCE_V1', cadenceMinutes: 0, maximumSamples: 192 },
      scientificConfigurationRevision: 0,
    });
    expect(Object.isFrozen(error.context)).toBe(true);
    expect(Object.isFrozen(error.context?.details)).toBe(true);
    expect(Object.isFrozen((error.context?.details as { observerProvenance: object }).observerProvenance)).toBe(true);
    expect(JSON.parse(JSON.stringify(error))).toMatchObject({
      code: 'TEMPORAL_PATH_FAILURE',
      context: {
        operation: 'SolarDailyPathService.capture.samplingPolicy',
        details: {
          observerProvenance: {
            observerProvenanceSchemaVersion: SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_SCHEMA_VERSION,
          },
          samplingPolicy: { cadenceMinutes: 0 },
        },
      },
    });
    expect(service.cacheSize).toBe(1);
    expect(service.capture(snapshot(), detroit, 7)).toBe(cachedValidPath);
  });

  it('wraps unexpected provider exceptions as immutable TEMPORAL_PATH_FAILURE diagnostics without caching them', () => {
    const registry = registryWithBodyOperation(() => {
      throw new Error('deliberate provider transport failure');
    });
    const service = new SolarDailyPathService(registry);
    const error = expectContractError(() => service.capture(snapshot(), detroit, 1), 'TEMPORAL_PATH_FAILURE');
    expect(error.context?.operation).toBe('SolarDailyPathService.capture.calculateSample');
    expect(error.context?.details).toMatchObject({
      observerRevision: 1,
      selectedCivilDate: { year: 2025, month: 6, day: 21 },
      timeZone: { ianaName: 'America/Detroit' },
      samplingPolicy: { id: 'LOCAL_CIVIL_DAY_EXACT_HOURS_PLUS_10_MINUTES_V1' },
    });
    expect(JSON.parse(JSON.stringify(error))).toMatchObject({
      code: 'TEMPORAL_PATH_FAILURE',
      context: { operation: 'SolarDailyPathService.capture.calculateSample' },
    });
    expect(Object.isFrozen(error.context?.details)).toBe(true);
    expect(() => {
      (error.context?.details as Record<string, unknown>).observer = 'mutation';
    }).toThrow();
    expect(service.cacheSize).toBe(0);
  });

  it('retains exact-hour operation context when a provider fails at a civil-hour sample', () => {
    const zone = resolveTimeZone('America/Detroit', 'user-selected');
    const fixture = snapshot();
    const expectedHourUtc = new Date(
      new Date('2025-06-21T04:00:00.000Z').getTime(),
    ).toISOString();
    const base = createScientificProviderRegistry();
    const registry = registryWithBodyOperation((body, instant, observer, profile) => {
      if (instant.utcIso === expectedHourUtc) throw new Error('hour-notch provider failure');
      return base.astronomy.getApparentTopocentricBody(body, instant, observer, profile);
    });
    const error = expectContractError(
      () => new SolarDailyPathService(registry).capture(fixture, zone, 1),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(error.context?.details).toMatchObject({
      sampleInstantUtc: expectedHourUtc,
      selectedCivilDate: { year: 2025, month: 6, day: 21 },
    });
  });

  it('preserves malformed provider codes with temporal sample context and rejects non-finite or observer-mismatched results', () => {
    const base = createScientificProviderRegistry();
    const malformed = registryWithBodyOperation((...args) => {
      const result = base.astronomy.getApparentTopocentricBody(...args);
      return {
        ...result,
        horizontal: {
          ...result.horizontal,
          altitudeDeg: Number.NaN,
          provenance: {
            ...result.horizontal.provenance,
            observer: { ...result.horizontal.provenance.observer!, latitudeDeg: 0 },
          },
        },
      } as ApparentTopocentricBodyResult;
    });
    const service = new SolarDailyPathService(malformed);
    const error = expectContractError(() => service.capture(snapshot(), detroit, 1), 'MALFORMED_PROVIDER_RESULT');
    expect(error.context?.operation).toBe('SolarDailyPathService.capture.calculateSample');
    expect(error.context?.underlyingCode).toBe('MALFORMED_PROVIDER_RESULT');
    expect(error.context?.details).toMatchObject({
      observer: { latitudeDeg: 42 },
      sampleIndex: 0,
    });
    expect(service.cacheSize).toBe(0);
  });

  it('rejects an otherwise finite sample whose provider provenance uses a different observer', () => {
    const base = createScientificProviderRegistry();
    const mismatchedObserver = registryWithBodyOperation((...args) => {
      const result = base.astronomy.getApparentTopocentricBody(...args);
      return {
        ...result,
        horizontal: {
          ...result.horizontal,
          provenance: {
            ...result.horizontal.provenance,
            observer: { ...result.horizontal.provenance.observer!, latitudeDeg: 0 },
          },
        },
      } as ApparentTopocentricBodyResult;
    });
    const error = expectContractError(
      () => new SolarDailyPathService(mismatchedObserver).capture(snapshot(), detroit, 1),
      'MALFORMED_PROVIDER_RESULT',
    );
    expect(error.context?.details).toMatchObject({
      observer: { latitudeDeg: 42 },
      sampleIndex: 0,
    });
  });

  it('preserves provider-identity rejection with temporal public-boundary context', () => {
    const base = createScientificProviderRegistry();
    const mismatchedIdentity = {
      ...base,
      astronomy: {
        ...base.astronomy,
        identity: { ...base.astronomy.identity, providerVersion: 'test-mismatch' as never },
      },
    } as ScientificProviderRegistry;
    const error = expectContractError(
      () => new SolarDailyPathService(mismatchedIdentity).capture(snapshot(), detroit, 1),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(error.context?.operation).toBe('SolarDailyPathService.capture');
    expect(error.context?.underlyingCode).toBe('PROVIDER_IDENTITY_MISMATCH');
    expect(error.context?.details).toMatchObject({
      provider: {
        expected: { providerVersion: '2.1.19' },
        active: { providerVersion: 'test-mismatch' },
      },
    });
  });

  it('isolates cache entries by sampling-policy identity and does not return a prior-day path after a failed rollover', () => {
    const base = createScientificProviderRegistry();
    const mutableAstronomy = { ...base.astronomy };
    const registry = {
      ...base,
      astronomy: mutableAstronomy,
    } as ScientificProviderRegistry;
    const service = new SolarDailyPathService(registry);
    const policyA = { id: 'LOCAL_CIVIL_DAY_EXACT_HOURS_PLUS_10_MINUTES_V1', cadenceMinutes: 10, maximumSamples: 192 } as const;
    const policyB = { ...policyA, id: 'LOCAL_CIVIL_DAY_EXACT_HOURS_PLUS_10_MINUTES_V2' } as const;
    const first = service.capture(snapshot(), detroit, 1, undefined, policyA);
    const changedPolicy = service.capture(snapshot(), detroit, 1, undefined, policyB);
    expect(changedPolicy).not.toBe(first);
    expect(changedPolicy.cacheKey).not.toBe(first.cacheKey);
    expect(changedPolicy.provenance.pathSamplingPolicy.id).toBe(policyB.id);
    mutableAstronomy.getApparentTopocentricBody = () => {
      throw new Error('rollover provider failure');
    };
    const error = expectContractError(
      () => service.capture(snapshot('2025-06-22T04:00:00.000Z'), detroit, 1),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(error.context?.details).toMatchObject({ selectedCivilDate: { year: 2025, month: 6, day: 22 } });
    expect(service.cacheSize).toBe(2);
  });

  it('keeps local civil resolver errors structured and rejects a bounded aggregation before cache insertion', () => {
    const service = new SolarDailyPathService(createScientificProviderRegistry());
    const invalidZone = { ...detroit, ianaName: 'Not/A_Real_Zone' };
    const zoneError = expectContractError(() => service.capture(snapshot(), invalidZone, 1), 'INVALID_TIME_ZONE');
    expect(zoneError.context?.operation).toBe('SolarDailyPathService.capture');
    expect(zoneError.context?.underlyingCode).toBe('INVALID_TIME_ZONE');
    const aggregationError = expectContractError(
      () => service.capture(snapshot(), detroit, 1, undefined, {
        id: 'TEST_TOO_SMALL_POLICY_V1',
        cadenceMinutes: 10,
        maximumSamples: 1,
      }),
      'TEMPORAL_PATH_FAILURE',
    );
    expect(aggregationError.context?.operation).toBe('SolarDailyPathService.capture.aggregateSamples');
    expect(service.cacheSize).toBe(0);
  });
});
