import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createObserverOffsetGeocentricPresentation,
  encodeGeocentricDirection,
  encodeGeocentricFiniteAnchor,
  OBSERVER_OFFSET_GEOCENTRIC_GPU_COMPONENT_BUDGET,
  reconstructGeocentricFiniteAnchor,
} from '../../src/presentation/observerOffsetGeocentricPresentation';
import { createCelestialCoordinateGridPresentationModel } from '../../src/presentation/celestialCoordinateGridPresentationModel';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function snapshot(latitudeDeg = 42.7325, yawRadians = 0.4) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -84.5555, elevationMeters: 250, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: {
    acceptedRevision: 1,
    yawRadians,
    capturedDirection: { x: 0, y: 0, z: -1 },
    timestamp: 1,
    simulated: true,
  } });
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  });
  if (result.kind !== 'ready') throw new Error('Ready fixture required.');
  return result.snapshot;
}

function vector(value: Readonly<{ readonly x: number; readonly y: number; readonly z: number }>) {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function model(latitudeDeg = 42.7325) {
  const source = snapshot(latitudeDeg);
  const structure = createGeocentricCelestialStructurePresentation(source);
  const result = createObserverOffsetGeocentricPresentation(structure);
  if (result.kind === 'not-ready') throw new Error(result.detail);
  return { structure, result };
}

describe('ObserverOffsetGeocentricPresentation contract', () => {
  it('uses the existing shared core, WGS84 source, and celestial-grid radius by identity/value', () => {
    const source = snapshot();
    const structure = createGeocentricCelestialStructurePresentation(source);
    const result = createObserverOffsetGeocentricPresentation(structure);
    if (result.kind === 'not-ready') throw new Error(result.detail);
    const grid = createCelestialCoordinateGridPresentationModel(source, undefined, structure);
    expect(result.scientificEarthCore).toBe(structure.earthCore);
    expect(result.geocentricStructure).toBe(structure);
    expect(result.scientificCelestialGridRadiusMeters).toBe(grid.displayRadiusMeters);
    expect(result.scientificCelestialGridRadiusMeters).toBe(result.scientificEarthReferenceRadiusMeters * 2);
    expect(result.earthCoreAnchor.w).toBe(1 / grid.displayRadiusMeters);
  });

  it('keeps the actual observer offset while placing the reference-sphere surface exactly one reference radius from the core', () => {
    const { result } = model();
    expect(result.scientificObserver).not.toBe(result.scientificEarthCore);
    expect(result.scientificObserverToCoreDistanceMeters).toBeGreaterThan(6_000_000);
    expect(vector(result.referenceEarthSphereSurfacePoint).distanceTo(vector(result.scientificEarthCore)))
      .toBeCloseTo(result.referenceEarthSphereRadiusMeters, 7);
    expect(result.referenceEarthSphereRadiusMeters).toBe(result.scientificCelestialGridRadiusMeters / 2);
    expect(vector(result.referenceEarthSphereSurfacePoint).distanceTo(vector(result.scientificEarthCore)))
      .toBeLessThan(result.scientificCelestialGridRadiusMeters);
  });

  it('keeps the WGS84 local ENU tangent basis orthonormal and right handed', () => {
    const { result } = model();
    const east = vector(result.localEast);
    const north = vector(result.localNorth);
    const up = vector(result.localUp);
    expect(east.length()).toBeCloseTo(1, 14);
    expect(north.length()).toBeCloseTo(1, 14);
    expect(up.length()).toBeCloseTo(1, 14);
    expect(east.dot(north)).toBeCloseTo(0, 14);
    expect(east.dot(up)).toBeCloseTo(0, 14);
    expect(north.dot(up)).toBeCloseTo(0, 14);
    expect(east.cross(north).dot(up)).toBeCloseTo(1, 14);
    const tangent = result.encodeTangentPoint(12, -7);
    if (tangent.kind === 'not-ready') throw new Error(tangent.detail);
    const reconstructed = reconstructGeocentricFiniteAnchor(tangent);
    if ('reason' in reconstructed) throw new Error(reconstructed.detail);
    expect(vector(reconstructed).sub(vector(result.scientificObserver)).dot(up)).toBeCloseTo(0, 8);
  });

  it('uses finite non-zero-w anchors for core, observer, and surface while reserving w=0 for true directions', () => {
    const { result } = model();
    for (const anchor of [
      result.earthCoreAnchor,
      result.observerAnchor,
      result.referenceEarthSphereSurfaceAnchor,
    ]) {
      expect(anchor.w).toBeGreaterThan(0);
      expect([anchor.x, anchor.y, anchor.z, anchor.w].every(Number.isFinite)).toBe(true);
    }
    expect(result.localUpDirectionAnchor.w).toBe(0);
    expect(encodeGeocentricDirection(result.localUp)).toMatchObject({ kind: 'PROJECTIVE_DIRECTION_AT_INFINITY', w: 0 });
  });

  it('reconstructs equivalent finite homogeneous scalings as the same scientific point', () => {
    const { result } = model();
    const anchor = result.referenceEarthSphereSurfaceAnchor;
    const reconstruction = reconstructGeocentricFiniteAnchor(anchor);
    if ('reason' in reconstruction) throw new Error(reconstruction.detail);
    const doubled = reconstructGeocentricFiniteAnchor({ ...anchor, x: anchor.x * 2, y: anchor.y * 2, z: anchor.z * 2, w: anchor.w * 2 });
    if ('reason' in doubled) throw new Error(doubled.detail);
    expect(vector(reconstruction).distanceTo(vector(doubled))).toBeCloseTo(0, 8);
    expect(vector(reconstruction).distanceTo(vector(result.referenceEarthSphereSurfacePoint))).toBeCloseTo(0, 8);
  });

  it('uses bounded uploaded components and keeps the contract immutable across sequential consumer calls', () => {
    const { result } = model();
    expect(result.maximumUploadedComponentMagnitude).toBeLessThanOrEqual(
      OBSERVER_OFFSET_GEOCENTRIC_GPU_COMPONENT_BUDGET,
    );
    expect(Object.isFrozen(result)).toBe(true);
    const before = { ...result.earthCoreAnchor };
    const first = result.encodeOffsetFromCore(result.localUp, 1000);
    const second = result.encodeOffsetFromCore(result.localUp, 1000);
    expect(first).toEqual(second);
    expect(result.earthCoreAnchor).toEqual(before);
  });

  it('returns local structured failures for invalid prototype-anchor input instead of throwing', () => {
    const { result } = model();
    expect(result.encodeTangentPoint(Number.NaN, 0)).toMatchObject({ kind: 'not-ready', reason: 'INVALID_DISTANCE' });
    expect(result.encodeOffsetFromCore({ ...result.localUp, x: Number.NaN }, 1)).toMatchObject({ kind: 'not-ready', reason: 'INVALID_DIRECTION' });
    expect(encodeGeocentricFiniteAnchor({ ...result.scientificEarthCore, x: Number.POSITIVE_INFINITY }, 1))
      .toMatchObject({ kind: 'not-ready', reason: 'INVALID_FINITE_POINT' });
  });

  it('does not introduce a grid or equator center and preserves their existing geometry sources', () => {
    const source = snapshot(35, 0.8);
    const structure = createGeocentricCelestialStructurePresentation(source);
    const result = createObserverOffsetGeocentricPresentation(structure);
    if (result.kind === 'not-ready') throw new Error(result.detail);
    const grid = createCelestialCoordinateGridPresentationModel(source, undefined, structure);
    expect(grid.earthCore).toBe(result.scientificEarthCore);
    expect(grid.displayRadiusMeters).toBe(result.scientificCelestialGridRadiusMeters);
    expect(structure.celestialEquatorCenter).toBe(result.scientificEarthCore);
  });
});
