import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { resolveTimeZone } from '../../src/science/temporal/civilTime';
import { MoonDailyPathService } from '../../src/science/temporal/moonDailyPath';

function fixture() {
  const providers = createScientificProviderRegistry();
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 42.9572, longitudeDegEast: -83.8308, elevationMeters: 240 });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: {
      yawRadians: 0,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: 1,
      simulated: true,
    },
  });
  const built = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers,
    creationSequence: 1,
  });
  if (built.kind !== 'ready') throw new Error('Expected ready fixture');
  return { providers, snapshot: built.snapshot };
}

describe('apparent topocentric Moon civil-day path', () => {
  it('uses the shared civil day, five-minute ordered sampling, observer, and parallax-preserving provider path', () => {
    const { providers, snapshot } = fixture();
    const service = new MoonDailyPathService(providers);
    const path = service.capture(snapshot, resolveTimeZone('America/Detroit', 'user-selected'), 1);
    expect(path.kind).toBe('READY_MOON_DAILY_APPARENT_PATH');
    expect(path.provenance.sourceFrame).toBe('EQD_TRUE');
    expect(path.provenance.outputFrame).toBe('HORIZONTAL_ENU');
    expect(path.provenance.topocentricParallax).toBe('included');
    expect(path.samples.length).toBeGreaterThanOrEqual(289);
    expect(path.samples.length).toBeLessThanOrEqual(301);
    expect(path.samples.every((sample) => {
      const length = Math.hypot(sample.direction.east, sample.direction.north, sample.direction.up);
      return Number.isFinite(length) && Math.abs(length - 1) < 1e-10;
    })).toBe(true);
    for (let index = 1; index < path.samples.length; index += 1) {
      const step = path.samples[index]!.instant.unixMilliseconds -
        path.samples[index - 1]!.instant.unixMilliseconds;
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(5 * 60_000);
    }
    expect(service.capture(snapshot, resolveTimeZone('America/Detroit', 'user-selected'), 1)).toBe(path);
  });
});
