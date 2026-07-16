import { describe, expect, it } from 'vitest';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import {
  SimulationClock,
  validateSimulationClockState,
} from '../../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { createSimulationInstant } from '../../../src/science/astronomy/time';

const instant = () => createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test');
const mutableInstant = (
  utcIso = '2025-06-21T16:00:00Z',
  source: Parameters<typeof createSimulationInstant>[1] = 'frozen-test',
) => ({ ...createSimulationInstant(utcIso, source) });
const serializedConfiguration = (revision: unknown = 0) => ({
  version: 1,
  revision,
  precisionTier: 'TIER_1',
  bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
  meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
  refractionPolicy: 'disabled',
  enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'],
});
const calibrated = (yawRadians = 0.25, acceptedRevision?: number) => ({
  kind: 'calibrated' as const,
  calibration: {
    yawRadians,
    capturedDirection: { x: 0, y: 0 as const, z: -1 },
    timestamp: 1,
    simulated: true,
    ...(acceptedRevision === undefined ? {} : { acceptedRevision }),
  },
});

describe('revisioned observer state', () => {
  it('is not ready initially, sets, replaces, and clears deterministically', () => {
    const store = new ObserverStateStore();
    expect(store.current).toMatchObject({ kind: 'not-ready', revision: 0 });
    const first = store.set({ latitudeDeg: 38.9, longitudeDegEast: -77.0, elevationMeters: 10, source: 'manual' });
    const same = store.set({ latitudeDeg: 38.9, longitudeDegEast: -77.0, elevationMeters: 10, source: 'manual' });
    const replacement = store.set({ latitudeDeg: -33.8, longitudeDegEast: 151.2, elevationMeters: 20 });
    expect(first).toMatchObject({ kind: 'ready', revision: 1 });
    expect(same).toBe(first);
    expect(replacement).toMatchObject({ kind: 'ready', revision: 2 });
    expect(store.clear()).toEqual({ kind: 'not-ready', revision: 3 });
  });

  it('serializes and revalidates restoration', () => {
    const source = new ObserverStateStore();
    source.set({ latitudeDeg: 51.5, longitudeDegEast: -0.12, elevationMeters: 25, uncertainty: { horizontalMeters: 3 } });
    const restored = new ObserverStateStore();
    const state = restored.restore(JSON.parse(JSON.stringify(source.serialize())));
    expect(state.kind).toBe('ready');
    if (state.kind === 'ready') expect(state.observer.longitudeDegEast).toBeCloseTo(-0.12, 12);
    expect(() => restored.restore({ version: 2, state } as never)).toThrow('Unsupported observer-state');
  });
});

