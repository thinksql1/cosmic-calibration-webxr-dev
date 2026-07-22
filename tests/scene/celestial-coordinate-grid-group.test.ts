import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCelestialCoordinateGridGroup } from '../../src/scene/createCelestialCoordinateGridGroup';
import { createCelestialCoordinateGridPresentationModel } from '../../src/presentation/celestialCoordinateGridPresentationModel';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
function source() { const observer = new ObserverStateStore(); observer.set({ latitudeDeg: 43, longitudeDegEast: 0, elevationMeters: 0, source: 'fixture' }); const calibration = new GeographicCalibrationStateAdapter(); calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } }); const result = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 }); if (result.kind !== 'ready') throw new Error('Ready fixture required.'); return createCelestialCoordinateGridPresentationModel(result.snapshot, { showGrid: true, showDeclinationLines: true, showRightAscensionLines: true }); }
describe('celestial coordinate grid Three.js group', () => {
  it('owns stable, named immutable geometry with open meridian topology', () => {
    const grid = createCelestialCoordinateGridGroup(); const model = source(); grid.update(model, { showDeclinationLines: true, showRightAscensionLines: true });
    const lines: THREE.Line[] = []; grid.group.traverse((object) => { if (object instanceof THREE.Line) lines.push(object); });
    expect(lines).toHaveLength(16); expect(new Set(lines.map((line) => line.name)).size).toBe(16);
    expect(lines.filter((line) => line.name.startsWith('declination-')).every((line) => line instanceof THREE.LineLoop)).toBe(true);
    expect(lines.filter((line) => line.name.startsWith('right-ascension-')).every((line) => !(line instanceof THREE.LineLoop))).toBe(true);
    const first = lines[0]!.geometry; grid.update(model, { showDeclinationLines: true, showRightAscensionLines: true }); expect(lines[0]!.geometry).toBe(first); expect(grid.group.userData.activeLineCount).toBe(16);
  });
  it('suppresses only an invalid eye draw and does not mutate shared positions', () => {
    const reports: string[] = []; const grid = createCelestialCoordinateGridGroup((event, detail) => reports.push(`${event}|${detail}`)); grid.update(source(), { showDeclinationLines: true, showRightAscensionLines: true });
    const line = grid.group.getObjectByName('right-ascension-meridian-02h') as THREE.Line; const position = line.geometry.getAttribute('position') as THREE.BufferAttribute; const before = Array.from(position.array); const version = position.version;
    const invalid = new THREE.PerspectiveCamera(); invalid.projectionMatrix.elements[0] = Number.NaN; invalid.updateWorldMatrix(true, false); line.updateWorldMatrix(true, false);
    expect(() => line.onBeforeRender({} as THREE.WebGLRenderer, new THREE.Scene(), invalid, line.geometry, line.material as THREE.Material, new THREE.Group())).not.toThrow();
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(0); expect(Array.from(position.array)).toEqual(before); expect(position.version).toBe(version); expect(reports.join('\n')).toContain('suppressed-non-finite-eye-state');
  });
});
