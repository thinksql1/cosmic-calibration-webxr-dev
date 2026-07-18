import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';
import type { EarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';

function model(overrides: Partial<EarthAxisPresentationModel> = {}): EarthAxisPresentationModel {
  const core = Object.freeze({ x: 100, y: -6_000_000, z: 200 });
  const endpoint = (pole: 'NCP' | 'SCP', sign: 1 | -1) => Object.freeze({
    pole,
    pointKind: 'PROJECTIVE_DIRECTION_AT_INFINITY' as const,
    directionEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: 0, north: sign * 0.8, up: sign * 0.6 }),
    directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: sign * 0.6, z: -sign * 0.8 }),
    diagnosticFiniteProxyPosition: Object.freeze({ x: core.x, y: core.y + sign * 6e12, z: core.z - sign * 8e12 }),
    diagnosticProxyDistanceFromCoreMeters: 1e13,
    altitudeDeg: sign * 36.8698976458,
    azimuthDeg: sign === 1 ? 0 : 180,
    horizonRelation: sign === 1 ? 'above' as const : 'below' as const,
    segmentVisible: true,
    segmentOpacity: sign === 1 ? 0.88 : 0.22,
    markerVisible: true,
    labelVisible: true,
  });
  return Object.freeze({
    kind: 'ready',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_POLE_OF_DATE',
    precisionTier: 'TIER_1',
    presentationKind: 'GEOCENTRIC_WORLD_SCALE_EARTH_CORE_AXIS',
    poleTopology: 'ANTIPODAL_PROJECTIVE_DIRECTIONS_AT_INFINITY',
    renderStrategy: 'CAMERA_RELATIVE_CORE_AND_HOMOGENEOUS_PROJECTIVE_POLES',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    observerSurfaceOrigin: Object.freeze({ x: 0, y: 0, z: 0 }),
    earthCore: core,
    earthCoreVisible: true,
    earthCoreMarkerDiameterPixels: 18,
    poleMarkerDiameterPixels: 18,
    poleLabelWidthPixels: 88,
    poleLabelHeightPixels: 42,
    poleRenderConvergenceUpperBoundArcseconds: 0.14,
    observerToCoreDistanceMeters: 6_000_000,
    observerToAxisDistanceMeters: 4_700_000,
    north: endpoint('NCP', 1),
    south: endpoint('SCP', -1),
    snapshotIdentity: Object.freeze({ cacheKey: 'fixture', creationSequence: 1, observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1 }),
    ...overrides,
  });
}

const labelFactory = () => new THREE.Texture();