describe('explicit simulation clock', () => {
  it('owns immutable instant values across construction, selection, ticking, and restoration', () => {
    const initialInput = mutableInstant();
    const clock = new SimulationClock(initialInput);
    const initialState = clock.current;
    initialInput.utcIso = '2025-06-22T16:00:00.000Z';
    initialInput.unixMilliseconds = 0;
    initialInput.source = 'user-selected';
    expect(clock.current).toBe(initialState);
    expect(clock.current).toMatchObject({
      instant: {
        utcIso: '2025-06-21T16:00:00.000Z',
        source: 'frozen-test',
      },
      revision: 0,
    });
    expect(Object.isFrozen(clock.current.instant)).toBe(true);
    expect(() => {
      (clock.current.instant as { utcIso: string }).utcIso = 'mutated';
    }).toThrow();

    const selectedInput = mutableInstant('2025-06-22T16:00:00Z', 'user-selected');
    const selected = clock.selectFrozen(selectedInput);
    selectedInput.utcIso = '2025-06-23T16:00:00.000Z';
    selectedInput.unixMilliseconds = 0;
    selectedInput.source = 'system-selected';
    expect(selected.instant).toMatchObject({
      utcIso: '2025-06-22T16:00:00.000Z',
      source: 'user-selected',
    });
    expect(selected.revision).toBe(1);

    clock.startRealtime();
    const ticked = clock.tick(1_000);
    expect(ticked.instant.utcIso).toBe('2025-06-22T16:00:01.000Z');
    expect(Object.isFrozen(ticked.instant)).toBe(true);

    const serialized = JSON.parse(JSON.stringify(clock.serialize()));
    const restoredClock = new SimulationClock(instant());
    const restored = restoredClock.restore(serialized);
    serialized.state.instant.utcIso = '2025-06-24T16:00:00.000Z';
    serialized.state.instant.source = 'frozen-test';
    expect(restored.instant.utcIso).toBe('2025-06-22T16:00:01.000Z');
    expect(restored.instant.source).toBe('system-selected');
    expect(Object.isFrozen(restored.instant)).toBe(true);
  });

  it('does not share owned instant objects between clock instances', () => {
    const sharedInput = mutableInstant();
    const first = new SimulationClock(sharedInput);
    const second = new SimulationClock(sharedInput);
    expect(first.current.instant).not.toBe(sharedInput);
    expect(second.current.instant).not.toBe(sharedInput);
    expect(first.current.instant).not.toBe(second.current.instant);
    sharedInput.unixMilliseconds = 0;
    expect(first.current.instant.unixMilliseconds).toBe(Date.parse('2025-06-21T16:00:00Z'));
    expect(second.current.instant.unixMilliseconds).toBe(Date.parse('2025-06-21T16:00:00Z'));
  });

  it('rejects invalid structural instants at clock construction and selection boundaries', () => {
    expect(() => new SimulationClock({ ...instant(), unixMilliseconds: 0 })).toThrowError(
      expect.objectContaining({ code: 'INVALID_INSTANT' }),
    );
    const clock = new SimulationClock(instant());
    const before = clock.current;
    expect(() => clock.selectFrozen({ ...instant(), source: 'ambient' as never })).toThrowError(
      expect.objectContaining({ code: 'INVALID_INSTANT' }),
    );
    expect(clock.current).toBe(before);
  });

  it('validates and owns complete structural clock states at runtime', () => {
    const sourceInstant = mutableInstant();
    const normalized = validateSimulationClockState({
      version: 1,
      mode: 'frozen',
      paused: true,
      timeRate: 1,
      instant: sourceInstant,
      revision: 0,
    });
    expect(normalized.instant).not.toBe(sourceInstant);
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(Object.isFrozen(normalized.instant)).toBe(true);
    sourceInstant.unixMilliseconds = 0;
    expect(normalized.instant.unixMilliseconds).toBe(Date.parse('2025-06-21T16:00:00Z'));
  });

  it.each([
    ['unsupported version', { version: 2, mode: 'frozen', paused: true, timeRate: 1, instant: instant(), revision: 0 }],
    ['unknown mode', { version: 1, mode: 'other', paused: true, timeRate: 1, instant: instant(), revision: 0 }],
    ['missing mode', { version: 1, paused: true, timeRate: 1, instant: instant(), revision: 0 }],
    ['missing paused state', { version: 1, mode: 'frozen', timeRate: 1, instant: instant(), revision: 0 }],
    ['missing rate', { version: 1, mode: 'frozen', paused: true, instant: instant(), revision: 0 }],
    ['negative revision', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: instant(), revision: -1 }],
    ['fractional revision', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: instant(), revision: 1.5 }],
    ['string revision', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: instant(), revision: '1' }],
    ['missing revision', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: instant() }],
    ['unsafe revision', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: instant(), revision: Number.MAX_SAFE_INTEGER + 1 }],
    ['NaN rate', { version: 1, mode: 'frozen', paused: true, timeRate: Number.NaN, instant: instant(), revision: 0 }],
    ['infinite rate', { version: 1, mode: 'frozen', paused: true, timeRate: Number.POSITIVE_INFINITY, instant: instant(), revision: 0 }],
    ['contradictory frozen state', { version: 1, mode: 'frozen', paused: false, timeRate: 1, instant: instant(), revision: 0 }],
    ['invalid instant source', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: { ...instant(), source: 'ambient' }, revision: 0 }],
    ['disagreeing instant fields', { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: { ...instant(), unixMilliseconds: 0 }, revision: 0 }],
    ['missing instant', { version: 1, mode: 'frozen', paused: true, timeRate: 1, revision: 0 }],
    ['null', null],
    ['scalar', 'clock'],
  ])('rejects invalid runtime clock state: %s', (_name, value) => {
    expect(() => validateSimulationClockState(value)).toThrowError(
      expect.objectContaining({ code: 'INVALID_INSTANT' }),
    );
  });

  it('advances only through an explicit running tick and supports negative rates', () => {
    const clock = new SimulationClock(instant());
    expect(clock.tick(10_000)).toBe(clock.current);
    clock.startRealtime();
    expect(clock.tick(2_000).instant.utcIso).toBe('2025-06-21T16:00:02.000Z');
    clock.setRate(-2);
    expect(clock.tick(1_000).instant.utcIso).toBe('2025-06-21T16:00:00.000Z');
    clock.pause();
    expect(clock.tick(2_000).instant.utcIso).toBe('2025-06-21T16:00:00.000Z');
  });

  it('supports zero rate, rejects invalid ticks, and restores explicit selections', () => {
    const clock = new SimulationClock(instant());
    clock.startRealtime();
    clock.setRate(0);
    expect(clock.tick(500).instant.utcIso).toBe(instant().utcIso);
    expect(() => clock.tick(-1)).toThrow('elapsed');
    const serialized = JSON.parse(JSON.stringify(clock.serialize()));
    const restored = new SimulationClock(instant());
    expect(restored.restore(serialized).timeRate).toBe(0);
    expect(() => restored.restore({ version: 2 } as never)).toThrow('Unsupported simulation-clock');
  });

  it('uses value-based revisions for equivalent frozen selections and state changes only', () => {
    const clock = new SimulationClock(instant());
    const initial = clock.current;
    expect(clock.selectFrozen(instant())).toBe(initial);
    expect(clock.current.revision).toBe(0);
    expect(clock.setRate(1)).toBe(initial);
    expect(clock.pause()).toBe(initial);
    expect(clock.tick(0)).toBe(initial);

    expect(clock.selectFrozen(createSimulationInstant('2025-06-21T16:00:01Z', 'frozen-test')).revision).toBe(1);
    expect(clock.setRate(-2).revision).toBe(2);
    expect(clock.startRealtime().revision).toBe(3);
    expect(clock.tick(500).revision).toBe(4);
    expect(clock.pause().revision).toBe(5);
    expect(clock.pause().revision).toBe(5);
    expect(clock.tick(500).revision).toBe(5);
    clock.startRealtime();
    clock.setRate(0);
    const zeroRate = clock.current;
    expect(clock.tick(500)).toBe(zeroRate);
  });

  it('keeps semantic restoration and already-running transitions as revision no-ops', () => {
    const clock = new SimulationClock(instant());
    const initial = clock.current;
    expect(clock.restore(JSON.parse(JSON.stringify(clock.serialize())))).toBe(initial);
    expect(clock.current.revision).toBe(0);
    const running = clock.startRealtime();
    expect(clock.startRealtime()).toBe(running);
    expect(clock.current.revision).toBe(1);
  });

  it.each([
    { version: 2 },
    { version: 1, state: { version: 1, mode: 'invalid-mode', paused: true, timeRate: 1, instant: instant(), revision: 0 } },
    { version: 1, state: { version: 1, mode: 'frozen', paused: true, timeRate: Number.NaN, instant: instant(), revision: 0 } },
    { version: 1, state: { version: 1, mode: 'frozen', paused: true, timeRate: 1, instant: { ...instant(), utcIso: 'bad-time' }, revision: 0 } },
    { version: 1, state: { version: 1, mode: 'frozen', paused: false, timeRate: 1, instant: instant(), revision: 0 } },
    null,
    'clock',
  ])('rejects malformed clock restoration payload %#', (serialized) => {
    expect(() => new SimulationClock(instant()).restore(serialized as never)).toThrowError(
      expect.objectContaining({ code: 'INVALID_INSTANT' }),
    );
  });
});

