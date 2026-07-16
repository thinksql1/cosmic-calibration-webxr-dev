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

function fixture() {
  const observer = new ObserverStateStore(); observer.set({ latitudeDeg: 1, longitudeDegEast: 2, elevationMeters: 3 });
  const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test'));
  const calibration = new GeographicCalibrationStateAdapter(); calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const configuration = new ScientificConfigurationStore();
  const providers = createScientificProviderRegistry();
  return { observer, clock, calibration, configuration, providers };
}

describe('bounded exact-key snapshot cache', () => {
  it('encodes exact instant, calibration, correction, and provider/model versions in the key', () => {
    const f = fixture();
    const base = { observer: f.observer.current, clock: f.clock.current, calibration: f.calibration.current, configuration: f.configuration.current, providers: f.providers };
    const baseKey = createScientificSnapshotKey(base);
    const nextClock = new SimulationClock(createSimulationInstant('2025-06-22T16:00:00Z', 'frozen-test'));
    const changedProvider = { ...f.providers, meanPole: { ...f.providers.meanPole, version: '2.0.0' as never } };
    const normalConfiguration = new ScientificConfigurationStore();
    normalConfiguration.replace({ precisionTier: 'TIER_1', bodyCorrectionProfile: 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION', meanPoleModel: 'IAU_P03_PRECESSION_ONLY', refractionPolicy: 'normal', enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'] });
    expect(createScientificSnapshotKey({ ...base, clock: nextClock.current })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({ ...base, configuration: normalConfiguration.current })).not.toBe(baseKey);
    expect(createScientificSnapshotKey({ ...base, providers: changedProvider })).not.toBe(baseKey);
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
});