describe('geocentric Earth-axis Three.js group', () => {
  it('uploads only bounded homogeneous coefficients and keeps all object translations local', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    expect(handle.group.name).toBe('celestial-geocentric-earth-axis-frame');
    expect(handle.group.children).toHaveLength(7);
    for (const child of handle.group.children) {
      expect(child.position.toArray()).toEqual([0, 0, 0]);
      const renderable = child as THREE.Mesh | THREE.Line;
      const positions = renderable.geometry.getAttribute('position') as THREE.BufferAttribute;
      expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThanOrEqual(1);
      const material = renderable.material as THREE.ShaderMaterial;
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
    }
    const northLine = handle.group.getObjectByName('mean-earth-axis-north-segment') as THREE.Line;
    expect(Array.from((northLine.geometry.getAttribute('position') as THREE.BufferAttribute).array)).toEqual([
      0, 0, 0, 1, 0, 0,
    ]);
  });

  it('derives camera-relative core and exact projective antipodes for the active eye', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    camera.position.set(1, 2, 3);
    const frame = handle.createFrameForCamera(camera);
    expect(frame.coreView).toMatchObject({ x: 99, y: -6_000_002, z: 197 });
    expect(frame.southDirectionView.x).toBe(-frame.northDirectionView.x);
    expect(frame.southDirectionView.y).toBe(-frame.northDirectionView.y);
    expect(frame.southDirectionView.z).toBe(-frame.northDirectionView.z);
    expect(frame.maximumUploadedComponentMagnitude).toBeLessThan(7_000_000);
    expect(frame.float32CoreQuantizationErrorMeters).toBeLessThan(1);
    expect(frame.float32DirectionAngularErrorArcseconds).toBeLessThan(0.03);
  });

  it('inherits geographic yaw exactly once while room geometry remains unchanged', () => {
    const roomRoot = new THREE.Group();
    const roomDiagnostic = new THREE.Object3D();
    roomDiagnostic.position.set(0, 0, -1);
    roomRoot.add(roomDiagnostic);
    const geographicParent = new THREE.Group();
    const handle = createEarthAxisGroup(labelFactory);
    geographicParent.add(handle.group);
    handle.update(model());
    applyCalibrationToGeographicGroup(geographicParent, {
      kind: 'calibrated',
      calibration: {
        acceptedRevision: 1,
        yawRadians: -Math.PI / 2,
        capturedDirection: { x: 1, y: 0, z: 0 },
        timestamp: 1,
        simulated: true,
      },
    });
    const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    const frame = handle.createFrameForCamera(camera);
    expect(frame.coreView.x).toBeCloseTo(-200, 8);
    expect(frame.coreView.y).toBeCloseTo(-6_000_000, 8);
    expect(frame.coreView.z).toBeCloseTo(100, 8);
    expect(roomDiagnostic.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([0, 0, -1]);
  });

  it('updates one persistent group without allocating or accumulating objects', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    const children = [...handle.group.children];
    const resources = children.map((child) => ({
      geometry: (child as THREE.Mesh | THREE.Line).geometry,
      material: (child as THREE.Mesh | THREE.Line).material,
    }));
    handle.update(model({
      snapshotIdentity: Object.freeze({ cacheKey: 'second', creationSequence: 2, observerRevision: 2, timeRevision: 1, calibrationRevision: 2, acceptedCalibrationRevision: 2 }),
    }));
    expect(handle.group.children).toEqual(children);
    expect(handle.group.children.map((child) => ({
      geometry: (child as THREE.Mesh | THREE.Line).geometry,
      material: (child as THREE.Mesh | THREE.Line).material,
    }))).toEqual(resources);
    expect(handle.group.userData.snapshotCacheKey).toBe('second');
    expect(handle.group.userData.acceptedCalibrationRevision).toBe(2);
  });

  it('changes visibility without moving or reallocating scientific centers', () => {
    const handle = createEarthAxisGroup(labelFactory);
    const source = model();
    handle.update(source);
    const southLine = handle.group.getObjectByName('mean-earth-axis-south-segment') as THREE.Line;
    const southMarker = handle.group.getObjectByName('south-celestial-pole-marker') as THREE.Mesh;
    const geometry = southMarker.geometry;
    handle.update(model({
      south: Object.freeze({ ...source.south, segmentVisible: false, markerVisible: false, labelVisible: false }),
    }));
    expect(southLine.visible).toBe(false);
    expect(southMarker.visible).toBe(false);
    expect(southMarker.position.toArray()).toEqual([0, 0, 0]);
    expect(southMarker.geometry).toBe(geometry);
  });

  it('filters the persistent axis and pole system by physical XR eye only', () => {
    const handle = createEarthAxisGroup(labelFactory);
    const source = model();
    handle.update(source);
    const snapshotBefore = JSON.stringify(source);
    handle.setEyePresentationMode('right');
    handle.applyEyePresentationViews([{ eye: 'right' }, { eye: 'left' }]);
    expect(handle.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'right',
      viewEyes: ['right', 'left'],
      renderedEyes: ['right'],
      layerMask: 2,
    });
    handle.group.children.forEach((child) => expect(child.layers.mask).toBe(2));
    expect(JSON.stringify(source)).toBe(snapshotBefore);
  });

  it('clears readiness without disposing reusable owned resources', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    const geometry = (handle.group.children[0] as THREE.Line).geometry;
    const dispose = vi.fn();
    geometry.addEventListener('dispose', dispose);
    handle.clear();
    expect(handle.group.visible).toBe(false);
    expect(handle.group.userData.snapshotCacheKey).toBeUndefined();
    expect(handle.group.children).toHaveLength(7);
    expect(dispose).not.toHaveBeenCalled();
    handle.update(model());
    expect(handle.group.visible).toBe(true);
  });

  it('disposes every unique owned resource exactly once and is idempotent', () => {
    const textures: THREE.Texture[] = [];
    const handle = createEarthAxisGroup(() => {
      const texture = new THREE.Texture();
      textures.push(texture);
      return texture;
    });
    const geometries = new Set(handle.group.children.map(
      (child) => (child as THREE.Mesh | THREE.Line).geometry,
    ));
    const materials = new Set(handle.group.children.map(
      (child) => (child as THREE.Mesh | THREE.Line).material as THREE.Material,
    ));
    const geometryDisposals = [...geometries].map((geometry) => {
      const listener = vi.fn();
      geometry.addEventListener('dispose', listener);
      return listener;
    });
    const materialDisposals = [...materials].map((material) => {
      const listener = vi.fn();
      material.addEventListener('dispose', listener);
      return listener;
    });
    const textureDisposals = textures.map((texture) => {
      const listener = vi.fn();
      texture.addEventListener('dispose', listener);
      return listener;
    });

    handle.update(model());
    handle.dispose();
    handle.dispose();

    expect(handle.group.children).toHaveLength(0);
    expect(handle.group.userData.disposed).toBe(true);
    geometryDisposals.forEach((listener) => expect(listener).toHaveBeenCalledTimes(1));
    materialDisposals.forEach((listener) => expect(listener).toHaveBeenCalledTimes(1));
    textureDisposals.forEach((listener) => expect(listener).toHaveBeenCalledTimes(1));
    expect(() => handle.update(model())).toThrow('disposed');
  });
});
