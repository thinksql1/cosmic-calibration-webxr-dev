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

const rendererStub = {} as THREE.WebGLRenderer;

function invokeBeforeRender(line: THREE.LineLoop, camera: THREE.Camera): void {
  camera.updateWorldMatrix(true, false);
  line.updateWorldMatrix(true, false);
  line.onBeforeRender(
    rendererStub,
    new THREE.Scene(),
    camera,
    line.geometry,
    line.material as THREE.Material,
    new THREE.Group(),
  );
  line.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, line.matrixWorld);
}

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
    expect(shader.vertexShader).toContain('projectionMatrix * modelViewMatrix');
    expect(shader.uniforms.uCoreViewScaled).toBeUndefined();
    expect(shader.uniforms.uRingProjectiveW).toBeDefined();
    expect(shader.uniforms.uDrawEnabled.value).toBe(1);
    expect(handle.group.userData.renderContractValid).toBe(true);
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

  it('routes the public equator handle by physical eye without mutating its scientific model', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    const source = model();
    const sourceBefore = JSON.stringify(source);
    const line = handle.group.children[0] as THREE.LineLoop;
    const geometry = line.geometry;
    handle.update(source);
    handle.setEyePresentationMode('left');
    handle.applyEyePresentationViews([{ eye: 'right' }, { eye: 'left' }], true);
    expect(handle.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'left', renderedEyes: ['left'], layerMask: 4,
    });
    expect(line.layers.mask).toBe(4);
    expect(line.geometry).toBe(geometry);
    expect(JSON.stringify(source)).toBe(sourceBefore);
    expect(source.center).toBe(source.geocentricStructure.earthCore);
    expect(source.normalApplication).toBe(source.geocentricStructure.equatorialPlaneNormal);
  });

  it('renders sequential Quest-like left and right eyes without mutating shared geometry', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    const parent = new THREE.Group();
    parent.rotation.y = -1.75;
    parent.add(handle.group);
    handle.update(model());
    parent.updateWorldMatrix(true, true);
    const line = handle.group.children[0] as THREE.LineLoop;
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const before = Array.from(positions.array);
    const version = positions.version;
    const left = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    left.position.set(-0.032, 1.7, 0);
    left.lookAt(0, 1.7, -1);
    const right = left.clone();
    right.position.x = 0.032;

    expect(() => invokeBeforeRender(line, left)).not.toThrow();
    const leftModelView = line.modelViewMatrix.clone();
    expect(leftModelView.elements.every(Number.isFinite)).toBe(true);
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(1);
    expect(() => invokeBeforeRender(line, right)).not.toThrow();
    const rightModelView = line.modelViewMatrix.clone();
    expect(rightModelView.elements.every(Number.isFinite)).toBe(true);
    expect(rightModelView.equals(leftModelView)).toBe(false);
    expect(Array.from(positions.array)).toEqual(before);
    expect(positions.version).toBe(version);
  });

  it.each([
    ['near the equatorial plane', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)],
    ['edge-on to the equator', new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(1, 1.7, 0)],
  ])('does not derive or throw a camera-dependent frame when viewed %s', (_name, positionValue, target) => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    handle.update(model());
    const line = handle.group.children[0] as THREE.LineLoop;
    const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    camera.position.copy(positionValue);
    camera.lookAt(target);
    expect(() => invokeBeforeRender(line, camera)).not.toThrow();
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(1);
  });

  it('localizes an invalid eye matrix to the equator draw and permits right-eye traversal', () => {
    const reports: string[] = [];
    const handle = createCelestialEquatorGroup(
      CELESTIAL_EQUATOR_SAMPLE_COUNT,
      (event, detail) => reports.push(`${event}|${detail}`),
    );
    handle.update(model());
    const line = handle.group.children[0] as THREE.LineLoop;
    const invalidLeft = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    invalidLeft.projectionMatrix.elements[0] = Number.NaN;
    expect(() => invokeBeforeRender(line, invalidLeft)).not.toThrow();
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(0);
    expect(reports.at(-1)).toContain('suppressed-non-finite-eye-state');

    const right = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    right.position.x = 0.032;
    let traversalContinued = false;
    expect(() => {
      invokeBeforeRender(line, right);
      traversalContinued = true;
    }).not.toThrow();
    expect(traversalContinued).toBe(true);
    expect((line.material as THREE.ShaderMaterial).uniforms.uDrawEnabled.value).toBe(1);
    expect(handle.group.userData.lastDrawState).toBe('valid');
  });

  it('suppresses an invalid equator model without throwing or exposing non-finite uniforms', () => {
    const reports: string[] = [];
    const handle = createCelestialEquatorGroup(
      CELESTIAL_EQUATOR_SAMPLE_COUNT,
      (event, detail) => reports.push(`${event}|${detail}`),
    );
    const invalid = { ...model(), displayRadiusMeters: Number.NaN };
    expect(() => handle.update(invalid)).not.toThrow();
    const line = handle.group.children[0] as THREE.LineLoop;
    const shader = line.material as THREE.ShaderMaterial;
    expect(line.visible).toBe(false);
    expect(handle.group.visible).toBe(false);
    expect(shader.uniforms.uRingProjectiveW.value).toBe(0);
    expect(shader.uniforms.uOpacity.value).toBe(0);
    expect(Object.values(shader.uniforms).every(({ value }) => (
      typeof value !== 'number' || Number.isFinite(value)
    ))).toBe(true);
    expect(reports.at(-1)).toContain('celestial-equator.update-suppressed');
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
    expect(() => handle.update(model())).toThrow('disposed');
  });
});
