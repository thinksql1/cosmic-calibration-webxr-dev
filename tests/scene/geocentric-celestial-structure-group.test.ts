import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGeocentricCelestialStructureGroup } from '../../src/scene/createGeocentricCelestialStructureGroup';

describe('geocentric celestial structure transform hierarchy', () => {
  it('parents exactly one axis and one equator below one identity assembly', () => {
    const axis = new THREE.Group();
    axis.name = 'axis';
    const equator = new THREE.Group();
    equator.name = 'equator';
    const structure = createGeocentricCelestialStructureGroup(axis, equator);
    expect(structure.name).toBe('geocentric-celestial-structure-frame');
    expect(structure.children).toEqual([axis, equator]);
    expect(axis.parent).toBe(structure);
    expect(equator.parent).toBe(structure);
    expect(structure.position.toArray()).toEqual([0, 0, 0]);
    expect(structure.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
    expect(structure.userData.yawApplication).toBe('GEOGRAPHIC_PARENT_EXACTLY_ONCE');
  });

  it('keeps the observer-centred horizon outside the geocentric assembly', () => {
    const geographic = new THREE.Group();
    const axis = new THREE.Group();
    const equator = new THREE.Group();
    const horizon = new THREE.Group();
    horizon.name = 'observer-local-horizon-frame';
    const structure = createGeocentricCelestialStructureGroup(axis, equator);
    geographic.add(structure, horizon);
    geographic.rotation.y = 0.72;
    geographic.position.set(4, 2, -3);
    geographic.updateWorldMatrix(true, true);
    expect(structure.parent).toBe(geographic);
    expect(horizon.parent).toBe(geographic);
    expect(structure.children).not.toContain(horizon);
    expect(axis.matrixWorld.equals(equator.matrixWorld)).toBe(true);
  });

  it('rejects an aliased child that would collapse axis and equator ownership', () => {
    const child = new THREE.Group();
    expect(() => createGeocentricCelestialStructureGroup(child, child)).toThrow('distinct');
  });
});
