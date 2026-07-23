import { describe, expect, it } from 'vitest';
import {
  createMoonPhaseLabelTexture,
  moonPhaseLabelWorldSize,
  parseMoonPhaseLabelPreset,
} from '../../src/presentation/moonPhaseLabels';

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

describe('Moon phase label textures and scale presets', () => {
  it('measures each phase name dynamically and preserves the texture aspect ratio', () => {
    const short = createMoonPhaseLabelTexture('New Moon', canvasFactory);
    const long = createMoonPhaseLabelTexture('Waxing Crescent', canvasFactory);
    expect(short.kind).toBe('VALID_MOON_PHASE_LABEL_TEXTURE');
    expect(long.kind).toBe('VALID_MOON_PHASE_LABEL_TEXTURE');
    if (short.kind !== 'VALID_MOON_PHASE_LABEL_TEXTURE' || long.kind !== 'VALID_MOON_PHASE_LABEL_TEXTURE') return;
    expect(short.height).toBe(256);
    expect(long.height).toBe(256);
    expect(long.width).toBeGreaterThan(short.width);
    const shortSize = moonPhaseLabelWorldSize(short.width, short.height, 'medium');
    const longSize = moonPhaseLabelWorldSize(long.width, long.height, 'medium');
    expect(shortSize[0] / shortSize[1]).toBeCloseTo(short.width / short.height, 12);
    expect(longSize[0] / longSize[1]).toBeCloseTo(long.width / long.height, 12);
    expect(shortSize[1]).toBe(0.9);
    expect(moonPhaseLabelWorldSize(short.width, short.height, 'small')[1]).toBe(0.45);
    expect(moonPhaseLabelWorldSize(short.width, short.height, 'large')[1]).toBe(1.8);
    expect(moonPhaseLabelWorldSize(short.width, short.height, 'xl')[1]).toBe(3.6);
    short.texture.dispose();
    long.texture.dispose();
  });

  it('defaults invalid label-size values to Medium', () => {
    expect(parseMoonPhaseLabelPreset(undefined)).toBe('medium');
    expect(parseMoonPhaseLabelPreset('invalid')).toBe('medium');
    expect(parseMoonPhaseLabelPreset('xl')).toBe('xl');
  });
});
