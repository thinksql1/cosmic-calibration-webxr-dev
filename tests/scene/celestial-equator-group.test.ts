import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  CELESTIAL_EQUATOR_SAMPLE_COUNT,
  createCelestialEquatorPresentationModel,
} from '../../src/presentation/celestialEquatorPresentationModel';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { createCelestialEquatorGroup } from '../../src/scene/createCelestialEquatorGroup';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';

function model() {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 43, longitudeDegEast: -84, elevationMeters: 250, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  });
  if (result.kind !== 'ready') throw new Error('Fixture must be ready.');
  return createCelestialEquatorPresentationModel(result.snapshot, { showEquator: true });
}

describe('Earth-core-centred celestial-equator Three.js group', () => {
  it('owns one bounded homogeneous ring with layer-local transparent depth policy', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    handle.update(model());
    const line = handle.group.children[0] as THREE.LineLoop;
    const shader = line.material as THREE.ShaderMaterial;
    expect(line.name).toBe('mean-celestial-equator-geocentric-reference-ring');
    expect(handle.group.children).toHaveLength(1);
    expect(shader.depthTest).toBe(false);
    expect(shader.depthWrite).toBe(false);
    expect(shader.vertexShader).toContain('vec4(position, uRingProjectiveW)');
    expect(shader.uniforms.uRingProjectiveW).toBeDefined();
  });

  it('preserves finite-core parallax and applies parent yaw rigidly', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    const parent = new THREE.Group();
    parent.add(handle.group);
    handle.update(model());
    const left = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    left.position.set(-0.032, 1.7, 0);
    const right = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    right.position.set(0.032, 1.7, 0);
    const leftFrame = handle.createFrameForCamera(left);
    const rightFrame = handle.createFrameForCamera(right);
    expect(leftFrame.coreView.x - rightFrame.coreView.x).toBeCloseTo(0.064, 12);
    expect(leftFrame.ringPoints[0].x).not.toBe(rightFrame.ringPoints[0].x);
    expect(leftFrame.maximumUploadedComponentMagnitude).toBeLessThan(2);
    expect(leftFrame.maximumPlaneResidual).toBeLessThan(1e-12);
    applyCalibrationToGeographicGroup(parent, {
      kind: 'calibrated',
      calibration: { acceptedRevision: 1, yawRadians: Math.PI / 2, capturedDirection: { x: 1, y: 0, z: 0 }, timestamp: 1, simulated: true },
    });
    const yawed = handle.createFrameForCamera(left);
    expect(yawed.normalView.x).not.toBeCloseTo(leftFrame.normalView.x, 6);
    expect(yawed.maximumPlaneResidual).toBeLessThan(1e-12);
  });

  it('reuses one ring through clear, update, and session re-entry', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    const source = model();
    handle.update(source);
    const line = handle.group.children[0] as THREE.LineLoop;
    const geometry = line.geometry;
    handle.clear();
    handle.update(source);
    handle.update(source);
    expect(handle.group.children).toHaveLength(1);
    expect((handle.group.children[0] as THREE.LineLoop).geometry).toBe(geometry);
  });

  it('disposes owned resources exactly once', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    handle.update(model());
    const line = handle.group.children[0] as THREE.LineLoop;
    const geometryDispose = vi.fn();
    const materialDispose = vi.fn();
    line.geometry.addEventListener('dispose', geometryDispose);
    (line.material as THREE.Material).addEventListener('dispose', materialDispose);
    handle.dispose();
    handle.dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(handle.group.children).toHaveLength(0);
  });
});
