import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createFiniteCoreParallaxModel,
  FINITE_CORE_PARALLAX_DISTANCE_PRESETS,
} from '../../src/presentation/finiteCoreParallaxExperiment';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createObserverOffsetGeocentricPresentation } from '../../src/presentation/observerOffsetGeocentricPresentation';
import {
  createFiniteCoreParallaxExperimentGroup,
  FINITE_CORE_PARALLAX_PROXY_NAME,
  projectFiniteWorldPosition,
} from '../../src/scene/createFiniteCoreParallaxExperimentGroup';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function fixture() {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg: 42.7325, longitudeDegEast: -84.5555, elevationMeters: 250, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { acceptedRevision: 1, yawRadians: 0.4, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
  const snapshot = buildScientificSnapshot({ observer: observer.current, clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current, calibration: calibration.current, configuration: new ScientificConfigurationStore().current, providers: createScientificProviderRegistry(), creationSequence: 1 });
  if (snapshot.kind !== 'ready') throw new Error('Ready fixture required.');
  const contract = createObserverOffsetGeocentricPresentation(createGeocentricCelestialStructurePresentation(snapshot.snapshot));
  if (contract.kind === 'not-ready') throw new Error(contract.detail);
  return contract;
}

function ready(distance = 2.5) {
  const result = createFiniteCoreParallaxModel(fixture(), distance);
  if (result.kind === 'not-ready') throw new Error(result.detail);
  return result;
}

function cameraRig(point: THREE.Vector3) {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  const direction = point.clone().normalize();
  camera.up.set(0, 1, 0);
  if (Math.abs(direction.dot(camera.up)) > 0.9) camera.up.set(0, 0, 1);
  camera.position.set(0, 0, 0);
  camera.lookAt(point);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = forward.clone().cross(camera.up).normalize();
  return { camera, right };
}

describe('finite core parallax scene object', () => {
  it('is one bounded 3D mesh beneath a geographic world anchor, never a camera or eye', () => {
    const model = ready();
    const experiment = createFiniteCoreParallaxExperimentGroup();
    const geographic = new THREE.Group();
    geographic.name = 'geographic-reference-frame';
    geographic.add(experiment.group);
    experiment.update(model, true);
    const proxy = experiment.group.getObjectByName(FINITE_CORE_PARALLAX_PROXY_NAME) as THREE.Mesh;
    expect(proxy.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);
    expect(proxy.parent).toBe(experiment.group);
    expect(proxy.parent).not.toBeInstanceOf(THREE.Camera);
    expect(proxy.onBeforeRender).toBe(new THREE.Object3D().onBeforeRender);
    expect(proxy.position.distanceTo(new THREE.Vector3(
      model.proxyPositionMeters.x,
      model.proxyPositionMeters.y,
      model.proxyPositionMeters.z,
    ))).toBe(0);
    const position = proxy.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(Math.max(...Array.from(position.array, Math.abs))).toBeLessThanOrEqual(model.proxyRadiusMeters + 1e-6);
    experiment.dispose();
  });

  it('stays world locked while right/left camera translation produces opposite projected motion', () => {
    const model = ready();
    const experiment = createFiniteCoreParallaxExperimentGroup();
    experiment.update(model, true);
    experiment.group.updateMatrixWorld(true);
    const proxy = experiment.group.getObjectByName(FINITE_CORE_PARALLAX_PROXY_NAME)!;
    const world = proxy.getWorldPosition(new THREE.Vector3());
    const worldBefore = world.clone();
    const { camera, right } = cameraRig(world);
    const center = projectFiniteWorldPosition(world, camera)!;
    camera.position.copy(right).multiplyScalar(0.1);
    camera.updateMatrixWorld(true);
    const afterRight = projectFiniteWorldPosition(world, camera)!;
    camera.position.copy(right).multiplyScalar(-0.1);
    camera.updateMatrixWorld(true);
    const afterLeft = projectFiniteWorldPosition(world, camera)!;
    expect(afterRight.x).toBeLessThan(center.x);
    expect(afterLeft.x).toBeGreaterThan(center.x);
    expect(proxy.getWorldPosition(new THREE.Vector3())).toEqual(worldBefore);
    experiment.dispose();
  });

  it('produces coherent nonzero eye disparity and less parallax at greater distance', () => {
    const near = ready(FINITE_CORE_PARALLAX_DISTANCE_PRESETS.near);
    const far = createFiniteCoreParallaxModel(near.sourceContract, FINITE_CORE_PARALLAX_DISTANCE_PRESETS.far);
    if (far.kind === 'not-ready') throw new Error(far.detail);
    const nearPoint = new THREE.Vector3(near.proxyPositionMeters.x, near.proxyPositionMeters.y, near.proxyPositionMeters.z);
    const farPoint = new THREE.Vector3(far.proxyPositionMeters.x, far.proxyPositionMeters.y, far.proxyPositionMeters.z);
    const rig = cameraRig(nearPoint);
    const shifted = rig.camera.clone() as THREE.PerspectiveCamera;
    shifted.position.copy(rig.right).multiplyScalar(0.1);
    shifted.updateMatrixWorld(true);
    const nearShift = Math.abs(projectFiniteWorldPosition(nearPoint, shifted)!.x);
    const farShift = Math.abs(projectFiniteWorldPosition(farPoint, shifted)!.x);
    expect(nearShift).toBeGreaterThan(farShift);

    const left = rig.camera.clone() as THREE.PerspectiveCamera;
    left.name = 'left'; left.layers.set(1); left.position.copy(rig.right).multiplyScalar(-0.032); left.updateMatrixWorld(true);
    const right = rig.camera.clone() as THREE.PerspectiveCamera;
    right.name = 'right'; right.layers.set(2); right.position.copy(rig.right).multiplyScalar(0.032); right.updateMatrixWorld(true);
    const experiment = createFiniteCoreParallaxExperimentGroup();
    experiment.update(near, true);
    const diagnostic = experiment.sampleProjection([left, right]);
    expect(diagnostic.projectionSamples.map((sample) => sample.eye)).toEqual(['left', 'right']);
    expect(diagnostic.stereoDisparityNdcX).toBeDefined();
    expect(Math.abs(diagnostic.stereoDisparityNdcX!)).toBeGreaterThan(0);
    experiment.dispose();
  });

  it('suppresses only the proxy on invalid state and restores an unchanged baseline when disabled', () => {
    const experiment = createFiniteCoreParallaxExperimentGroup();
    const invalid = createFiniteCoreParallaxModel(fixture(), -1);
    expect(() => experiment.update(invalid, true)).not.toThrow();
    expect(experiment.group.visible).toBe(false);
    expect(experiment.getDiagnostics()).toMatchObject({
      enabled: false,
      suppressedComponentNames: [FINITE_CORE_PARALLAX_PROXY_NAME],
    });
    experiment.update(ready(), true);
    expect(experiment.group.visible).toBe(true);
    experiment.update(ready(), false);
    expect(experiment.group.visible).toBe(false);
    expect(experiment.group.children).toHaveLength(1);
    experiment.dispose();
  });
});
