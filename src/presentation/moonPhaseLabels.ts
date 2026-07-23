import * as THREE from 'three';
import type { PlanetLabelCanvasFactory } from './planetLabelPresentation';

export const MOON_PHASE_LABEL_TEXTURE_HEIGHT = 256;
export const MOON_PHASE_LABEL_TEXTURE_MAX_WIDTH = 2048;
export const MOON_PHASE_LABEL_PRESETS = Object.freeze({
  small: Object.freeze({ id: 'small', name: 'Small', worldHeightMeters: 0.45, multiplier: 1 }),
  medium: Object.freeze({ id: 'medium', name: 'Medium', worldHeightMeters: 0.9, multiplier: 2 }),
  large: Object.freeze({ id: 'large', name: 'Large', worldHeightMeters: 1.8, multiplier: 4 }),
  xl: Object.freeze({ id: 'xl', name: 'XL', worldHeightMeters: 3.6, multiplier: 8 }),
});
export type MoonPhaseLabelPreset = keyof typeof MOON_PHASE_LABEL_PRESETS;
export const DEFAULT_MOON_PHASE_LABEL_PRESET: MoonPhaseLabelPreset = 'medium';

export interface MoonPhaseLabelTexture {
  readonly kind: 'VALID_MOON_PHASE_LABEL_TEXTURE';
  readonly text: string;
  readonly texture: THREE.CanvasTexture;
  readonly width: number;
  readonly height: number;
  readonly visibleAlpha: true;
  readonly visibleAlphaPixelCount: number;
}

export function parseMoonPhaseLabelPreset(value: string | null | undefined): MoonPhaseLabelPreset {
  return value && value in MOON_PHASE_LABEL_PRESETS
    ? value as MoonPhaseLabelPreset
    : DEFAULT_MOON_PHASE_LABEL_PRESET;
}

function roundedTextureWidth(value: number): number {
  return Math.min(
    MOON_PHASE_LABEL_TEXTURE_MAX_WIDTH,
    Math.max(256, Math.ceil(value / 64) * 64),
  );
}

export function createMoonPhaseLabelTexture(
  text: string,
  canvasFactory?: PlanetLabelCanvasFactory,
): MoonPhaseLabelTexture | { readonly kind: 'INVALID_MOON_PHASE_LABEL_TEXTURE'; readonly reason: string } {
  const makeCanvas = canvasFactory ?? (() => document.createElement('canvas'));
  const measureCanvas = makeCanvas();
  measureCanvas.width = 256;
  measureCanvas.height = MOON_PHASE_LABEL_TEXTURE_HEIGHT;
  const measureContext = measureCanvas.getContext('2d');
  if (!measureContext) return Object.freeze({ kind: 'INVALID_MOON_PHASE_LABEL_TEXTURE', reason: '2D canvas unavailable' });
  const fontSize = 86;
  const font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  measureContext.font = font;
  const measuredWidth = typeof measureContext.measureText === 'function'
    ? measureContext.measureText(text).width
    : text.length * fontSize * 0.62;
  if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) {
    return Object.freeze({ kind: 'INVALID_MOON_PHASE_LABEL_TEXTURE', reason: 'text measurement invalid' });
  }
  const canvas = makeCanvas();
  canvas.width = roundedTextureWidth(measuredWidth + 96);
  canvas.height = MOON_PHASE_LABEL_TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return Object.freeze({ kind: 'INVALID_MOON_PHASE_LABEL_TEXTURE', reason: '2D canvas unavailable' });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(8, 12, 20, 0.72)';
  context.strokeStyle = 'rgba(222, 240, 255, 0.54)';
  context.lineWidth = 4;
  const radius = 24;
  if (
    typeof context.beginPath === 'function'
    && typeof context.roundRect === 'function'
    && typeof context.fill === 'function'
    && typeof context.stroke === 'function'
  ) {
    context.beginPath();
    context.roundRect(4, 4, canvas.width - 8, canvas.height - 8, radius);
    context.fill();
    context.stroke();
  } else {
    context.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
  }
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 10;
  context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  if (typeof context.strokeText === 'function') {
    context.strokeText(text, canvas.width / 2, canvas.height / 2 + 2);
  }
  context.fillStyle = '#eef7ff';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const imageData = typeof context.getImageData === 'function'
    ? context.getImageData(0, 0, canvas.width, canvas.height).data
    : undefined;
  let visibleAlphaPixelCount = imageData ? 0 : 1;
  if (imageData) {
    for (let index = 3; index < imageData.length; index += 4) {
      if (imageData[index]! > 0) visibleAlphaPixelCount += 1;
    }
  }
  if (visibleAlphaPixelCount === 0) {
    return Object.freeze({
      kind: 'INVALID_MOON_PHASE_LABEL_TEXTURE',
      reason: 'rendered label contains no visible alpha',
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return Object.freeze({
    kind: 'VALID_MOON_PHASE_LABEL_TEXTURE',
    text,
    texture,
    width: canvas.width,
    height: canvas.height,
    visibleAlpha: true,
    visibleAlphaPixelCount,
  });
}

export function moonPhaseLabelWorldSize(
  textureWidth: number,
  textureHeight: number,
  preset: MoonPhaseLabelPreset,
): readonly [number, number] {
  const definition = MOON_PHASE_LABEL_PRESETS[preset];
  return Object.freeze([
    definition.worldHeightMeters * textureWidth / textureHeight,
    definition.worldHeightMeters,
  ]);
}
