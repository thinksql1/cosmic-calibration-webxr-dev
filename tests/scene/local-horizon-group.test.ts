import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { applyCalibrationToGeographicGroup } from '../../src/scene/createGeographicReference';
import { createLocalHorizonGroup } from '../../src/scene/createLocalHorizonGroup';
import {
  createLocalHorizonPresentationModel,
  LOCAL_HORIZON_SAMPLE_COUNT,
} from '../../src/presentation/localHorizonPresentationModel';

function ready(revision = 1, visible = true) {
  const model = createLocalHorizonPresentationModel({
    kind: 'calibrated',
    calibration: {
      acceptedRevision: revision,
      yawRadians: 0,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: revision,
      simulated: true,
    },
  }, { showHorizon: visible, presentationRadiusMeters: 24 });
  if (model.kind !== 'ready') throw new Error('Expected ready horizon fixture.');
  return model;
}

describe('local-horizon Three.js group', () => {
  it('owns one bounded LineLoop with explicit non-writing linear-depth policy', () => {
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    handle.update(ready());
    const line = handle.group.children[0] as THREE.LineLoop;
    const material = line.material as THREE.LineBasicMaterial;
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(line).toBeInstanceOf(THREE.LineLoop);
    expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThanOrEqual(24);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(line.renderOrder).toBe(12);
    expect(line.frustumCulled).toBe(false);
  });

  it('inherits geographic yaw once and remains aligned with application north/east', () => {
    const parent = new THREE.Group();
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    const cardinalNorth = new THREE.Object3D();
    cardinalNorth.position.set(0, 0, -1.5);
    parent.add(handle.group);
    parent.add(cardinalNorth);
    handle.update(ready());
    applyCalibrationToGeographicGroup(parent, {
      kind: 'calibrated',
      calibration: {
        acceptedRevision: 2,
        yawRadians: Math.PI / 2,
        capturedDirection: { x: -1, y: 0, z: 0 },
        timestamp: 2,
        simulated: true,
      },
    });
    parent.updateWorldMatrix(true, true);
    const positions = ((handle.group.children[0] as THREE.LineLoop).geometry
      .getAttribute('position') as THREE.BufferAttribute).array;
    const localNorth = new THREE.Vector3(positions[72], positions[73], positions[74]);
    const worldNorth = handle.group.localToWorld(localNorth.clone());
    expect(localNorth.toArray()).toEqual([0, 0, -24]);
    expect(worldNorth.x).toBeCloseTo(-24, 10);
    expect(worldNorth.z).toBeCloseTo(0, 10);
    expect(worldNorth.clone().normalize().angleTo(
      cardinalNorth.getWorldPosition(new THREE.Vector3()).normalize(),
    )).toBeCloseTo(0, 12);
  });

  it('updates calibration identity and visibility without reallocating resources', () => {
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    handle.update(ready(1));
    const line = handle.group.children[0] as THREE.LineLoop;
    const geometry = line.geometry;
    const material = line.material;
    handle.update(ready(2, false));
    expect(line.geometry).toBe(geometry);
    expect(line.material).toBe(material);
    expect(handle.group.userData.acceptedCalibrationRevision).toBe(2);
    expect(handle.group.visible).toBe(false);
  });

  it('composes eye filtering with the same persistent horizon geometry', () => {
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    handle.update(ready());
    const geometry = (handle.group.children[0] as THREE.LineLoop).geometry;
    handle.setEyePresentationMode('left');
    handle.applyEyePresentationViews([{ eye: 'right' }, { eye: 'left' }]);
    expect(handle.getEyePresentationDiagnostics()).toMatchObject({
      mode: 'left',
      renderedEyes: ['left'],
      layerMask: 4,
    });
    expect((handle.group.children[0] as THREE.LineLoop).geometry).toBe(geometry);
  });

  it('clears without disposal and disposes owned resources idempotently', () => {
    const handle = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
    handle.update(ready());
    const line = handle.group.children[0] as THREE.LineLoop;
    const material = line.material as THREE.LineBasicMaterial;
    const geometryDispose = vi.fn();
    const materialDispose = vi.fn();
    line.geometry.addEventListener('dispose', geometryDispose);
    material.addEventListener('dispose', materialDispose);
    handle.clear();
    expect(handle.group.visible).toBe(false);
    expect(geometryDispose).not.toHaveBeenCalled();
    handle.update(ready(2));
    handle.dispose();
    handle.dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(handle.group.children).toHaveLength(0);
    expect(() => handle.update(ready(3))).toThrow('disposed');
  });
});
