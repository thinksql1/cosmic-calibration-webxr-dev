import { describe, expect, it, vi } from 'vitest';
import { createSimulationInstant } from '../../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import { SimulationClock } from '../../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../../src/science/snapshot/scientificSnapshotBuilder';
import { ScientificSnapshotService } from '../../../src/science/snapshot/scientificSnapshotService';
import type { ScientificSnapshot } from '../../../src/science/snapshot/scientificSnapshot';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
} from '../../../src/science/astronomy/meanPoleProvider';

function input(): ScientificSnapshotInput {
  const observer = new ObserverStateStore();
  observer.set({
    latitudeDeg: 38.8977,
    longitudeDegEast: -77.0365,
    elevationMeters: 17,
    source: 'fixture',
    uncertainty: { horizontalMeters: 3, verticalMeters: 5 },
  });
  const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test'));
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: -0.4, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  return { observer: observer.current, clock: clock.current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 7 };
}

describe('scientific snapshot builder', () => {
  it('builds a frozen, provenance-rich P03 axis snapshot with a right-handed equator basis', () => {
    const result = buildScientificSnapshot(input());
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    const { snapshot } = result;
    const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
    const cross = {
      x: snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.z - snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.y,
      y: snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.x - snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.z,
      z: snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.y - snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.x,
    };
    expect(snapshot.earthAxis.south).toMatchObject({ x: -snapshot.earthAxis.north.x, y: -snapshot.earthAxis.north.y, z: -snapshot.earthAxis.north.z });
    expect(dot(snapshot.equatorBasis.first, snapshot.earthAxis.north)).toBeCloseTo(0, 12);
    expect(dot(snapshot.equatorBasis.second, snapshot.earthAxis.north)).toBeCloseTo(0, 12);
    expect(dot(snapshot.equatorBasis.normal, snapshot.earthAxis.north)).toBeCloseTo(1, 12);
    expect(dot(cross, snapshot.earthAxis.north)).toBeCloseTo(1, 12);
    expect(snapshot.frameContract.calibratedYawApplication).toBe('presentation-parent-only');
    expect(snapshot.frameContract.celestialAxisPipeline).toBe('GCRS_P03_MEAN_DATE_AXIS_TO_WGS84_EARTH_FIXED_TO_HORIZONTAL_ENU');
    expect(snapshot.observerHorizontalEarthAxis).toMatchObject({
      model: 'IAU_P03_PRECESSION_ONLY',
      sourceFrame: 'GCRS',
      outputFrame: 'HORIZONTAL_ENU',
      north: { altitudeDeg: 38.8977, azimuthDeg: 0 },
      south: { altitudeDeg: -38.8977, azimuthDeg: 180 },
    });
    expect(snapshot.providers).toEqual({ astronomyEngineVersion: '2.1.19', meanPoleProviderVersion: '1.0.0' });
    expect(snapshot.warnings).toHaveLength(6);
    expect(snapshot.warnings).toContainEqual(expect.objectContaining({
      code: 'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
    }));
    const heightWarning = snapshot.warnings.find(
      ({ code }) => code === 'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
    );
    expect(heightWarning).toMatchObject({
      metadata: {
        applicability: 'ACTIVE_OBSERVER_RELATIVE_PROFILE_PREPARED',
        applicationVerticalDatum: 'MEAN_SEA_LEVEL',
        observerProvenance: 'fixture',
        providerElevationConvention: 'MEAN_SEA_LEVEL_METERS',
        comparisonReferenceConvention: 'REFERENCE_ELLIPSOID_HEIGHT_MAY_APPLY',
        effectCategory: 'POSSIBLE_SMALL_TOPOCENTRIC_POSITION_DIFFERENCE',
        precisionClassification: 'TIER_1_NON_FATAL',
      },
    });
    expect(heightWarning?.message).toContain("retains the observer's declared");
    expect(heightWarning?.message).toContain('small topocentric positional differences');
    expect(Object.isFrozen(heightWarning?.metadata)).toBe(true);
    expect(snapshot.earthAxis.provenance).toMatchObject({
      provider: P03_MEAN_POLE_PROVIDER,
      providerVersion: P03_MEAN_POLE_PROVIDER_VERSION,
    });
    expect(snapshot.providers.meanPoleProviderVersion).toBe(P03_MEAN_POLE_PROVIDER_VERSION);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.earthAxis)).toBe(true);
  });

  it.each([
    ['observer', (value: ScientificSnapshotInput) => ({ ...value, observer: { kind: 'not-ready' as const, revision: 4 } })],
    ['calibration', (value: ScientificSnapshotInput) => ({ ...value, calibration: { kind: 'not-ready' as const, revision: 4, reason: 'invalidated' as const } })],
    ['configuration', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, precisionTier: 'TIER_2' as never } })],
    ['correction profile', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, bodyCorrectionProfile: 'UNSUPPORTED' as never } })],
    ['refraction policy', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, refractionPolicy: 'normal' as never } })],
    ['non-canonical provider order', (value: ScientificSnapshotInput) => ({ ...value, configuration: { ...value.configuration, enabledProviders: ['P03 Mean Pole', 'Astronomy Engine'] as never } })],
  ])('returns structured not-ready errors for missing or unsupported %s', (_name, mutate) => {
    const result = buildScientificSnapshot(mutate(input()));
    expect(result.kind).toBe('not-ready');
    if (result.kind === 'not-ready') expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects every malformed direct clock contract before any provider work', () => {
    const baseline = input();
    const invalidClocks: readonly unknown[] = [
      { ...baseline.clock, version: 2 },
      { ...baseline.clock, mode: 'unsupported-mode' },
      (() => { const value = { ...baseline.clock } as { mode?: unknown }; delete value.mode; return value; })(),
      (() => { const value = { ...baseline.clock } as { paused?: unknown }; delete value.paused; return value; })(),
      (() => { const value = { ...baseline.clock } as { timeRate?: unknown }; delete value.timeRate; return value; })(),
      { ...baseline.clock, revision: -1 },
      { ...baseline.clock, revision: 1.5 },
      { ...baseline.clock, revision: '1' },
      (() => { const value = { ...baseline.clock } as { revision?: unknown }; delete value.revision; return value; })(),
      { ...baseline.clock, timeRate: Number.NaN },
      { ...baseline.clock, timeRate: Number.POSITIVE_INFINITY },
      { ...baseline.clock, mode: 'frozen', paused: false },
      { ...baseline.clock, instant: { ...baseline.clock.instant, source: 'ambient' } },
      { ...baseline.clock, instant: { ...baseline.clock.instant, unixMilliseconds: 0 } },
      { ...baseline.clock, instant: null },
      null,
      'clock',
    ];

    for (const clock of invalidClocks) {
      const value = input();
      const getMeanPole = vi.fn(value.providers.meanPole.getMeanPole);
      const getObserverRelativePosition = vi.fn(
        value.providers.astronomy.getObserverRelativePosition,
      );
      const providers = {
        astronomy: Object.freeze({
          ...value.providers.astronomy,
          getObserverRelativePosition,
        }),
        meanPole: Object.freeze({
          ...value.providers.meanPole,
          getMeanPole,
        }),
      } as ScientificSnapshotInput['providers'];
      const result = buildScientificSnapshot({
        ...value,
        clock: clock as ScientificSnapshotInput['clock'],
        providers,
      });
      expect(result).toMatchObject({
        kind: 'not-ready',
        errors: [expect.objectContaining({ code: 'INVALID_INPUT' })],
      });
      expect(getMeanPole).not.toHaveBeenCalled();
      expect(getObserverRelativePosition).not.toHaveBeenCalled();
    }
  });

  it('returns structured not-ready through the service for an invalid clock', () => {
    const value = input();
    const getMeanPole = vi.fn(value.providers.meanPole.getMeanPole);
    const providers = {
      ...value.providers,
      meanPole: Object.freeze({ ...value.providers.meanPole, getMeanPole }),
    } as ScientificSnapshotInput['providers'];
    const service = new ScientificSnapshotService(providers);
    const result = service.capture({
      observer: value.observer,
      clock: { ...value.clock, mode: 'invalid' } as never,
      calibration: value.calibration,
      configuration: value.configuration,
    });
    expect(result).toMatchObject({
      kind: 'not-ready',
      errors: [expect.objectContaining({ code: 'INVALID_INPUT' })],
    });
    expect(getMeanPole).not.toHaveBeenCalled();
    expect(service.cacheDiagnostics).toEqual({ hits: 0, misses: 0, entries: 0 });
  });

  it('omits the height warning without a valid observer and keeps invalid input fatal', () => {
    const missing = input();
    const missingResult = buildScientificSnapshot({
      ...missing,
      observer: { kind: 'not-ready', revision: 4 },
    });
    expect(missingResult.kind).toBe('not-ready');
    if (missingResult.kind === 'not-ready') {
      expect(missingResult.errors).toContainEqual(expect.objectContaining({ code: 'OBSERVER_MISSING' }));
      expect(missingResult.warnings.map(({ code }) => code)).not.toContain(
        'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
      );
    }

    const invalid = input();
    const getMeanPole = vi.fn(invalid.providers.meanPole.getMeanPole);
    const invalidResult = buildScientificSnapshot({
      ...invalid,
      observer: {
        kind: 'ready',
        revision: 1,
        observer: {
          ...(invalid.observer.kind === 'ready' ? invalid.observer.observer : {}),
          latitudeDeg: 100,
        },
      } as never,
      providers: {
        ...invalid.providers,
        meanPole: Object.freeze({ ...invalid.providers.meanPole, getMeanPole }),
      } as ScientificSnapshotInput['providers'],
    });
    expect(invalidResult).toMatchObject({
      kind: 'not-ready',
      errors: [expect.objectContaining({ code: 'INVALID_INPUT' })],
    });
    if (invalidResult.kind === 'not-ready') {
      expect(invalidResult.warnings.map(({ code }) => code)).not.toContain(
        'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
      );
    }
    expect(getMeanPole).not.toHaveBeenCalled();
  });

  it('does not apply the MSL comparison warning when the body profile cannot consume the declared datum', () => {
    const value = input();
    const observer = new ObserverStateStore();
    observer.set({
      latitudeDeg: 38.8977,
      longitudeDegEast: -77.0365,
      elevationMeters: 17,
      verticalDatum: 'WGS84_ELLIPSOID',
      source: 'manual-survey',
    });
    const result = buildScientificSnapshot({ ...value, observer: observer.current });
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.snapshot).not.toHaveProperty('sun');
    expect(result.snapshot.warnings.map(({ code }) => code)).not.toContain(
      'HEIGHT_DATUM_REFERENCE_DIFFERENCE',
    );
  });

  it('maps P03 domain errors instead of leaking an untyped provider exception', () => {
    const value = input();
    const oldClock = new SimulationClock(createSimulationInstant('1800-01-01T00:00:00Z', 'frozen-test'));
    const result = buildScientificSnapshot({ ...value, clock: oldClock.current });
    expect(result).toMatchObject({ kind: 'not-ready', errors: [{ code: 'MODEL_DOMAIN' }] });
  });

  it('is deterministic for equal explicit inputs and keeps body diagnostics out of the snapshot', () => {
    const first = buildScientificSnapshot(input());
    const second = buildScientificSnapshot(input());
    expect(first).toEqual(second);
    if (first.kind === 'ready') expect(first.snapshot).not.toHaveProperty('sun');
  });

  it('offers one explicit state-to-snapshot orchestration entry point', () => {
    const value = input();
    const service = new ScientificSnapshotService(value.providers);
    const first = service.capture(value);
    const second = service.capture(value);
    expect(first.kind).toBe('ready');
    expect(second).toEqual(first);
    expect(service.cacheDiagnostics).toMatchObject({ hits: 1, misses: 1 });
  });

  it('deeply isolates nested provider values, warnings, and basis vectors', () => {
    const result = buildScientificSnapshot(input());
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    const { snapshot } = result;
    expect(() => { (snapshot.earthAxis.provenance as { provider: string }).provider = 'mutated'; }).toThrow();
    expect(() => { (snapshot.warnings as ScientificSnapshot['warnings'] as unknown as { code: string }[])[0]!.code = 'mutated'; }).toThrow();
    expect(() => { (snapshot.equatorBasis.first as { x: number }).x = 42; }).toThrow();
    expect(() => { (snapshot.equatorBasis.second as { y: number }).y = 42; }).toThrow();
    expect(() => { (snapshot.equatorBasis.normal as { z: number }).z = 42; }).toThrow();
    expect(() => { (snapshot.earthAxis.south as { x: number }).x = 42; }).toThrow();
    expect(() => { (snapshot.observerHorizontalEarthAxis.north.direction as { up: number }).up = 42; }).toThrow();
    expect(() => { (snapshot.configuration.enabledProviders as unknown as string[]).push('mutated'); }).toThrow();
    expect(() => {
      (snapshot.observer.observer.uncertainty as { horizontalMeters: number }).horizontalMeters = 42;
    }).toThrow();
    expect(() => { (snapshot.revisions as { time: number }).time = 42; }).toThrow();
    expect(snapshot.earthAxis.provenance.provider).toBe(P03_MEAN_POLE_PROVIDER);
  });
});
