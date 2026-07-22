import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createPlanetLabelSprite } from '../../src/scene/createPlanetLabelSprite';

function canvasWithVisibleText() {
  const pixels = new Uint8ClampedArray(512 * 128 * 4);
  pixels[3] = 180;
  pixels[7] = 255;
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {}, fillRect() {}, fillText() {},
      getImageData: () => ({ data: pixels }),
      fillStyle: '', font: '', textAlign: '', textBaseline: '', shadowColor: '', shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

describe('Uranus finite XR label sprite proof', () => {
  it('creates one world-anchored native sprite with visible texture and deliberate depth behavior', () => {
    const result = createPlanetLabelSprite('uranus-xr-label-proof', 'Uranus', canvasWithVisibleText);
    expect(result.kind).toBe('VALID_PLANET_LABEL_SPRITE');
    if (result.kind !== 'VALID_PLANET_LABEL_SPRITE') return;
    const { handle } = result;
    const placement = handle.update({ frame: 'APPLICATION_BASIS', units: 'unitless', x: 0.3, y: 0.4, z: -0.8660254037844386 });
    expect(handle.sprite).toBeInstanceOf(THREE.Sprite);
    expect(handle.sprite.parent).toBeNull();
    expect(handle.sprite.position.toArray().every(Number.isFinite)).toBe(true);
    expect(handle.sprite.position.toArray()).toEqual(placement?.anchor.toArray());
    expect(() => handle.sprite.onBeforeRender(
      {} as THREE.WebGLRenderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
      handle.sprite.geometry,
      handle.sprite.material,
      new THREE.Group(),
    )).not.toThrow();
    expect(handle.getDiagnostics()).toMatchObject({
      objectCreated: true,
      textureWidth: 512,
      textureHeight: 128,
      materialType: 'SpriteMaterial',
      opacity: 0.94,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      frustumCulled: false,
    });
  });

  it('keeps one immutable anchor across sequential eye projections with coherent disparity', () => {
    const result = createPlanetLabelSprite('uranus-xr-label-proof', 'Uranus', canvasWithVisibleText);
    if (result.kind !== 'VALID_PLANET_LABEL_SPRITE') throw new Error(result.reason);
    result.handle.update({ frame: 'APPLICATION_BASIS', units: 'unitless', x: 0, y: 0, z: -1 });
    const before = result.handle.sprite.position.clone();
    const left = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    const right = new THREE.PerspectiveCamera(54, 1, 0.01, 100);
    left.position.x = -0.032; right.position.x = 0.032;
    left.layers.set(1); right.layers.set(2);
    left.updateMatrixWorld(); right.updateMatrixWorld();
    const leftNdc = before.clone().project(left);
    const rightNdc = before.clone().project(right);
    expect(leftNdc.x).not.toBeCloseTo(rightNdc.x, 8);
    const scene = new THREE.Scene(); scene.add(result.handle.sprite); scene.updateMatrixWorld(true);
    for (const camera of [left, right]) {
      result.handle.sprite.onBeforeRender(
        {} as THREE.WebGLRenderer,
        scene,
        camera,
        result.handle.sprite.geometry,
        result.handle.sprite.material,
        new THREE.Group(),
      );
    }
    expect(result.handle.getDiagnostics().projectedCentersNdc).toHaveProperty('left');
    expect(result.handle.getDiagnostics().projectedCentersNdc).toHaveProperty('right');
    expect(result.handle.getDiagnostics().stereoDisparityNdc).toBeGreaterThan(0);
    expect(result.handle.getDiagnostics().callbackErrorCount).toBe(0);
    expect(result.handle.sprite.position.toArray()).toEqual(before.toArray());
  });

  it('suppresses invalid placement locally and disposes its resources once', () => {
    const result = createPlanetLabelSprite('uranus-xr-label-proof', 'Uranus', canvasWithVisibleText);
    if (result.kind !== 'VALID_PLANET_LABEL_SPRITE') throw new Error(result.reason);
    const materialDispose = vi.fn();
    const textureDispose = vi.fn();
    result.handle.sprite.material.addEventListener('dispose', materialDispose);
    result.handle.sprite.material.map!.addEventListener('dispose', textureDispose);
    expect(result.handle.update({ frame: 'APPLICATION_BASIS', units: 'unitless', x: Number.NaN, y: 0, z: -1 })).toBeUndefined();
    expect(result.handle.sprite.visible).toBe(false);
    expect(result.handle.getDiagnostics().suppressionReason).toBe('non-finite-or-zero-body-direction');
    result.handle.dispose(); result.handle.dispose();
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(textureDispose).toHaveBeenCalledTimes(1);
  });
});
