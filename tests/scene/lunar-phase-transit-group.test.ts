import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRealSkyEquatorialOrientation } from '../../src/science/astronomy/realSkyEquatorialOrientation';
import { LunarPhaseTransitService } from '../../src/science/moon/lunarPhaseTransit';
import { createGeocentricCelestialStructurePresentation } from '../../src/presentation/geocentricCelestialStructurePresentation';
import { createLunarPhaseTransitPresentation } from '../../src/presentation/lunarPhaseTransitPresentation';
import { createLunarPhaseTransitGroup } from '../../src/scene/createLunarPhaseTransitGroup';
import { createMoonPhaseTextureCache } from '../../src/scene/moonPhaseTextureCache';
import { lunarTransitFixture } from '../lunarTransitFixture';

function canvasFactory() {
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      fillText() {},
      strokeText() {},
      measureText: (text: string) => ({ width: text.length * 52 }),
      getImageData: () => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) }),
      fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '',
      textBaseline: '', lineJoin: '',
    }),
  } as unknown as HTMLCanvasElement;
}

describe('Lunar Phase Transit Three.js group', () => {
  it('reuses immutable geometry and keeps image and label billboards on independent identity-scale anchors', () => {
    const { providers, snapshot } = lunarTransitFixture();
    const transit = new LunarPhaseTransitService(providers).capture(snapshot);
    const orientation = createRealSkyEquatorialOrientation(snapshot.clock.instant, snapshot.observer.observer);
    if (orientation.kind !== 'ready') throw new Error(orientation.reason);
    const structure = createGeocentricCelestialStructurePresentation(snapshot);
    const settings = {
      showPath: true,
      showEarthHiddenPath: true,
      showNotches: true,
      showImages: true,
      showLabels: false,
      showCurrentTransit: true,
      labelPreset: 'medium' as const,
    };
    const cache = createMoonPhaseTextureCache();
    const handle = createLunarPhaseTransitGroup(cache, canvasFactory);
    const model = createLunarPhaseTransitPresentation(transit, orientation, structure, settings);
    handle.update(model, structure);
    const beforeColorGeometryHash = handle.getDiagnostics().geometryHash;
    handle.setLunarPalette('legacy-purple');
    handle.setLunarPalette('moonlit-water');
    expect(handle.group.getObjectByName('lunar-phase-transit-visible-sky-path')).toBeInstanceOf(THREE.Line);
    expect(handle.group.getObjectByName('lunar-phase-transit-earth-hidden-path')).toBeInstanceOf(THREE.Line);
    expect(model.events).toHaveLength(8);
    for (const event of model.events) {
      expect(handle.group.getObjectByName(`lunar-transit-notch-${event.phaseId}`)).toBeInstanceOf(THREE.Line);
      const image = handle.group.getObjectByName(`lunar-transit-phase-image-${event.phaseId}`) as THREE.Sprite;
      expect(image).toBeInstanceOf(THREE.Sprite);
      expect(image.parent?.name).toBe(`lunar-transit-image-anchor-${event.phaseId}`);
      expect(image.parent?.scale.toArray()).toEqual([1, 1, 1]);
      expect(image.scale.x).toBe(image.scale.y);
    }
    handle.group.updateMatrixWorld(true);
    const image = handle.group.getObjectByName('lunar-transit-phase-image-full-moon') as THREE.Sprite;
    const before = image.matrixWorld.clone();
    handle.update(
      createLunarPhaseTransitPresentation(transit, orientation, structure, {
        ...settings,
        showLabels: true,
        labelPreset: 'xl',
      }),
      structure,
    );
    handle.group.updateMatrixWorld(true);
    expect(image.matrixWorld.equals(before)).toBe(true);
    const diagnostics = handle.getDiagnostics();
    expect(diagnostics).toMatchObject({
      ready: true,
      geometryBuildCount: 1,
      notchCount: 8,
      imageCount: 8,
      labelCount: 8,
      perEyeMutation: false,
      callbackErrorCount: 0,
    });
    expect(diagnostics.geometryHash).toBe(beforeColorGeometryHash);
    expect(diagnostics.colorTokens.visible).toBe('lunar-transit-visible');
    expect(diagnostics.spriteShapeEvidence
      .filter((entry) => entry.name.includes('phase-image'))
      .every((entry) => Math.abs(entry.localScale[0] - entry.localScale[1]) < 1e-12
        && Math.abs(entry.worldScale[0] - entry.worldScale[1]) < 1e-12
        && entry.shearError < 1e-12)).toBe(true);
    handle.update(
      createLunarPhaseTransitPresentation(transit, orientation, structure, {
        ...settings,
        isolatedNotchPhaseIds: ['full-moon', 'last-quarter'],
      }),
      structure,
    );
    const visibleNotches = handle.group
      .getObjectByName('lunar-phase-transit-notches')!
      .children
      .filter((child) => child.visible)
      .map((child) => child.name);
    expect(visibleNotches).toEqual([
      'lunar-transit-notch-full-moon',
      'lunar-transit-notch-last-quarter',
    ]);
    handle.dispose();
    handle.dispose();
    cache.dispose();
  });
});
