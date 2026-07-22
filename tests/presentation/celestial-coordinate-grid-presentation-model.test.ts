import { describe, expect, it } from 'vitest';
import { createCelestialCoordinateGridPresentationModel, CELESTIAL_GRID_DECLINATION_DEGREES, CELESTIAL_GRID_RIGHT_ASCENSION_HOURS } from '../../src/presentation/celestialCoordinateGridPresentationModel';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
function model() {
  const observer = new ObserverStateStore(); observer.set({ latitudeDeg: 43, longitudeDegEast: -84, elevationMeters: 250, source: 'grid fixture' });
  const calibration = new GeographicCalibrationStateAdapter(); calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const result = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 });
  if (result.kind !== 'ready') throw new Error('Fixture must be ready.');
  return createCelestialCoordinateGridPresentationModel(result.snapshot, { showGrid: true, showDeclinationLines: true, showRightAscensionLines: true });
}
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
describe('celestial coordinate grid presentation model', () => {
  it('creates exactly four closed declination circles and twelve open RA semicircles', () => {
    const grid = model(); const declinations = grid.lines.filter((line) => line.family === 'declination'); const meridians = grid.lines.filter((line) => line.family === 'right-ascension');
    expect(declinations.map((line) => line.declinationDegrees)).toEqual(CELESTIAL_GRID_DECLINATION_DEGREES);
    expect(meridians.map((line) => line.rightAscensionHours)).toEqual(CELESTIAL_GRID_RIGHT_ASCENSION_HOURS);
    expect(declinations.every((line) => line.closed)).toBe(true); expect(meridians.every((line) => !line.closed)).toBe(true);
    expect(grid.lines.some((line) => line.declinationDegrees === 0)).toBe(false);
  });
  it('keeps declination planes parallel to the equator and meridians open from pole to pole', () => {
    const grid = model(); const normal = grid.geocentricStructure.northAxisDirection;
    for (const line of grid.lines.filter((candidate) => candidate.family === 'declination')) {
      const target = Math.sin((line.declinationDegrees! * Math.PI) / 180);
      line.directions.forEach((direction) => { expect(dot(direction, normal)).toBeCloseTo(target, 10); expect(Math.hypot(direction.x, direction.y, direction.z)).toBeCloseTo(1, 12); });
    }
    for (const line of grid.lines.filter((candidate) => candidate.family === 'right-ascension')) {
      expect(dot(line.directions[0]!, normal)).toBeCloseTo(-1, 12); expect(dot(line.directions.at(-1)!, normal)).toBeCloseTo(1, 12);
      expect(Math.abs(dot(line.directions[Math.floor(line.directions.length / 2)]!, normal))).toBeLessThan(1e-12);
      expect(line.directions[0]).not.toEqual(line.directions.at(-1));
    }
  });
});
