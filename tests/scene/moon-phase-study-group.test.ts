import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createMoonPhasePresentationModel } from '../../src/presentation/moonPhasePresentation';
import { createMoonPhaseStudyGroup } from '../../src/scene/createMoonPhaseStudyGroup';
import type { MoonPhaseState } from '../../src/science/moon/moonPhase';

function canvasWithVisibleText() {
  const pixels = new Uint8ClampedArray(512 * 128 * 4);
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {},
      fillRect() { pixels[3] = 160; },
      fillText() { pixels[7] = 255; },
      getImageData: () => ({ data: pixels }),
      fillStyle: '', font: '', textAlign: '', textBaseline: '',
      shadowColor: '', shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

const phase: MoonPhaseState = Object.freeze({
  kind: 'VALID_MOON_PHASE_STATE',
  provider: 'Astronomy Engine',
  providerVersion: '2.1.19',
  simulationInstant: Object.freeze({ utcIso: '2025-01-01T00:00:00.000Z', unixMilliseconds: 1735689600000, source: 'frozen-test' as const }),
  phaseLongitudeDeg: 90,
  phaseAngleDeg: 90,
  illuminatedFraction: 0.5,
  previousNewMoonUtc: '2024-12-30T00:00:00.000Z',
  nextPrincipalPhaseUtc: '2025-01-06T00:00:00.000Z',
  nextPrincipalQuarter: 2,
  phaseName: 'First Quarter',
  waxing: true,
  ageSinceNewMoonDays: 2,
  timeUntilNextPrincipalPhaseDays: 5,
});

const direction = (x: number, y: number, z: number) =>
  Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x, y, z });

describe('Moon phase study Three.js group', () => {
  it('creates one reusable world-locked dial with eight cached images, labels, notches, and a current icon', () => {
    const handle = createMoonPhaseStudyGroup(canvasWithVisibleText);
    const model = createMoonPhasePresentationModel(phase, direction(0, 0.6, -0.8), direction(0.8, 0, -0.6));
    const settings = Object.freeze({
      showDial: true,
      showNotches: true,
      showLabels: true,
      showImages: true,
      showCurrentAppearance: true,
      showCurrentIndicator: true,
    });
    handle.update(model, settings);
    const namesBefore: string[] = [];
    handle.group.traverse((object) => namesBefore.push(object.name));
    expect(namesBefore.filter((name) => name.startsWith('moon-phase-image-'))).toHaveLength(8);
    expect(namesBefore.filter((name) => name.startsWith('moon-phase-label-'))).toHaveLength(8);
    expect(handle.group.getObjectByName('moon-phase-dial-notches')).toBeInstanceOf(THREE.LineSegments);
    expect(handle.group.getObjectByName('current-moon-appearance')).toBeInstanceOf(THREE.Sprite);
    const fullMoonImage = handle.group.getObjectByName('moon-phase-image-full-moon') as THREE.Sprite;
    expect(fullMoonImage.parent?.name).toBe('clean-moon-phase-image-anchor-full-moon');
    expect(fullMoonImage.scale.x).toBe(fullMoonImage.scale.y);
    handle.group.updateMatrixWorld(true);
    const fullMoonMatrix = fullMoonImage.matrixWorld.clone();
    expect(handle.group.parent).toBeNull();
    expect(handle.getDiagnostics()).toMatchObject({
      ready: true,
      canonicalTextureCount: 8,
      imageCount: 8,
      labelCount: 8,
      notchCount: 8,
      perEyeMutation: false,
    });
    handle.update(model, { ...settings, showLabels: false, showImages: false });
    handle.group.updateMatrixWorld(true);
    expect(fullMoonImage.matrixWorld.equals(fullMoonMatrix)).toBe(true);
    const namesAfter: string[] = [];
    handle.group.traverse((object) => namesAfter.push(object.name));
    expect(namesAfter).toEqual(namesBefore);
    expect(handle.getDiagnostics()).toMatchObject({ imageCount: 0, labelCount: 0, canonicalTextureCount: 8 });
    handle.dispose();
    handle.dispose();
  });

  it('keeps dial OFF authoritative and locally suppresses invalid model state', () => {
    const handle = createMoonPhaseStudyGroup(canvasWithVisibleText);
    const model = createMoonPhasePresentationModel(phase, direction(0, 0.6, -0.8), direction(0.8, 0, -0.6));
    handle.update(model, {
      showDial: false,
      showNotches: true,
      showLabels: true,
      showImages: true,
      showCurrentAppearance: false,
      showCurrentIndicator: true,
    });
    expect(handle.group.visible).toBe(false);
    expect(handle.group.visible).toBe(false);
    handle.clear('invalid phase');
    handle.enforceVisibilityControls();
    expect(handle.getDiagnostics().suppressionReason).toBe('invalid phase');
    handle.dispose();
  });
});
