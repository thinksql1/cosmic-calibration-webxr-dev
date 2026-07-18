import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
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
    renderPosition: Object.freeze({ x: core.x, y: core.y + sign * 6e9, z: core.z - sign * 8e9 }),
    renderDistanceFromCoreMeters: 1e10,
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
    observerSurfaceOrigin: Object.freeze({ x: 0, y: 0, z: 0 }),
    earthCore: core,
    earthCoreVisible: true,
    earthCoreVisualRadiusMeters: 85_000,
    poleMarkerVisualRadiusMeters: 100_000_000,
    poleLabelWidthMeters: 700_000_000,
    poleLabelHeightMeters: 350_000_000,
    poleRenderConvergenceUpperBoundArcseconds: 0.14,
    observerToCoreDistanceMeters: 6_000_000,
    observerToAxisDistanceMeters: 4_700_000,
    north: endpoint('NCP', 1),
    south: endpoint('SCP', -1),
    snapshotIdentity: Object.freeze({ cacheKey: 'fixture', creationSequence: 1, observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1 }),
    ...overrides,
  });
}

const labelFactory = () => new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true }));

describe('geocentric Earth-axis Three.js group', () => {
  it('owns one Earth core, two touching centerline segments, and two pole proxies', () => {
    const handle = createEarthAxisGroup(labelFactory);
    const source = model();
    handle.update(source);
    expect(handle.group.name).toBe('celestial-geocentric-earth-axis-frame');
    expect(handle.group.children).toHaveLength(7);
    expect(handle.group.getObjectByName('modeled-earth-core-marker')?.position.toArray()).toEqual([100, -6_000_000, 200]);
    const north = handle.group.getObjectByName('north-celestial-pole-marker');
    const south = handle.group.getObjectByName('south-celestial-pole-marker');
    expect(north?.position.toArray()).toEqual([100, 5_994_000_000, -7_999_999_800]);
    expect(south?.position.toArray()).toEqual([100, -6_006_000_000, 8_000_000_200]);
    const northLine = handle.group.getObjectByName('mean-earth-axis-north-segment') as THREE.Line;
    const southLine = handle.group.getObjectByName('mean-earth-axis-south-segment') as THREE.Line;
    const northPositions = Array.from((northLine.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    const southPositions = Array.from((southLine.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    expect(northPositions[0]).toBeCloseTo(source.earthCore.x, 5);
    expect(northPositions[1]).toBeCloseTo(source.earthCore.y, 0);
    expect(northPositions[2]).toBeCloseTo(source.earthCore.z, 5);
    expect(southPositions.slice(0, 3)).toEqual(northPositions.slice(0, 3));
  });

  it('updates one persistent group without accumulating objects', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    const children = [...handle.group.children];
    handle.update(model({
      snapshotIdentity: Object.freeze({ cacheKey: 'second', creationSequence: 2, observerRevision: 2, timeRevision: 1, calibrationRevision: 2, acceptedCalibrationRevision: 2 }),
    }));
    expect(handle.group.children).toEqual(children);
    expect(handle.group.userData.snapshotCacheKey).toBe('second');
    expect(handle.group.userData.acceptedCalibrationRevision).toBe(2);
    expect(handle.group.userData.presentationKind).toBe('GEOCENTRIC_WORLD_SCALE_EARTH_CORE_AXIS');
  });

  it('changes visibility without moving core or pole centers', () => {
    const handle = createEarthAxisGroup(labelFactory);
    const source = model();
    handle.update(source);
    const southLine = handle.group.getObjectByName('mean-earth-axis-south-segment') as THREE.Line;
    const southMarker = handle.group.getObjectByName('south-celestial-pole-marker') as THREE.Mesh;
    const before = southMarker.position.toArray();
    handle.update(model({
      south: Object.freeze({ ...source.south, segmentVisible: false, markerVisible: false, labelVisible: false }),
    }));
    expect(southLine.visible).toBe(false);
    expect(southMarker.visible).toBe(false);
    expect(southMarker.position.toArray()).toEqual(before);
  });

  it('clears stale scientific readiness without removing parent geometry', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    expect(handle.group.visible).toBe(true);
    handle.clear();
    expect(handle.group.visible).toBe(false);
    expect(handle.group.userData.snapshotCacheKey).toBeUndefined();
    expect(handle.group.children).toHaveLength(7);
  });

  it('inherits geographic yaw exactly once while room geometry remains unchanged', () => {
    const roomRoot = new THREE.Group();
    const roomDiagnostic = new THREE.Object3D();
    roomDiagnostic.position.set(0, 0, -1);
    roomRoot.add(roomDiagnostic);
    const geographicParent = new THREE.Group();
    const handle = createEarthAxisGroup(labelFactory);
    geographicParent.add(handle.group);
    const source = model();
    handle.update(source);
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
    geographicParent.updateWorldMatrix(true, true);
    const core = handle.group.getObjectByName('modeled-earth-core-marker');
    const worldCore = core?.getWorldPosition(new THREE.Vector3());
    expect(core?.position.toArray()).toEqual([100, -6_000_000, 200]);
    expect(worldCore?.x).toBeCloseTo(-200, 8);
    expect(worldCore?.z).toBeCloseTo(100, 8);
    expect(roomDiagnostic.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([0, 0, -1]);
  });
});
