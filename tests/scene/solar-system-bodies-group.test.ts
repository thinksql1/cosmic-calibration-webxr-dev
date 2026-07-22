import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { SolarSystemBodyPresentationModel } from '../../src/presentation/solarSystemBodyPresentationModel';
import { createSolarSystemBodiesGroup } from '../../src/scene/createSolarSystemBodiesGroup';

function model(visible = true): SolarSystemBodyPresentationModel {
  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  return Object.freeze({
    kind: 'ready' as const,
    presentationKind: 'PROJECTIVE_APPARENT_TOPOCENTRIC_DIRECTIONS_AT_INFINITY' as const,
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS' as const,
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY' as const,
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES' as const,
    presentationRadiusPolicy: 'DIRECTION_AT_INFINITY_NO_FINITE_CELESTIAL_DISTANCE' as const,
    markers: Object.freeze(bodies.map((body, index) => Object.freeze({
      body,
      directionEnu: Object.freeze({ frame: 'HORIZONTAL_ENU' as const, units: 'unitless' as const, east: index === 0 ? 1 : 0, north: index === 0 ? 0 : 1, up: 0 }),
      directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: index === 0 ? 1 : 0, y: 0, z: index === 0 ? 0 : -1 }),
      altitudeDeg: 0,
      azimuthDeg: index === 0 ? 90 : 0,
      aboveHorizon: true,
      celestialEquatorRelation: 'ON' as const,
      style: Object.freeze({ colorHex: 0xffffff, pixelDiameter: 10 + index, opacity: 0.8 }),
      visible: true,
    }))),
    labels: Object.freeze([]),
    visible,
    snapshotIdentity: Object.freeze({ snapshotCacheKey: 'snapshot', bodyCacheKey: 'body', observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1, configurationRevision: 1 }),
    provenance: Object.freeze({ provider: 'Astronomy Engine', providerVersion: '2.1.19', sourceFrame: 'EQD_TRUE' as const, outputFrame: 'HORIZONTAL_ENU' as const, correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' as const }),
  });
}

describe('actual solar-system body Three.js group', () => {
  it('owns one bounded projective points geometry with the linear non-writing overlay policy', () => {
    const handle = createSolarSystemBodiesGroup();
    handle.update(model());
    const points = handle.group.children[0] as THREE.Points;
    const material = points.material as THREE.ShaderMaterial;
    const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(points.geometry.getAttribute('aColor').count).toBe(1);
    expect(points.geometry.getAttribute('aPointSize').count).toBe(1);
    expect(points.geometry.getAttribute('aOpacity').count).toBe(1);
    expect(Math.max(...Array.from(positions.array, Math.abs))).toBeLessThanOrEqual(1);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    expect(points.frustumCulled).toBe(false);
    expect(points.renderOrder).toBe(24);
    expect(material.vertexShader).toContain('vec4(position, 0.0)');
    expect(handle.group.children.filter((object) => object.name.endsWith('-marker'))).toHaveLength(10);
    expect(new Set(handle.group.children.map((object) => object.name)).size).toBe(handle.group.children.length);
  });

  it('is translation invariant for projective directions and disposes only owned resources', () => {
    const handle = createSolarSystemBodiesGroup();
    handle.update(model());
    const points = handle.group.children[0] as THREE.Points;
    const left = new THREE.PerspectiveCamera();
    left.position.set(-0.032, 1.7, 0);
    const right = new THREE.PerspectiveCamera();
    right.position.set(0.032, 1.7, 0);
    expect(handle.createFrameForCamera(left).directionsView).toEqual(handle.createFrameForCamera(right).directionsView);
    const disposeGeometry = vi.fn();
    const disposeMaterial = vi.fn();
    points.geometry.addEventListener('dispose', disposeGeometry);
    (points.material as THREE.Material).addEventListener('dispose', disposeMaterial);
    handle.clear();
    expect(disposeGeometry).not.toHaveBeenCalled();
    handle.update(model(false));
    handle.dispose();
    handle.dispose();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
  });

  it('does not alter shared marker geometry while sequential XR-eye frames are inspected', () => {
    const handle = createSolarSystemBodiesGroup();
    handle.update(model());
    const points = handle.group.children[0] as THREE.Points;
    const before = [...(points.geometry.getAttribute('position') as THREE.BufferAttribute).array];
    const left = new THREE.PerspectiveCamera(); left.position.set(-0.032, 0, 0);
    const right = new THREE.PerspectiveCamera(); right.position.set(0.032, 0, 0);
    handle.createFrameForCamera(left); handle.createFrameForCamera(right);
    expect([...(points.geometry.getAttribute('position') as THREE.BufferAttribute).array]).toEqual(before);
  });
});
