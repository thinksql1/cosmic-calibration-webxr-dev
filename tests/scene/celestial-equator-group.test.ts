import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  CELESTIAL_EQUATOR_SAMPLE_COUNT,
  type CelestialEquatorPresentationModel,
} from '../../src/presentation/celestialEquatorPresentationModel';
import { createCelestialEquatorGroup } from '../../src/scene/createCelestialEquatorGroup';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';

function model(overrides: Partial<CelestialEquatorPresentationModel> = {}): CelestialEquatorPresentationModel {
  const samples = Object.freeze(Array.from({ length: CELESTIAL_EQUATOR_SAMPLE_COUNT }, (_, index) => {
    const theta = (index / CELESTIAL_EQUATOR_SAMPLE_COUNT) * Math.PI * 2;
    const east = Math.cos(theta);
    const north = Math.sin(theta);
    return Object.freeze({
      index,
      directionEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east, north, up: 0 }),
      directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: east, y: 0, z: -north }),
    });
  }));
  return Object.freeze({
    kind: 'ready',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_CELESTIAL_EQUATOR_OF_DATE',
    presentationKind: 'GEOCENTRIC_PROJECTIVE_GREAT_CIRCLE_AT_INFINITY',
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_EQUATOR_DIRECTIONS_WITH_CAMERA_RELATIVE_CORE',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    earthCore: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'meters' as const, x: 100, y: -6_000_000, z: 200 }),
    normalEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: 0, north: 0, up: 1 }),
    normalApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: 1, z: 0 }),
    firstEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: 1, north: 0, up: 0 }),
    secondEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: 0, north: 1, up: 0 }),
    samples,
    sampleCount: CELESTIAL_EQUATOR_SAMPLE_COUNT,
    visible: true,
    lineOpacity: 0.48,
    snapshotIdentity: Object.freeze({ cacheKey: 'fixture', creationSequence: 1, observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1, configurationRevision: 1 }),
    provenance: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, sourceBasisFrame: 'GCRS' as const, model: 'IAU_P03_PRECESSION_ONLY' as const, provider: 'fixture', providerVersion: '1', samplingPhase: 'LOCAL_CANONICAL_UNLABELED' as const }),
    ...overrides,
  });
}

describe('celestial-equator projective Three.js group', () => {
  it('owns one bounded homogeneous LineLoop with explicit linear-depth overlay policy', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    handle.update(model());
    const line = handle.group.getObjectByName('mean-celestial-equator-projective-great-circle') as THREE.LineLoop;
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const shader = line.material as THREE.ShaderMaterial;
    expect(handle.group.name).toBe('celestial-geocentric-mean-equator-frame');
    expect(handle.group.children).toHaveLength(1);
    expect(line.frustumCulled).toBe(false);
    expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThanOrEqual(1);
    expect(shader.depthTest).toBe(false);
    expect(shader.depthWrite).toBe(false);
    expect(shader.vertexShader).toContain('vec4(position, 0.0)');
  });

  it('updates per-eye projective directions, preserves translation invariance, and applies yaw once', () => {
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
    expect(leftFrame.directionsView).toEqual(rightFrame.directionsView);
    expect(leftFrame.float32DirectionAngularErrorArcseconds).toBeLessThan(0.03);
    applyCalibrationToGeographicGroup(parent, {
      kind: 'calibrated',
      calibration: { acceptedRevision: 1, yawRadians: Math.PI / 2, capturedDirection: { x: 1, y: 0, z: 0 }, timestamp: 1, simulated: true },
    });
    const yawed = handle.createFrameForCamera(left);
    expect(yawed.directionsView[0].z).toBeCloseTo(-1, 12);
  });

  it('clears and disposes only its own resources without duplicate allocation', () => {
    const handle = createCelestialEquatorGroup(CELESTIAL_EQUATOR_SAMPLE_COUNT);
    handle.update(model());
    const line = handle.group.children[0] as THREE.LineLoop;
    const geometryDispose = vi.fn();
    const materialDispose = vi.fn();
    line.geometry.addEventListener('dispose', geometryDispose);
    (line.material as THREE.Material).addEventListener('dispose', materialDispose);
    const geometry = line.geometry;
    handle.clear();
    expect(handle.group.visible).toBe(false);
    expect(geometryDispose).not.toHaveBeenCalled();
    handle.update(model({ snapshotIdentity: Object.freeze({ cacheKey: 'second', creationSequence: 2, observerRevision: 1, timeRevision: 2, calibrationRevision: 2, acceptedCalibrationRevision: 2, configurationRevision: 1 }) }));
    expect((handle.group.children[0] as THREE.LineLoop).geometry).toBe(geometry);
    handle.dispose();
    handle.dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(handle.group.children).toHaveLength(0);
    expect(() => handle.update(model())).toThrow('disposed');
  });
});
