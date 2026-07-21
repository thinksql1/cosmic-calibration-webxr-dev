import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  applyXrObjectIsolation,
  parseXrObjectIsolation,
  XR_OBJECT_ISOLATION_STATES,
} from '../../src/diagnostics/xrObjectIsolation';

function fixture(): THREE.Scene {
  const scene = new THREE.Scene();
  const first = new THREE.Group();
  const second = new THREE.Group();
  const third = new THREE.Group();
  scene.add(first);
  first.add(second);
  second.add(third);
  const names = new Set(XR_OBJECT_ISOLATION_STATES.flatMap((state) => state.objectNames));
  [...names].forEach((name, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
      ),
      new THREE.MeshBasicMaterial({ color: 0x123456 }),
    );
    mesh.name = name;
    [first, second, third][index % 3].add(mesh);
  });
  return scene;
}

function visibleRenderableNames(root: THREE.Object3D): string[] {
  const names: string[] = [];
  root.traverse((object) => {
    if (
      object.visible
      && (object instanceof THREE.Mesh
        || object instanceof THREE.Line
        || object instanceof THREE.Points
        || object instanceof THREE.Sprite)
    ) names.push(object.name);
  });
  return names.sort();
}

describe('XR exact-object isolation', () => {
  it('parses query, persisted, default, and invalid isolation identifiers', () => {
    expect(parseXrObjectIsolation('')).toMatchObject({ id: 'all' });
    expect(parseXrObjectIsolation('?isolate=north-spindle')).toMatchObject({ id: 'north-spindle' });
    expect(parseXrObjectIsolation('', 'celestial-equator-ring')).toMatchObject({ id: 'celestial-equator-ring' });
    expect(parseXrObjectIsolation('?isolate=invalid')).toMatchObject({ id: 'all' });
  });

  it('keeps the default state a strict visibility and material no-op', () => {
    const root = fixture();
    const objects: THREE.Object3D[] = [];
    root.traverse((object) => objects.push(object));
    objects.forEach((object, index) => { object.visible = index % 2 === 0; });
    const visibility = objects.map((object) => object.visible);
    const colors = objects.map((object) => {
      const material = (object as THREE.Mesh).material;
      return material instanceof THREE.MeshBasicMaterial ? material.color.getHex() : undefined;
    });
    applyXrObjectIsolation(root, XR_OBJECT_ISOLATION_STATES[0]);
    expect(objects.map((object) => object.visible)).toEqual(visibility);
    expect(objects.map((object) => {
      const material = (object as THREE.Mesh).material;
      return material instanceof THREE.MeshBasicMaterial ? material.color.getHex() : undefined;
    })).toEqual(colors);
  });

  it('enables exactly the named renderable set for every isolation state', () => {
    for (const isolation of XR_OBJECT_ISOLATION_STATES.slice(1)) {
      const root = fixture();
      const result = applyXrObjectIsolation(root, isolation);
      const expected = [...isolation.objectNames].sort();
      expect(result.matchedObjectNames, isolation.id).toEqual(expected);
      expect(result.visibleRenderableNames, isolation.id).toEqual(expected);
      expect(visibleRenderableNames(root), isolation.id).toEqual(expected);
      for (const objectName of expected) {
        const object = root.getObjectByName(objectName);
        expect(object?.visible, `${isolation.id}:${objectName}`).toBe(true);
        let ancestor = object?.parent;
        while (ancestor) {
          expect(ancestor.visible, `${isolation.id}:${ancestor.name || ancestor.type}`).toBe(true);
          ancestor = ancestor.parent;
        }
      }
    }
  });

  it('assigns unmistakable red and blue only in spindle isolation states', () => {
    const root = fixture();
    const isolation = XR_OBJECT_ISOLATION_STATES.find((state) => state.id === 'both-spindles')!;
    applyXrObjectIsolation(root, isolation);
    const north = root.getObjectByName('mean-earth-axis-rigid-spindle-north-segment') as THREE.Mesh;
    const south = root.getObjectByName('mean-earth-axis-rigid-spindle-south-segment') as THREE.Mesh;
    expect((north.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0xff2020);
    expect((south.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0x2070ff);
  });
});
