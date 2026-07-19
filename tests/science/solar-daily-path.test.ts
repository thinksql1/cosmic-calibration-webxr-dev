import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { SolarDailyPathService } from '../../src/science/temporal/solarDailyPath';
import { resolveTimeZone } from '../../src/science/temporal/civilTime';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
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
  observer.set({ latitudeDeg, longitudeDegEast, elevationMeters: 250, source: 'solar path fixture' });
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
});
