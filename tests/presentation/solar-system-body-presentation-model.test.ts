import { describe, expect, it } from 'vitest';
import { SolarSystemBodyStateService } from '../../src/science/bodies/solarSystemBodyState';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createSolarSystemBodyPresentationModel } from '../../src/presentation/solarSystemBodyPresentationModel';

function fixture() {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 42, longitudeDegEast: -83, elevationMeters: 250, source: 'presentation fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const input: ScientificSnapshotInput = {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  };
  const built = buildScientificSnapshot(input);
  if (built.kind !== 'ready') throw new Error('Expected ready fixture snapshot.');
  return { snapshot: built.snapshot, bodies: new SolarSystemBodyStateService(createScientificProviderRegistry()).capture(built.snapshot) };
}

describe('actual solar-system body presentation model', () => {
  it('maps immutable ENU directions once into application basis and retains all altitude/declination truth', () => {
    const { snapshot, bodies } = fixture();
    const model = createSolarSystemBodyPresentationModel(snapshot, bodies, { showBodies: true });
    expect(model.visible).toBe(true);
    expect(model.markers).toHaveLength(7);
    expect(model.presentationRadiusPolicy).toBe('DIRECTION_AT_INFINITY_NO_FINITE_CELESTIAL_DISTANCE');
    for (const marker of model.markers) {
      expect(marker.directionApplication.x).toBeCloseTo(marker.directionEnu.east, 14);
      expect(marker.directionApplication.y).toBeCloseTo(marker.directionEnu.up, 14);
      expect(marker.directionApplication.z).toBeCloseTo(-marker.directionEnu.north, 14);
      expect(Math.hypot(marker.directionApplication.x, marker.directionApplication.y, marker.directionApplication.z)).toBeCloseTo(1, 12);
      expect(marker.style.pixelDiameter).toBeGreaterThan(0);
    }
    expect(Object.isFrozen(model)).toBe(true);
    expect(() => createSolarSystemBodyPresentationModel(snapshot, Object.freeze({ ...bodies, snapshotIdentity: { ...bodies.snapshotIdentity, timeRevision: 99 } }))).toThrow('active immutable scientific snapshot');
  });

  it('keeps the current Sun marker authoritative for a path-only presentation without enabling other bodies', () => {
    const { snapshot, bodies } = fixture();
    const model = createSolarSystemBodyPresentationModel(snapshot, bodies, {
      showBodies: false,
      showSunOnly: true,
      emphasizeSun: true,
    });
    expect(model.visible).toBe(true);
    expect(model.markers.find((marker) => marker.body === 'Sun')!.style.pixelDiameter).toBe(22);
    expect(model.markers.filter((marker) => marker.body !== 'Sun').every((marker) => marker.style.opacity === 0)).toBe(true);
  });
});
