import { createSimulationInstant } from '../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../src/science/state/observerState';
import { ScientificConfigurationStore } from '../src/science/state/scientificConfiguration';
import { SimulationClock } from '../src/science/state/simulationClock';

export function lunarTransitFixture() {
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
    clock: new SimulationClock(
      createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test'),
    ).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers,
    creationSequence: 1,
  });
  if (built.kind !== 'ready') throw new Error('Expected ready lunar transit fixture');
  return { providers, snapshot: built.snapshot };
}
