import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEarthAxisGroup } from '../../src/scene/createEarthAxisGroup';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';
import type { EarthAxisPresentationModel } from '../../src/presentation/earthAxisPresentationModel';

function model(overrides: Partial<EarthAxisPresentationModel> = {}): EarthAxisPresentationModel {
  const endpoint = (
    pole: 'NCP' | 'SCP',
    sign: 1 | -1,
  ) => Object.freeze({
    pole,
    directionEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: 0, north: sign * 0.8, up: sign * 0.6 }),
    directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: 0, y: sign * 0.6, z: -sign * 0.8 }),
    position: Object.freeze({ x: 0, y: sign * 1.35, z: -sign * 1.8 }),
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
    presentationKind: 'OBSERVER_CENTERED_DIRECTIONAL_PROXY',
    presentationRadiusMeters: 2.25,
    origin: Object.freeze({ x: 0, y: 0, z: 0 }),
    north: endpoint('NCP', 1),
    south: endpoint('SCP', -1),
    showOrigin: true,
    snapshotIdentity: Object.freeze({ cacheKey: 'fixture', creationSequence: 1, observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1 }),
    ...overrides,
  });
}

const labelFactory = () => new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true }));

describe('coherent Earth-axis Three.js group', () => {
  it('owns exactly one origin, two touching segments, and two antipodal endpoints', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    expect(handle.group.name).toBe('celestial-earth-axis-frame');
    expect(handle.group.children).toHaveLength(7);
    expect(handle.group.getObjectByName('celestial-axis-observer-origin')).toBeDefined();
    const north = handle.group.getObjectByName('north-celestial-pole-marker');
    const south = handle.group.getObjectByName('south-celestial-pole-marker');
    expect(north?.position.toArray()).toEqual([0, 1.35, -1.8]);
    expect(south?.position.toArray()).toEqual([0, -1.35, 1.8]);
    const northLine = handle.group.getObjectByName('mean-earth-axis-north-segment') as THREE.Line;
    const southLine = handle.group.getObjectByName('mean-earth-axis-south-segment') as THREE.Line;
    const northPositions = Array.from((northLine.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    const southPositions = Array.from((southLine.geometry.getAttribute('position') as THREE.BufferAttribute).array);
    expect(northPositions.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(northPositions[4]).toBeCloseTo(1.35, 6);
    expect(northPositions[5]).toBeCloseTo(-1.8, 6);
    expect(southPositions.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(southPositions[4]).toBeCloseTo(-1.35, 6);
    expect(southPositions[5]).toBeCloseTo(1.8, 6);
  });

  it('updates one persistent group without accumulating scene objects', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    const children = [...handle.group.children];
    handle.update(model({
      snapshotIdentity: Object.freeze({ cacheKey: 'second', creationSequence: 2, observerRevision: 2, timeRevision: 1, calibrationRevision: 2, acceptedCalibrationRevision: 2 }),
    }));
    expect(handle.group.children).toEqual(children);
    expect(handle.group.userData.snapshotCacheKey).toBe('second');
    expect(handle.group.userData.acceptedCalibrationRevision).toBe(2);
  });

  it('applies visibility and below-horizon emphasis without changing endpoint position', () => {
    const handle = createEarthAxisGroup(labelFactory);
    const source = model();
    handle.update(source);
    const southLine = handle.group.getObjectByName('mean-earth-axis-south-segment') as THREE.Line;
    const southMarker = handle.group.getObjectByName('south-celestial-pole-marker') as THREE.Mesh;
    expect((southLine.material as THREE.LineBasicMaterial).opacity).toBe(0.22);
    expect(southMarker.position.toArray()).toEqual([0, -1.35, 1.8]);
    handle.update(model({
      south: Object.freeze({ ...source.south, segmentVisible: false, markerVisible: false, labelVisible: false }),
    }));
    expect(southLine.visible).toBe(false);
    expect(southMarker.visible).toBe(false);
    expect(southMarker.position.toArray()).toEqual([0, -1.35, 1.8]);
  });

  it('clears stale scientific readiness without removing Milestone 0/1 parents', () => {
    const handle = createEarthAxisGroup(labelFactory);
    handle.update(model());
    expect(handle.group.visible).toBe(true);
    handle.clear();
    expect(handle.group.visible).toBe(false);
    expect(handle.group.userData.snapshotCacheKey).toBeUndefined();
    expect(handle.group.children).toHaveLength(7);
  });

  it('inherits geographic yaw exactly once while room-relative geometry stays unchanged', () => {
    const roomRoot = new THREE.Group();
    const roomDiagnostic = new THREE.Object3D();
    roomDiagnostic.position.set(0, 0, -1);
    roomRoot.add(roomDiagnostic);

    const geographicParent = new THREE.Group();
    const handle = createEarthAxisGroup(labelFactory);
    geographicParent.add(handle.group);
    handle.update(model({
      north: Object.freeze({
        ...model().north,
        directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS', units: 'unitless', x: 0, y: 0, z: -1 }),
        position: Object.freeze({ x: 0, y: 0, z: -1.8 }),
      }),
      south: Object.freeze({
        ...model().south,
        directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS', units: 'unitless', x: 0, y: 0, z: 1 }),
        position: Object.freeze({ x: 0, y: 0, z: 1.8 }),
      }),
    }));
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

    const northMarker = handle.group.getObjectByName('north-celestial-pole-marker');
    const worldNorth = northMarker?.getWorldPosition(new THREE.Vector3());
    expect(northMarker?.position.toArray()).toEqual([0, 0, -1.8]);
    expect(worldNorth?.x).toBeCloseTo(1.8, 12);
    expect(worldNorth?.z).toBeCloseTo(0, 12);
    expect(roomDiagnostic.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([0, 0, -1]);
  });
});
