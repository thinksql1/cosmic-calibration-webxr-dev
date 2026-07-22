import { describe, expect, it } from 'vitest';
import {
  createPlanetLabelPlacement,
  createPlanetLabelTexture,
  DEFAULT_PLANET_LABEL_SCALE,
  getPlanetLabelScaleDefinition,
  parsePlanetLabelScale,
  parsePlanetLabelStudyMode,
  PLANET_LABEL_PREVIOUS_LARGE_SCALE_METERS,
  PLANET_LABEL_PRESENTATION_DISTANCE_METERS,
} from '../../src/presentation/planetLabelPresentation';

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
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

describe('finite XR planet-label presentation', () => {
  it('parses only the bounded Uranus proof and five canonical label scale choices', () => {
    expect(parsePlanetLabelStudyMode('?labelStudy=uranus-xr-proof')).toBe('uranus-xr-proof');
    expect(parsePlanetLabelStudyMode('?labelStudy=invalid')).toBe('baseline');
    expect(parsePlanetLabelScale('small')).toBe('small');
    expect(parsePlanetLabelScale('medium')).toBe('medium');
    expect(parsePlanetLabelScale('large')).toBe('large');
    expect(parsePlanetLabelScale('xl')).toBe('xl');
    expect(parsePlanetLabelScale('xxl')).toBe('xxl');
    expect(parsePlanetLabelScale('invalid')).toBe(DEFAULT_PLANET_LABEL_SCALE);
  });

  it('uses the old Large dimensions as the new Small and doubles both dimensions per preset', () => {
    const presets = ['small', 'medium', 'large', 'xl', 'xxl'] as const;
    const expectedMultipliers = [1, 2, 4, 8, 16] as const;
    const first = getPlanetLabelScaleDefinition('small');
    expect(first.dimensionsMeters).toEqual(PLANET_LABEL_PREVIOUS_LARGE_SCALE_METERS);
    expect(DEFAULT_PLANET_LABEL_SCALE).toBe('medium');
    for (const [index, preset] of presets.entries()) {
      const definition = getPlanetLabelScaleDefinition(preset);
      expect(definition.relativeToPreviousLarge).toBe(expectedMultipliers[index]);
      expect(definition.dimensionsMeters[0] / first.dimensionsMeters[0]).toBe(expectedMultipliers[index]);
      expect(definition.dimensionsMeters[1] / first.dimensionsMeters[1]).toBe(expectedMultipliers[index]);
      expect(definition.dimensionsMeters[0] / definition.dimensionsMeters[1]).toBeCloseTo(4, 12);
      expect(definition.dimensionsMeters.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
      if (index > 0) {
        const previous = getPlanetLabelScaleDefinition(presets[index - 1]);
        expect(definition.dimensionsMeters[0]).toBe(previous.dimensionsMeters[0] * 2);
        expect(definition.dimensionsMeters[1]).toBe(previous.dimensionsMeters[1] * 2);
      }
    }
  });

  it('creates a finite tangent-offset anchor from the exact marker direction', () => {
    const result = createPlanetLabelPlacement({ frame: 'APPLICATION_BASIS', units: 'unitless', x: 0.2, y: 0.4, z: -0.8944271909999159 });
    expect(result.kind).toBe('VALID_PLANET_LABEL_PLACEMENT');
    if (result.kind !== 'VALID_PLANET_LABEL_PLACEMENT') return;
    expect(result.direction.length()).toBeCloseTo(1, 12);
    expect(result.tangentOffset.dot(result.direction)).toBeCloseTo(0, 12);
    expect(result.anchor.clone().sub(result.tangentOffset).length()).toBeCloseTo(PLANET_LABEL_PRESENTATION_DISTANCE_METERS, 12);
    expect(result.anchor.toArray().every(Number.isFinite)).toBe(true);
    expect(result.tangentOffset.length()).toBeGreaterThan(0);
    expect(result.scaleMeters).toEqual(getPlanetLabelScaleDefinition('medium').dimensionsMeters);
  });

  it('creates a nonblank power-of-two canvas texture with upload state', () => {
    const result = createPlanetLabelTexture('Uranus', canvasWithVisibleText);
    expect(result.kind).toBe('VALID_PLANET_LABEL_TEXTURE');
    if (result.kind !== 'VALID_PLANET_LABEL_TEXTURE') return;
    expect(result.width).toBe(512);
    expect(result.height).toBe(128);
    expect(result.visibleAlphaPixelCount).toBeGreaterThan(0);
    expect(result.texture.version).toBeGreaterThan(0);
    expect(result.texture.userData.labelText).toBe('Uranus');
  });

  it('returns structured local failures for invalid direction and texture input', () => {
    expect(createPlanetLabelPlacement({ frame: 'APPLICATION_BASIS', units: 'unitless', x: Number.NaN, y: 0, z: 0 })).toMatchObject({ kind: 'INVALID_PLANET_LABEL_PLACEMENT' });
    expect(createPlanetLabelTexture(' ', canvasWithVisibleText)).toMatchObject({ kind: 'INVALID_PLANET_LABEL_TEXTURE' });
  });
});
