import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createFirstConstellationLineGroup } from '../../src/scene/createFirstConstellationLineGroup';
import { FIRST_CONSTELLATION_CANONICAL_GEOMETRY } from '../../src/presentation/firstConstellationLinePresentation';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createRealSkyEquatorialOrientation } from '../../src/science/astronomy/realSkyEquatorialOrientation';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import type { ExpandedConstellationIdentifier } from '../../src/science/constellations/constellationCatalogV2';

function source(utcIso = '2026-03-20T04:00:00.000Z', latitudeDeg = 42.9572, longitudeDegEast = -83.8308) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast, elevationMeters: 240, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0.4, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const instant = createSimulationInstant(utcIso, 'frozen-test');
  const result = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(instant).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 });
  if (result.kind !== 'ready') throw new Error('Ready fixture required.');
  const orientation = createRealSkyEquatorialOrientation(instant, result.snapshot.observer.observer);
  if (orientation.kind !== 'ready') throw new Error('Ready orientation required.');
  return { structure: createGeocentricCelestialStructurePresentation(result.snapshot), orientation };
}
const settings = (masterVisible: boolean, enabledConstellations: readonly ExpandedConstellationIdentifier[] = ['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO'], showEndpointMarkers = false) => ({ studyEnabled: true, masterVisible, enabledConstellations: new Set(enabledConstellations), showEndpointMarkers });

describe('first constellation XR-safe line group', () => {
  it('builds each immutable figure once with the expected segment topology', () => {
    const handle = createFirstConstellationLineGroup();
    const { structure, orientation } = source();
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(true) });
    const lines: THREE.Line[] = [];
    const points: THREE.Points[] = [];
    handle.group.traverse((object) => { if (object instanceof THREE.Line) lines.push(object); if (object instanceof THREE.Points) points.push(object); });
    expect(lines).toHaveLength(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.segmentCount);
    expect(points).toHaveLength(FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures.length);
    expect(new Set(lines.map(({ name }) => name)).size).toBe(lines.length);
    expect(handle.group.getObjectByName('constellation-ori')).toBeInstanceOf(THREE.Group);
    expect(handle.group.getObjectByName('constellation-ori-segment-01')).toBeInstanceOf(THREE.Line);
    expect(handle.group.getObjectByName('constellation-ori-segment-01')).not.toBeInstanceOf(THREE.LineLoop);
  });

  it('makes master and individual controls authoritative without rebuilding resources', () => {
    const handle = createFirstConstellationLineGroup();
    const { structure, orientation } = source();
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(false) });
    expect(handle.group.visible).toBe(false);
    expect(handle.getDiagnostics().activeDrawCount).toBe(0);
    const line = handle.group.getObjectByName('constellation-ori-segment-01') as THREE.Line;
    const geometry = line.geometry;
    const material = line.material;
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(true, ['ORI']) });
    expect(handle.getDiagnostics().activeDrawCount).toBe(8);
    expect(handle.group.getObjectByName('constellation-uma')!.visible).toBe(false);
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(true, ['ORI']) });
    expect(line.geometry).toBe(geometry);
    expect(line.material).toBe(material);
    expect(handle.getDiagnostics().geometryBuildCount).toBe(1);
  });

  it('updates one shared orientation/center contract without mutating canonical buffers per eye', () => {
    const handle = createFirstConstellationLineGroup();
    const { structure, orientation } = source();
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(true, ['ORI'], true) });
    const line = handle.group.getObjectByName('constellation-ori-segment-04') as THREE.Line;
    const position = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const before = Array.from(position.array);
    const version = position.version;
    const material = line.material as THREE.ShaderMaterial;
    const matrixBefore = material.uniforms.uEqjToApplication.value.toArray();
    const left = new THREE.PerspectiveCamera(); left.position.x = -0.032;
    const right = new THREE.PerspectiveCamera(); right.position.x = 0.032;
    for (const eye of [left, right]) {
      eye.updateMatrixWorld(true); line.updateWorldMatrix(true, false);
      expect(() => line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), eye, line.geometry, line.material as THREE.Material, new THREE.Group())).not.toThrow();
    }
    expect(Array.from(position.array)).toEqual(before);
    expect(position.version).toBe(version);
    expect(material.uniforms.uEqjToApplication.value.toArray()).toEqual(matrixBefore);
    expect(handle.getDiagnostics().perEyeMutation).toBe(false);
  });

  it('changes shared time/location orientation without rebuilding or rewriting segment geometry', () => {
    const handle = createFirstConstellationLineGroup();
    const first = source();
    handle.update({ structure: first.structure, orientationRows: first.orientation.eqjToApplicationRows, settings: settings(true) });
    const line = handle.group.getObjectByName('constellation-ori-segment-01') as THREE.Line;
    const geometry = line.geometry;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const values = Array.from(position.array);
    const version = position.version;
    const firstMatrix = (line.material as THREE.ShaderMaterial).uniforms.uEqjToApplication.value.toArray();
    const second = source('2026-03-20T10:00:00.000Z', 30, -70);
    handle.update({ structure: second.structure, orientationRows: second.orientation.eqjToApplicationRows, settings: settings(true) });
    const secondMatrix = (line.material as THREE.ShaderMaterial).uniforms.uEqjToApplication.value.toArray();
    expect(secondMatrix).not.toEqual(firstMatrix);
    expect(line.geometry).toBe(geometry);
    expect(Array.from(position.array)).toEqual(values);
    expect(position.version).toBe(version);
    expect(handle.getDiagnostics()).toMatchObject({ geometryBuildCount: 1, orientationUpdateCount: 2 });
  });

  it('suppresses an invalid eye locally and contains callback/diagnostic failures', () => {
    const reports: string[] = [];
    const handle = createFirstConstellationLineGroup((event, detail) => reports.push(`${event}|${detail}`));
    const { structure, orientation } = source();
    handle.update({ structure, orientationRows: orientation.eqjToApplicationRows, settings: settings(true, ['ORI']) });
    const line = handle.group.getObjectByName('constellation-ori-segment-01') as THREE.Line;
    const invalid = new THREE.PerspectiveCamera(); invalid.projectionMatrix.elements[0] = Number.NaN;
    invalid.updateMatrixWorld(true); line.updateWorldMatrix(true, false);
    expect(() => line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), invalid, line.geometry, line.material as THREE.Material, new THREE.Group())).not.toThrow();
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(0);
    expect(handle.getDiagnostics().suppressedObjectNames).toContain(line.name);
    expect(reports).toEqual([]);
  });

  it('disposes owned geometry and materials exactly once', () => {
    const handle = createFirstConstellationLineGroup();
    const line = handle.group.getObjectByName('constellation-ori-segment-01') as THREE.Line;
    const geometrySpy = vi.spyOn(line.geometry, 'dispose');
    const materialSpy = vi.spyOn(line.material as THREE.Material, 'dispose');
    handle.dispose(); handle.dispose();
    expect(geometrySpy).toHaveBeenCalledTimes(1);
    expect(materialSpy).toHaveBeenCalledTimes(1);
  });
});
