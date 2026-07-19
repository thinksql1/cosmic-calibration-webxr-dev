import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { SolarSystemBodyStateService } from '../../src/science/bodies/solarSystemBodyState';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { resolveTimeZone } from '../../src/science/temporal/civilTime';
import { SolarDailyPathService } from '../../src/science/temporal/solarDailyPath';
import { createSolarDailyPathPresentationModel } from '../../src/presentation/solarDailyPathPresentationModel';

function fixture() {
  const providers = createScientificProviderRegistry();
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 42, longitudeDegEast: -83, elevationMeters: 250, source: 'presentation fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const input: ScientificSnapshotInput = {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers,
    creationSequence: 1,
  };
  const built = buildScientificSnapshot(input);
  if (built.kind !== 'ready') throw new Error('Expected ready fixture.');
  const bodies = new SolarSystemBodyStateService(providers).capture(built.snapshot);
  const path = new SolarDailyPathService(providers).capture(built.snapshot, resolveTimeZone('America/Detroit', 'user-selected'), 1);
  return { snapshot: built.snapshot, bodies, path };
}

describe('solar daily-path presentation model', () => {
  it('maps exact civil-hour notches onto their calculated projective path directions, not the equator', () => {
    const { snapshot, bodies, path } = fixture();
    const model = createSolarDailyPathPresentationModel(snapshot, bodies, path, {
      showPath: true,
      showHourNotches: true,
      showBelowHorizon: true,
    });
    expect(model.samples).toHaveLength(path.samples.length);
    expect(model.hourNotches).toHaveLength(path.hourNotches.length);
    for (const notch of model.hourNotches) {
      expect(notch.directionApplication).toEqual(model.samples[notch.pathSampleIndex]!.directionApplication);
    }
    expect(model.samples.some((sample) => !sample.aboveHorizon && sample.opacity > 0)).toBe(true);
    expect(model.renderStrategy).toContain('PROJECTIVE_APPARENT_SUN_PATH');
  });

  it('retains civil metadata, keeps below-horizon policy presentation-only, and emphasizes one current civil hour', () => {
    const { snapshot, bodies, path } = fixture();
    const model = createSolarDailyPathPresentationModel(snapshot, bodies, path, {
      showPath: true,
      showHourNotches: true,
      showBelowHorizon: false,
    });
    expect(model.currentHourNotchIndex).toBeDefined();
    expect(model.hourNotches.filter((notch) => notch.emphasized)).toHaveLength(1);
    expect(model.hourNotches[0]!.localLabel).toMatch(/^2025-06-21 \d{2}:00$/);
    expect(model.samples.some((sample) => !sample.aboveHorizon && sample.opacity === 0)).toBe(true);
  });
});
