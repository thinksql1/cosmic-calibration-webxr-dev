import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';
import { createCelestialEquatorPresentationModel } from '../../src/presentation/celestialEquatorPresentationModel';
import {
  createGeocentricCelestialStructurePresentation,
  GEOCENTRIC_EQUATOR_DISPLAY_RADIUS_METERS,
} from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createLocalHorizonPresentationModel } from '../../src/presentation/localHorizonPresentationModel';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function snapshot(latitudeDeg = 42.7325, elevationMeters = 250, yawRadians = 0, sequence = 1) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -84.5555, elevationMeters, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: sequence, simulated: true } });
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: sequence,
  });
  if (result.kind !== 'ready') throw new Error('Fixture must be ready.');
  return result.snapshot;
}

function vector(value: Readonly<{ x: number; y: number; z: number }>) {
  return new THREE.Vector3(value.x, value.y, value.z);
}

describe('unified geocentric celestial structure presentation', () => {
  it('shares one core, axis, pole pair, equator center, and plane normal by identity', () => {
    const source = snapshot();
    const structure = createGeocentricCelestialStructurePresentation(source);
    const axis = createEarthAxisPresentationModel(source, undefined, structure);
    const equator = createCelestialEquatorPresentationModel(source, undefined, structure);
    expect(axis.geocentricStructure).toBe(structure);
    expect(equator.geocentricStructure).toBe(structure);
    expect(axis.earthCore).toBe(structure.earthCore);
    expect(equator.center).toBe(structure.earthCore);
    expect(equator.normalApplication).toBe(structure.northAxisDirection);
    expect(structure.northCelestialPoleDirection).toBe(structure.northAxisDirection);
    expect(structure.southCelestialPoleDirection).toBe(structure.southAxisDirection);
    expect(vector(structure.earthCore).distanceTo(vector(structure.celestialEquatorCenter))).toBe(0);
    expect(vector(structure.observerSurfaceOrigin).distanceTo(vector(structure.earthCore))).toBeGreaterThan(6_000_000);
  });

  it('defines an orthonormal equatorial plane perpendicular to the exact antipodal axis', () => {
    const structure = createGeocentricCelestialStructurePresentation(snapshot());
    const north = vector(structure.northAxisDirection);
    const south = vector(structure.southAxisDirection);
    const first = vector(structure.equatorialBasisFirst);
    const second = vector(structure.equatorialBasisSecond);
    expect(north.length()).toBeCloseTo(1, 14);
    expect(south.dot(north)).toBeCloseTo(-1, 14);
    expect(south).toEqual(north.clone().negate());
    expect(first.length()).toBeCloseTo(1, 14);
    expect(second.length()).toBeCloseTo(1, 14);
    expect(first.dot(second)).toBeCloseTo(0, 14);
    expect(first.dot(north)).toBeCloseTo(0, 14);
    expect(second.dot(north)).toBeCloseTo(0, 14);
  });

  it('places every ring sample in the plane through the core and fits the core exactly', () => {
    const source = snapshot();
    const structure = createGeocentricCelestialStructurePresentation(source);
    const equator = createCelestialEquatorPresentationModel(source, undefined, structure);
    const core = vector(structure.earthCore);
    const normal = vector(structure.northAxisDirection);
    const average = new THREE.Vector3();
    for (const sample of equator.samples) {
      const point = vector(sample.finitePositionApplication);
      expect(point.clone().sub(core).dot(normal)).toBeCloseTo(0, 7);
      expect(point.distanceTo(core)).toBeCloseTo(GEOCENTRIC_EQUATOR_DISPLAY_RADIUS_METERS, 6);
      average.add(point);
    }
    average.multiplyScalar(1 / equator.samples.length);
    expect(average.distanceTo(core)).toBeLessThan(1e-8);
    const axisPlaneIntersection = core.clone().addScaledVector(normal, 0);
    expect(axisPlaneIntersection.distanceTo(core)).toBe(0);
  });

  it('keeps the local horizon observer-centred while observer changes preserve geocentric invariants', () => {
    const firstSnapshot = snapshot(42.7, 250, 0, 1);
    const movedSnapshot = snapshot(35, 1_000, 0.8, 2);
    const first = createGeocentricCelestialStructurePresentation(firstSnapshot);
    const moved = createGeocentricCelestialStructurePresentation(movedSnapshot);
    const horizon = createLocalHorizonPresentationModel({
      kind: 'calibrated',
      calibration: {
        acceptedRevision: 1,
        yawRadians: 0,
        capturedDirection: { x: 0, y: 0, z: -1 },
        timestamp: 1,
        simulated: true,
      },
    }, { showHorizon: true, presentationRadiusMeters: 24 });
    expect(horizon.kind).toBe('ready');
    if (horizon.kind !== 'ready') return;
    expect(horizon.center).toBe('OBSERVER_LOCAL_TANGENT_ORIGIN');
    expect(horizon.samples.reduce((sum, sample) => sum.add(vector(sample.positionApplicationMeters)), new THREE.Vector3()).length()).toBeLessThan(1e-12);
    expect(first.snapshotCacheKey).not.toBe(moved.snapshotCacheKey);
    for (const structure of [first, moved]) {
      expect(structure.celestialEquatorCenter).toBe(structure.earthCore);
      expect(vector(structure.equatorialPlaneNormal).dot(vector(structure.equatorialBasisFirst))).toBeCloseTo(0, 14);
      expect(vector(structure.northAxisDirection).dot(vector(structure.southAxisDirection))).toBeCloseTo(-1, 14);
      expect(vector(structure.earthCore).length()).toBeGreaterThan(6_000_000);
    }
  });
});