describe('read-only geographic calibration view', () => {
  it('adapts calibration without importing XR/controller objects and invalidates reset', () => {
    const adapter = new GeographicCalibrationStateAdapter();
    expect(adapter.update({ kind: 'uncalibrated' })).toMatchObject({ kind: 'not-ready', revision: 0 });
    const ready = adapter.update(calibrated(), 'session-a');
    expect(ready).toEqual({ kind: 'ready', yawRadians: 0.25, revision: 1, provenance: 'user-calibrated-true-north', originIdentity: 'session-a' });
    expect(adapter.update(calibrated(), 'session-a')).toBe(ready);
    expect(adapter.update(calibrated(-0.5), 'session-a')).toMatchObject({ kind: 'ready', revision: 2, yawRadians: -0.5 });
    expect(adapter.update({ kind: 'uncalibrated' })).toMatchObject({ kind: 'not-ready', revision: 3, reason: 'invalidated' });
  });

  it('uses accepted calibration event identity to invalidate same-yaw snapshots', () => {
    const adapter = new GeographicCalibrationStateAdapter();
    const first = adapter.update(calibrated(0.25, 1), 'same-origin');
    const repeat = adapter.update(calibrated(0.25, 1), 'same-origin');
    const recalibrated = adapter.update(calibrated(0.25, 2), 'same-origin');
    expect(repeat).toBe(first);
    expect(recalibrated).toMatchObject({ kind: 'ready', yawRadians: 0.25, acceptedCalibrationRevision: 2, revision: 2 });
    expect(adapter.update({ kind: 'invalid-direction', message: 'invalid', previousCalibration: calibrated(0.25, 2).calibration }, 'same-origin')).toBe(recalibrated);
    expect(adapter.update({ kind: 'uncalibrated' })).toMatchObject({ kind: 'not-ready', revision: 3, reason: 'invalidated' });
  });

  it('marks an explicit reference-space invalidation as not ready', () => {
    const adapter = new GeographicCalibrationStateAdapter();
    adapter.update(calibrated());
    expect(adapter.invalidate()).toEqual({ kind: 'not-ready', revision: 2, reason: 'invalidated' });
  });
});

