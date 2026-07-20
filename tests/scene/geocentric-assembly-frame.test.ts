import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';
import { createCelestialEquatorPresentationModel } from '../../src/presentation/celestialEquatorPresentationModel';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';
import { createCelestialEquatorCameraRelativeFrame } from '../../src/scene/celestialEquatorCameraRelativeFrame';
import { createEarthAxisCameraRelativeFrame } from '../../src/scene/earthAxisCameraRelativeFrame';

function modelsFromState(
  observer: ObserverStateStore,
  calibration: GeographicCalibrationStateAdapter,
  sequence: number,
) {
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: sequence,
  });
  if (result.kind !== 'ready') throw new Error('Fixture must be ready.');
  const structure = createGeocentricCelestialStructurePresentation(result.snapshot);
  return {
    structure,
    axis: createEarthAxisPresentationModel(result.snapshot, undefined, structure),
    equator: createCelestialEquatorPresentationModel(result.snapshot, undefined, structure),
  };
}

function models(latitudeDeg = 42.7325, sequence = 1) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -84.5555, elevationMeters: 250, source: 'fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: sequence, simulated: true } });
  return modelsFromState(observer, calibration, sequence);
}

describe('unified geocentric assembly camera-relative frames', () => {
  it('preserves one core and perpendicular axis/equator under representative world and camera transforms', () => {
    const source = models();
    const worldTransforms = [
      new THREE.Matrix4(),
      new THREE.Matrix4().makeRotationY(0.91),
      new THREE.Matrix4().compose(new THREE.Vector3(4, -2, 7), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.8, 0.1)), new THREE.Vector3(1, 1, 1)),
    ];
    const cameraPositions = [
      new THREE.Vector3(),
      new THREE.Vector3(0.032, 1.7, 0.1),
      new THREE.Vector3(-2, 4, 1),
    ];
    for (const world of worldTransforms) {
      for (const position of cameraPositions) {
        const camera = new THREE.Matrix4().makeTranslation(position.x, position.y, position.z);
        const axis = createEarthAxisCameraRelativeFrame(source.axis, world, camera);
        const equator = createCelestialEquatorCameraRelativeFrame(source.equator, world, camera);
        expect(equator.coreView).toEqual({ x: axis.coreView.x, y: axis.coreView.y, z: axis.coreView.z });
        expect(new THREE.Vector3(axis.northDirectionView.x, axis.northDirectionView.y, axis.northDirectionView.z)
          .dot(new THREE.Vector3(equator.normalView.x, equator.normalView.y, equator.normalView.z))).toBeCloseTo(1, 14);
        expect(equator.maximumPlaneResidual).toBeLessThan(1e-12);
        expect(equator.maximumUploadedComponentMagnitude).toBeLessThan(2);
      }
    }
  });

  it('keeps the finite ring bounded and perpendicular for cardinal, vertical, and Michigan-like views', () => {
    const source = models();
    const views = [
      [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1.7, 0)],
      [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1.7, 0)],
      [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.7, 0)],
      [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1.7, 0)],
      [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -2, 0)],
      [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 3, 0)],
      [new THREE.Vector3(0.45, -0.18, -0.87), new THREE.Vector3(0.4, 1.65, 0.2)],
    ] as const;
    for (const [lookDirection, position] of views) {
      const cameraRotation = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        lookDirection.clone().normalize(),
      );
      const cameraWorld = new THREE.Matrix4().compose(
        position,
        cameraRotation,
        new THREE.Vector3(1, 1, 1),
      );
      const frame = createCelestialEquatorCameraRelativeFrame(
        source.equator,
        new THREE.Matrix4(),
        cameraWorld,
      );
      expect(frame.ringPoints).toHaveLength(96);
      expect(frame.ringPoints.every((point) =>
        [point.x, point.y, point.z, point.w].every(Number.isFinite))).toBe(true);
      expect(frame.maximumUploadedComponentMagnitude).toBeLessThan(2);
      expect(frame.maximumPlaneResidual).toBeLessThan(1e-12);
    }
  });

  it('rebuilds one shared rigid assembly across recalibration and observer change', () => {
    const observer = new ObserverStateStore();
    observer.set({ latitudeDeg: 42.7325, longitudeDegEast: -84.5555, elevationMeters: 250, source: 'initial' });
    const calibration = new GeographicCalibrationStateAdapter();
    calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true } });
    const initial = modelsFromState(observer, calibration, 1);
    calibration.update({ kind: 'calibrated', calibration: { yawRadians: 0.73, capturedDirection: { x: 1, y: 0, z: 0 }, timestamp: 2, simulated: true } });
    const recalibrated = modelsFromState(observer, calibration, 2);
    observer.set({ latitudeDeg: 35, longitudeDegEast: -100, elevationMeters: 1_000, source: 'moved' });
    const moved = modelsFromState(observer, calibration, 3);

    expect(recalibrated.structure.calibrationRevision).toBeGreaterThan(initial.structure.calibrationRevision);
    expect(moved.structure.observerRevision).toBeGreaterThan(recalibrated.structure.observerRevision);
    expect(moved.structure.snapshotCacheKey).not.toBe(recalibrated.structure.snapshotCacheKey);
    for (const [source, yaw] of [
      [initial, 0],
      [recalibrated, 0.73],
      [moved, 0.73],
    ] as const) {
      expect(source.axis.geocentricStructure).toBe(source.structure);
      expect(source.equator.geocentricStructure).toBe(source.structure);
      expect(source.equator.center).toBe(source.axis.earthCore);
      expect(source.equator.normalApplication).toBe(source.structure.northAxisDirection);
      const world = new THREE.Matrix4().makeRotationY(yaw);
      const camera = new THREE.Matrix4().makeTranslation(0.3, 1.8, -0.2);
      const axisFrame = createEarthAxisCameraRelativeFrame(source.axis, world, camera);
      const equatorFrame = createCelestialEquatorCameraRelativeFrame(source.equator, world, camera);
      expect(equatorFrame.coreView).toEqual({
        x: axisFrame.coreView.x,
        y: axisFrame.coreView.y,
        z: axisFrame.coreView.z,
      });
      expect(new THREE.Vector3(
        axisFrame.northDirectionView.x,
        axisFrame.northDirectionView.y,
        axisFrame.northDirectionView.z,
      ).dot(new THREE.Vector3(
        equatorFrame.normalView.x,
        equatorFrame.normalView.y,
        equatorFrame.normalView.z,
      ))).toBeCloseTo(1, 14);
      expect(equatorFrame.maximumPlaneResidual).toBeLessThan(1e-12);
    }
  });

  it('projects each bounded homogeneous point identically to its direct finite ring point', () => {
    const source = models();
    const world = new THREE.Matrix4().makeRotationY(0.37);
    const cameraWorld = new THREE.Matrix4().makeTranslation(0.4, 1.8, -0.2);
    const frame = createCelestialEquatorCameraRelativeFrame(source.equator, world, cameraWorld);
    const projection = new THREE.PerspectiveCamera(54, 1.3, 0.01, 100).projectionMatrix;
    const bounded = frame.ringPoints[17];
    const boundedClip = new THREE.Vector4(bounded.x, bounded.y, bounded.z, bounded.w).applyMatrix4(projection);
    const direction = new THREE.Vector3(
      source.equator.samples[17].directionApplication.x,
      source.equator.samples[17].directionApplication.y,
      source.equator.samples[17].directionApplication.z,
    ).transformDirection(world);
    const directView = new THREE.Vector3(frame.coreView.x, frame.coreView.y, frame.coreView.z)
      .addScaledVector(direction, source.equator.displayRadiusMeters);
    const directClip = new THREE.Vector4(directView.x, directView.y, directView.z, 1).applyMatrix4(projection);
    expect(boundedClip.x / boundedClip.w).toBeCloseTo(directClip.x / directClip.w, 12);
    expect(boundedClip.y / boundedClip.w).toBeCloseTo(directClip.y / directClip.w, 12);
    expect(frame.ringProjectiveW).toBeCloseTo(1 / source.equator.displayRadiusMeters, 20);
  });
});
