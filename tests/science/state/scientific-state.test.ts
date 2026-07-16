import { describe, expect, it } from 'vitest';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import { SimulationClock } from '../../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { createSimulationInstant } from '../../../src/science/astronomy/time';

const instant = () => createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test');
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
    { version: 2 },
    { version: 1, precisionTier: 'TIER_2', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'UNSUPPORTED', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'normal', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'OTHER', refractionPolicy: 'disabled', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: ['Unknown', 'P03 Mean Pole'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: ['Astronomy Engine', 'Astronomy Engine'] },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: 'P03 Mean Pole' },
    { version: 1, precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled' },
    null,
    3,
  ])('rejects malformed scientific-configuration restoration payload %#', (serialized) => {
    expect(() => new ScientificConfigurationStore().restore(serialized as never)).toThrowError(
      expect.objectContaining({ code: 'UNSUPPORTED_CORRECTION_PROFILE' }),
    );
  });
});
