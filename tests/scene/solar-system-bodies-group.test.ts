import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { SolarSystemBodyPresentationModel } from '../../src/presentation/solarSystemBodyPresentationModel';
import { createSolarSystemBodiesGroup } from '../../src/scene/createSolarSystemBodiesGroup';

function model(
  visible = true,
  labelsVisible = visible,
  labelScale: 'small' | 'medium' | 'large' | 'xl' | 'xxl' = 'medium',
): SolarSystemBodyPresentationModel {
  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  const labelBodies = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  return Object.freeze({
    kind: 'ready' as const,
    presentationKind: 'PROJECTIVE_APPARENT_TOPOCENTRIC_DIRECTIONS_AT_INFINITY' as const,
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS' as const,
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY' as const,
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES' as const,
    presentationRadiusPolicy: 'DIRECTION_AT_INFINITY_NO_FINITE_CELESTIAL_DISTANCE' as const,
    planetLabelStudyMode: 'baseline' as const,
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
    labels: Object.freeze(labelBodies.map((body, index) => Object.freeze({
      body,
      text: body === 'Pluto' ? 'Pluto (dwarf planet)' : body,
      directionApplication: Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: index === 5 ? 0.25 : 0, y: index === 5 ? 0.25 : 0, z: index === 5 ? -Math.sqrt(0.875) : -1 }),
      visible: labelsVisible,
      scale: labelScale,
    }))),
    visible,
    snapshotIdentity: Object.freeze({ snapshotCacheKey: 'snapshot', bodyCacheKey: 'body', observerRevision: 1, timeRevision: 1, calibrationRevision: 1, acceptedCalibrationRevision: 1, configurationRevision: 1 }),
    provenance: Object.freeze({ provider: 'Astronomy Engine', providerVersion: '2.1.19', sourceFrame: 'EQD_TRUE' as const, outputFrame: 'HORIZONTAL_ENU' as const, correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' as const }),
  });
}

function canvasWithVisibleText(hasAlpha = true) {
  const pixels = new Uint8ClampedArray(512 * 128 * 4);
  if (hasAlpha) { pixels[3] = 180; pixels[7] = 255; }
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {}, fillRect() {}, fillText() {}, getImageData: () => ({ data: pixels }),
      fillStyle: '', font: '', textAlign: '', textBaseline: '', shadowColor: '', shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

function createHandle() {
  return createSolarSystemBodiesGroup(() => undefined, canvasWithVisibleText);
}

describe('actual solar-system body Three.js group', () => {
  it('owns one bounded projective points geometry with the linear non-writing overlay policy', () => {
    const handle = createHandle();
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
    const handle = createHandle();
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
    const handle = createHandle();
    handle.update(model());
    const points = handle.group.children[0] as THREE.Points;
    const before = [...(points.geometry.getAttribute('position') as THREE.BufferAttribute).array];
    const left = new THREE.PerspectiveCamera(); left.position.set(-0.032, 0, 0);
    const right = new THREE.PerspectiveCamera(); right.position.set(0.032, 0, 0);
    handle.createFrameForCamera(left); handle.createFrameForCamera(right);
    expect([...(points.geometry.getAttribute('position') as THREE.BufferAttribute).array]).toEqual(before);
  });

  it('submits one finite native sprite per configured label and preserves the marker direction', () => {
    const handle = createHandle();
    const source = model();
    handle.update(source);
    const sprites = handle.group.children.filter((object): object is THREE.Sprite => object instanceof THREE.Sprite);
    expect(sprites).toHaveLength(8);
    expect(new Set(sprites.map(({ name }) => name)).size).toBe(8);
    const uranus = handle.group.getObjectByName('apparent-uranus-label') as THREE.Sprite;
    expect(uranus).toBeInstanceOf(THREE.Sprite);
    expect(uranus.parent).toBe(handle.group);
    expect(uranus.position.toArray().every(Number.isFinite)).toBe(true);
    expect(uranus.position.length()).toBeLessThan(30);
    expect((uranus.material as THREE.SpriteMaterial).opacity).toBeGreaterThan(0);
    expect(handle.getDiagnostics()).toMatchObject({
      configuredLabelObjectNames: expect.arrayContaining(['apparent-uranus-label']),
      submittedLabelObjectNames: expect.arrayContaining(['apparent-uranus-label']),
    });
    expect(uranus.userData.directionApplication).toBe(source.labels.find(({ body }) => body === 'Uranus')!.directionApplication);
  });

  it('keeps label controls authoritative and reuses objects across repeated toggles', () => {
    const handle = createHandle();
    handle.update(model());
    const labels = handle.group.children.filter((object) => object instanceof THREE.Sprite);
    handle.update(model(true, false));
    expect(labels.every((label) => !label.visible)).toBe(true);
    expect(handle.getDiagnostics().submittedLabelObjectNames).toEqual([]);
    expect(handle.getDiagnostics().activeMarkerObjectNames).toHaveLength(10);
    handle.enforceVisibilityControls();
    handle.update(model());
    expect(handle.group.children.filter((object) => object instanceof THREE.Sprite)).toEqual(labels);
    expect(labels.every((label) => label.visible)).toBe(true);
  });

  it('updates all selected Sprite scales without recreating sprites, textures, materials, or anchors', () => {
    const handle = createHandle();
    handle.update(model(true, true, 'small'));
    const labels = handle.group.children.filter((object): object is THREE.Sprite => object instanceof THREE.Sprite);
    const before = labels.map((sprite) => ({ sprite, material: sprite.material, texture: (sprite.material as THREE.SpriteMaterial).map, anchor: sprite.position.clone() }));
    handle.update(model(true, true, 'xxl'));
    for (const entry of before) {
      expect(entry.sprite.position.toArray()).toEqual(entry.anchor.toArray());
      expect(entry.sprite.scale.toArray()).toEqual([17.92, 4.48, 1]);
      expect(entry.sprite.material).toBe(entry.material);
      expect((entry.sprite.material as THREE.SpriteMaterial).map).toBe(entry.texture);
    }
    handle.update(model(true, false, 'xl'));
    expect(labels.every((label) => !label.visible)).toBe(true);
    handle.update(model(true, true, 'xl'));
    expect(labels.every((label) => label.visible && label.scale.x === 8.96 && label.scale.y === 2.24)).toBe(true);
    expect(handle.group.children.filter((object) => object instanceof THREE.Sprite)).toEqual(labels);
  });

  it('suppresses one invalid texture without hiding its marker or other labels', () => {
    let created = 0;
    const handle = createSolarSystemBodiesGroup(
      () => undefined,
      () => canvasWithVisibleText(++created !== 6),
    );
    handle.update(model());
    expect(handle.group.getObjectByName('apparent-uranus-label')).toBeUndefined();
    expect(handle.group.getObjectByName('apparent-uranus-marker')!.visible).toBe(true);
    expect(handle.group.getObjectByName('apparent-neptune-label')!.visible).toBe(true);
    expect(handle.getDiagnostics().suppressedLabelObjectNames).toContain('apparent-uranus-label');
  });
});
