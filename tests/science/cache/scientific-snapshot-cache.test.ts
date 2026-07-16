import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import { SimulationClock } from '../../../src/science/state/simulationClock';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { ScientificSnapshotCache } from '../../../src/science/snapshot/scientificSnapshotCache';
import { buildScientificSnapshot } from '../../../src/science/snapshot/scientificSnapshotBuilder';
import { createScientificSnapshotKey, isCacheableTime } from '../../../src/science/snapshot/scientificSnapshotKey';
import { ScientificSnapshotService } from '../../../src/science/snapshot/scientificSnapshotService';
import { NorthCalibrationController } from '../../../src/calibration/state';

function fixture(acceptedRevision?: number) {
  const observer = new ObserverStateStore(); observer.set({ latitudeDeg: 1, longitudeDegEast: 2, elevationMeters: 3 });
  const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test'));
  const calibration = new GeographicCalibrationStateAdapter(); calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true, ...(acceptedRevision === undefined ? {} : { acceptedRevision }) } });
  const configuration = new ScientificConfigurationStore();
  const providers = createScientificProviderRegistry();
  return { observer, clock, calibration, configuration, providers };
}

describe('bounded exact-key snapshot cache', () => {
  it('encodes exact instant, calibration, correction, and provider/model versions in the key', () => {
    const f = fixture();
    const base = { observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers };
    const baseKey = createScientificSnapshotKey(base);
    expect(JSON.parse(baseKey)).toMatchObject({
      clockVersion: 1,
      instantSource: 'frozen-test',
      timeRate: 1,
      calibrationReadiness: 'ready',
      acceptedCalibrationRevision: null,
    });
    const nextClock = new SimulationClock(createSimulationInstant('2025-06-22T16:00:00Z', 'frozen-test'));
    const changedProvider = { ...f.providers, meanPole: { ...f.providers.meanPole, version: '2.0.0' as never } };
    const normalConfiguration = new ScientificConfigurationStore();
    normalConfiguration.replace({ precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'normal', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] });
    expect(createScientificSnapshotKey({ ...base, clock: nextClock.current })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({ ...base, configuration: normalConfiguration.current })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({ ...base, providers: changedProvider })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({
      ...base,
      configuration: { ...base.configuration, enabledProviders: ['Astronomy Engine'] as never },
    })).not.toBe(baseKey);
    const reordered = new ScientificConfigurationStore();
    reordered.replace({ precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'disabled', enabledProviders: ['P03 Mean Pole', 'Astronomy Engine'] });
    expect(createScientificSnapshotKey({ ...base, configuration: reordered.current })).toBe(baseKey);
  });

  it('separates instant provenance, rate, and explicit accepted-capture identity', () => {
    const f = fixture(1);
    const base = {
      observer: f.observer.current,
      clock: f.clock.current,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
      providers: f.providers,
    };
    const baseKey = createScientificSnapshotKey(base);
    const differentSource = new SimulationClock(
      createSimulationInstant('2025-06-21T16:00:00Z', 'user-selected'),
    );
    expect(createScientificSnapshotKey({ ...base, clock: differentSource.current })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({
      ...base,
      clock: { ...base.clock, timeRate: 2 },
    })).not.toBe(baseKey);
    expect(base.calibration.kind).toBe('ready');
    if (base.calibration.kind !== 'ready') return;
    const changedAcceptedIdentity = {
      ...base.calibration,
      revision: base.calibration.revision,
      acceptedCalibrationRevision: 2,
    };
    const changedKey = createScientificSnapshotKey({
      ...base,
      calibration: changedAcceptedIdentity,
    });
    expect(changedKey).not.toBe(baseKey);
    expect(JSON.parse(baseKey).acceptedCalibrationRevision).toBe(1);
    expect(JSON.parse(changedKey).acceptedCalibrationRevision).toBe(2);
  });

  it('freezes key identity at construction despite later caller mutation', () => {
    const f = fixture(1);
    const mutableInstant = { ...f.clock.current.instant };
    const mutableClock = { ...f.clock.current, instant: mutableInstant };
    const request = {
      observer: f.observer.current,
      clock: mutableClock,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
      providers: f.providers,
    };
    const frozenKey = createScientificSnapshotKey(request);
    mutableInstant.source = 'user-selected';
    expect(JSON.parse(frozenKey).instantSource).toBe('frozen-test');
    expect(createScientificSnapshotKey(request)).not.toBe(frozenKey);
  });

  it('keeps clock state, snapshot time, and key stable after original instant mutation', () => {
    const f = fixture(1);
    const originalInstant: {
      utcIso: string;
      unixMilliseconds: number;
      source: Parameters<typeof createSimulationInstant>[1];
    } = {
      ...createSimulationInstant('2025-06-21T16:00:00Z', 'user-selected'),
    };
    const clock = new SimulationClock(originalInstant);
    const service = new ScientificSnapshotService(f.providers);
    const state = {
      observer: f.observer.current,
      clock: clock.current,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
    };
    const key = createScientificSnapshotKey({ ...state, providers: f.providers });
    const result = service.capture(state);
    originalInstant.utcIso = '2025-06-22T16:00:00.000Z';
    originalInstant.unixMilliseconds = 0;
    originalInstant.source = 'system-selected';
    expect(clock.current.revision).toBe(0);
    expect(createScientificSnapshotKey({ ...state, providers: f.providers })).toBe(key);
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.snapshot.clock.instant).toMatchObject({
      utcIso: '2025-06-21T16:00:00.000Z',
      source: 'user-selected',
    });
  });

  it('rejects malformed clock state before constructing a cache key', () => {
    const f = fixture(1);
    expect(() => createScientificSnapshotKey({
      observer: f.observer.current,
      clock: { ...f.clock.current, mode: 'unsupported' } as never,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
      providers: f.providers,
    })).toThrowError(expect.objectContaining({ code: 'INVALID_INSTANT' }));
  });

  it('never returns cached clock provenance from a different instant source', () => {
    const f = fixture(1);
    const service = new ScientificSnapshotService(f.providers);
    const state = {
      observer: f.observer.current,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
    };
    const frozenClock = new SimulationClock(
      createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test'),
    );
    const selectedClock = new SimulationClock(
      createSimulationInstant('2025-06-21T16:00:00Z', 'user-selected'),
    );
    const equivalentSelectedClock = new SimulationClock(
      createSimulationInstant('2025-06-21T16:00:00Z', 'user-selected'),
    );
    const first = service.capture({ ...state, clock: frozenClock.current });
    const second = service.capture({ ...state, clock: selectedClock.current });
    const third = service.capture({ ...state, clock: equivalentSelectedClock.current });
    expect(first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    expect(third.kind).toBe('ready');
    if (first.kind !== 'ready' || second.kind !== 'ready' || third.kind !== 'ready') return;
    expect(first.snapshot.clock.instant.source).toBe('frozen-test');
    expect(second.snapshot.clock.instant.source).toBe('user-selected');
    expect(third.snapshot).toBe(second.snapshot);
    expect(service.cacheDiagnostics).toEqual({ hits: 1, misses: 2, entries: 2 });
  });

  it('does not reuse a cached snapshot with a different clock rate', () => {
    const f = fixture(1);
    const service = new ScientificSnapshotService(f.providers);
    const state = {
      observer: f.observer.current,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
    };
    const firstClock = { ...f.clock.current, timeRate: 1 };
    const secondClock = { ...f.clock.current, timeRate: 2 };
    const first = service.capture({ ...state, clock: firstClock });
    const second = service.capture({ ...state, clock: secondClock });
    expect(first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    if (first.kind !== 'ready' || second.kind !== 'ready') return;
    expect(first.snapshot.clock.timeRate).toBe(1);
    expect(second.snapshot.clock.timeRate).toBe(2);
    expect(first.snapshot).not.toBe(second.snapshot);
    expect(service.cacheDiagnostics).toEqual({ hits: 0, misses: 2, entries: 2 });
  });

  it('hits equal frozen inputs and misses every relevant revision/profile change', () => {
    const f = fixture(); const cache = new ScientificSnapshotCache(2); let sequence = 0;
    const request = () => ({ observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers, creationSequence: ++sequence });
    const call = () => { const value = request(); return cache.getOrBuild(createScientificSnapshotKey(value), isCacheableTime(value.clock), () => buildScientificSnapshot(value)); };
    const first = call(); const second = call();
    expect(second).toEqual(first); expect(cache.diagnostics).toEqual({ hits: 1, misses: 1, entries: 1 });
    f.observer.set({ latitudeDeg: 4, longitudeDegEast: 2, elevationMeters: 3 }); call();
    f.calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0.1, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 2, simulated: true } }); call();
    f.configuration.replace({ precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'normal', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] }); call();
    expect(cache.diagnostics.misses).toBe(4);
  });

  it('misses after a same-yaw accepted recalibration event', () => {
    const f = fixture(1); const cache = new ScientificSnapshotCache(); let sequence = 0;
    const call = () => {
      const value = { observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers, creationSequence: ++sequence };
      return cache.getOrBuild(createScientificSnapshotKey(value), true, () => buildScientificSnapshot(value));
    };
    call();
    f.calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 2, simulated: true, acceptedRevision: 2 } });
    call();
    expect(cache.diagnostics).toMatchObject({ hits: 0, misses: 2, entries: 2 });
  });

  it('misses end to end after an actual same-yaw accepted capture and reset', () => {
    const f = fixture();
    const controller = new NorthCalibrationController();
    const service = new ScientificSnapshotService(f.providers);
    controller.simulateBearing(0, 1);
    f.calibration.update(controller.current, 'session-a');
    const state = () => ({
      observer: f.observer.current,
      clock: f.clock.current,
      calibration: f.calibration.current,
      configuration: f.configuration.current,
    });
    const first = service.capture(state());
    controller.simulateBearing(0, 2);
    f.calibration.update(controller.current, 'session-a');
    const second = service.capture(state());
    expect(first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    if (first.kind !== 'ready' || second.kind !== 'ready') return;
    expect(first.snapshot.geographicCalibration.yawRadians).toBe(
      second.snapshot.geographicCalibration.yawRadians,
    );
    expect(first.snapshot.geographicCalibration.acceptedCalibrationRevision).toBe(1);
    expect(second.snapshot.geographicCalibration.acceptedCalibrationRevision).toBe(2);
    expect(first.snapshot).not.toBe(second.snapshot);
    expect(service.cacheDiagnostics).toMatchObject({ hits: 0, misses: 2, entries: 2 });

    controller.reset();
    f.calibration.update(controller.current, 'session-a');
    const reset = service.capture(state());
    expect(reset).toMatchObject({
      kind: 'not-ready',
      errors: [expect.objectContaining({ code: 'CALIBRATION_MISSING' })],
    });
    expect(service.cacheDiagnostics).toMatchObject({ hits: 0, misses: 3, entries: 2 });
  });

  it('bypasses live running clocks, evicts LRU entries, and clears', () => {
    const f = fixture(); const cache = new ScientificSnapshotCache(1); let count = 0;
    const run = () => { const value = { observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers, creationSequence: ++count }; return cache.getOrBuild(createScientificSnapshotKey(value), isCacheableTime(value.clock), () => buildScientificSnapshot(value)); };
    run(); f.clock.selectFrozen(createSimulationInstant('2025-06-22T16:00:00Z', 'frozen-test')); run();
    expect(cache.diagnostics.entries).toBe(1);
    f.clock.startRealtime(); run(); run();
    expect(cache.diagnostics.hits).toBe(0);
    cache.clear(); expect(cache.diagnostics.entries).toBe(0);
  });

  it('does not leak mutable values between cached callers', () => {
    const f = fixture(); const cache = new ScientificSnapshotCache();
    const request = { observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers, creationSequence: 1 };
    const key = createScientificSnapshotKey(request);
    const first = cache.getOrBuild(key, true, () => buildScientificSnapshot(request));
    const second = cache.getOrBuild(key, true, () => { throw new Error('expected cache hit'); });
    expect(first).toEqual(second);
    if (second.kind === 'ready') {
      expect(Object.isFrozen(second.snapshot)).toBe(true);
      expect(() => { (second.snapshot.earthAxis.north as { x: number }).x = 42; }).toThrow();
    }
  });

  it('updates recency on access and evicts the true least-recently-used entry', () => {
    const f = fixture(); const cache = new ScientificSnapshotCache(2); let sequence = 0;
    const request = (instant: string) => {
      const clock = new SimulationClock(createSimulationInstant(instant, 'frozen-test'));
      return { observer: f.observer.current, clock: clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers, creationSequence: ++sequence };
    };
    const capture = (value: ReturnType<typeof request>) => cache.getOrBuild(
      createScientificSnapshotKey(value), true, () => buildScientificSnapshot(value),
    );
    const a = request('2025-06-21T16:00:00Z');
    const b = request('2025-06-22T16:00:00Z');
    const c = request('2025-06-23T16:00:00Z');
    capture(a); capture(b); capture(a); capture(c);
    const hitA = cache.getOrBuild(createScientificSnapshotKey(a), true, () => { throw new Error('A should remain cached'); });
    const missB = cache.getOrBuild(createScientificSnapshotKey(b), true, () => buildScientificSnapshot(b));
    expect(hitA.kind).toBe('ready');
    expect(missB.kind).toBe('ready');
    expect(cache.diagnostics).toMatchObject({ hits: 2, misses: 4, entries: 2 });
    cache.clear();
    expect(cache.diagnostics).toEqual({ hits: 0, misses: 0, entries: 0 });
  });

  it.each([0, -1, 1.5])('rejects invalid cache capacity %s', (capacity) => {
    expect(() => new ScientificSnapshotCache(capacity)).toThrow('positive integer');
  });
});