describe('scientific configuration', () => {
  it('keeps only the validated Tier 1 model and distinguishes refraction', () => {
    const store = new ScientificConfigurationStore();
    expect(store.current.precisionTier).toBe('TIER_1');
    const normal = store.replace({
      precisionTier: 'TIER_1',
      bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION',
      meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
      refractionPolicy: 'normal',
      enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'],
    });
    expect(normal.revision).toBe(1);
    expect(() => store.replace({ ...normal, precisionTier: 'TIER_2' as never })).toThrow('validated Tier 1');
    expect(() => store.replace({ ...normal, refractionPolicy: 'disabled' })).toThrow('Refraction policy');
  });

  it('normalizes, clones, and freezes provider identity without retaining caller arrays', () => {
    const providers = ['P03 Mean Pole', 'Astronomy Engine'] as const;
    const store = new ScientificConfigurationStore();
    const configuration = store.replace({
      precisionTier: 'TIER_1',
      bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
      meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
      refractionPolicy: 'disabled',
      enabledProviders: providers,
    });
    (providers as unknown as string[]).reverse();
    expect(configuration.enabledProviders).toEqual(['Astronomy Engine', 'P03 Mean Pole']);
    expect(Object.isFrozen(configuration.enabledProviders)).toBe(true);
    expect(() => (configuration.enabledProviders as unknown as string[]).push('unexpected')).toThrow();
  });

  it.each([
    { ...serializedConfiguration(), version: 2 },
    { ...serializedConfiguration(), precisionTier: 'TIER_2' },
    { ...serializedConfiguration(), bodyCorrectionProfile: 'UNSUPPORTED' },
    { ...serializedConfiguration(), refractionPolicy: 'normal' },
    { ...serializedConfiguration(), meanPoleModel: 'OTHER' },
    { ...serializedConfiguration(), enabledProviders: ['Unknown', 'P03 Mean Pole'] },
    { ...serializedConfiguration(), enabledProviders: ['Astronomy Engine', 'Astronomy Engine'] },
    { ...serializedConfiguration(), enabledProviders: 'P03 Mean Pole' },
    (() => { const value = serializedConfiguration(); delete (value as { enabledProviders?: unknown }).enabledProviders; return value; })(),
    null,
    3,
  ])('rejects malformed scientific-configuration restoration payload %#', (serialized) => {
    expect(() => new ScientificConfigurationStore().restore(serialized as never)).toThrowError(
      expect.objectContaining({ code: 'UNSUPPORTED_CORRECTION_PROFILE' }),
    );
  });

  it.each([
    ['missing', (() => { const value = serializedConfiguration(); delete (value as { revision?: unknown }).revision; return value; })()],
    ['negative', serializedConfiguration(-1)],
    ['fractional', serializedConfiguration(1.5)],
    ['string', serializedConfiguration('1')],
    ['NaN', serializedConfiguration(Number.NaN)],
    ['infinite', serializedConfiguration(Number.POSITIVE_INFINITY)],
    ['null', serializedConfiguration(null)],
    ['unsafe integer', serializedConfiguration(Number.MAX_SAFE_INTEGER + 1)],
  ])('rejects an invalid serialized configuration revision: %s', (_name, serialized) => {
    expect(() => new ScientificConfigurationStore().restore(serialized)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REVISION' }),
    );
  });

  it.each([0, 7, Number.MAX_SAFE_INTEGER])(
    'accepts safe non-negative serialized configuration revision %s',
    (revision) => {
      const store = new ScientificConfigurationStore();
      expect(() => store.restore(serializedConfiguration(revision))).not.toThrow();
      expect(store.current.revision).toBe(0);
    },
  );
});
