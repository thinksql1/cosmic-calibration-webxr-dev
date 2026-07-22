import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCelestialCoordinateGridPresentationModel } from '../../src/presentation/celestialCoordinateGridPresentationModel';
import { createEarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { createEarthAxisCameraRelativeFrame } from '../../src/scene/earthAxisCameraRelativeFrame';
function models() {
  const observer = new ObserverStateStore(); observer.set({ latitudeDeg: 43, longitudeDegEast: -84, elevationMeters: 250, source: 'pole-grid fixture' });
  const calibration = new GeographicCalibrationStateAdapter(); calibration.update({ kind: 'calibrated', calibration: { yawRadians: Math.PI / 3, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const result = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 });
  if (result.kind !== 'ready') throw new Error('Ready fixture required.'); const structure = createGeocentricCelestialStructurePresentation(result.snapshot);
  return { grid: createCelestialCoordinateGridPresentationModel(result.snapshot, { showGrid: true, showDeclinationLines: true, showRightAscensionLines: true }, structure), axis: createEarthAxisPresentationModel(result.snapshot, undefined, structure) };
}
const dot = (a: {x:number;y:number;z:number}, b:{x:number;y:number;z:number}) => a.x*b.x+a.y*b.y+a.z*b.z;
describe('pole markers share celestial-grid convergence points', () => {
  it('uses canonical exact antipodes for every meridian endpoint and axis marker direction', () => {
    const { grid, axis } = models();
    expect(axis.north.directionApplication).toBe(grid.canonicalPoles.north); expect(axis.south.directionApplication).toEqual(grid.canonicalPoles.south);
    for (const line of grid.lines.filter((line) => line.family === 'right-ascension')) {
      expect(line.directions[0]).toEqual(grid.canonicalPoles.south); expect(line.directions.at(-1)).toBe(grid.canonicalPoles.north);
    }
    expect(dot(grid.canonicalPoles.north, grid.canonicalPoles.south)).toBeCloseTo(-1, 12);
  });
  it.each([[-0.032], [0.032]])('uses the exact finite grid convergence anchor for sequential eye %s', (eyeX) => {
    const { grid, axis } = models(); const root = new THREE.Group(); root.rotation.y = Math.PI / 3; const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100); camera.position.set(eyeX, 1.7, 0); root.updateWorldMatrix(true, false); camera.updateWorldMatrix(true, false);
    const frame = createEarthAxisCameraRelativeFrame(axis, root.matrixWorld, camera.matrixWorld); const inverseRadius = 1 / grid.displayRadiusMeters;
    expect(frame.northGridConvergenceView).toMatchObject({ w: inverseRadius }); expect(frame.southGridConvergenceView).toMatchObject({ w: inverseRadius });
    const marker = frame.northGridConvergenceView!; const gridEndpoint = new THREE.Vector4(marker.x, marker.y, marker.z, marker.w).applyMatrix4(camera.projectionMatrix); const projectedMarker = new THREE.Vector4(marker.x, marker.y, marker.z, marker.w).applyMatrix4(camera.projectionMatrix);
    expect(projectedMarker.x / projectedMarker.w).toBeCloseTo(gridEndpoint.x / gridEndpoint.w, 12); expect(projectedMarker.y / projectedMarker.w).toBeCloseTo(gridEndpoint.y / gridEndpoint.w, 12);
  });
});
