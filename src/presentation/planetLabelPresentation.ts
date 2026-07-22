import * as THREE from 'three';
import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';

export const PLANET_LABEL_PRESENTATION_DISTANCE_METERS = 24;
export const PLANET_LABEL_TANGENT_RIGHT_METERS = 0.42;
export const PLANET_LABEL_TANGENT_UP_METERS = 0.32;

export type PlanetLabelStudyMode = 'baseline' | 'uranus-xr-proof';
export type PlanetLabelScale = 'small' | 'medium' | 'large' | 'xl' | 'xxl';

/** The physically tested maximum from build 0445f13; it is now the new Small base. */
export const PLANET_LABEL_PREVIOUS_LARGE_SCALE_METERS = Object.freeze([1.12, 0.28]) as readonly [number, number];

export interface PlanetLabelScaleDefinition {
  readonly id: PlanetLabelScale;
  readonly displayName: 'Small' | 'Medium' | 'Large' | 'XL' | 'XXL';
  readonly dimensionsMeters: readonly [number, number];
  readonly relativeToPreviousLarge: 1 | 2 | 4 | 8 | 16;
}

/**
 * Canonical, non-compounding world-space Sprite dimensions. XXL is intentionally
 * the bounded maximum experimental readability preset, not an implicit clamp.
 */
export const PLANET_LABEL_SCALE_DEFINITIONS: Readonly<Record<PlanetLabelScale, PlanetLabelScaleDefinition>> = Object.freeze({
  small: Object.freeze({ id: 'small', displayName: 'Small', dimensionsMeters: PLANET_LABEL_PREVIOUS_LARGE_SCALE_METERS, relativeToPreviousLarge: 1 }),
  medium: Object.freeze({ id: 'medium', displayName: 'Medium', dimensionsMeters: Object.freeze([2.24, 0.56]) as readonly [number, number], relativeToPreviousLarge: 2 }),
  large: Object.freeze({ id: 'large', displayName: 'Large', dimensionsMeters: Object.freeze([4.48, 1.12]) as readonly [number, number], relativeToPreviousLarge: 4 }),
  xl: Object.freeze({ id: 'xl', displayName: 'XL', dimensionsMeters: Object.freeze([8.96, 2.24]) as readonly [number, number], relativeToPreviousLarge: 8 }),
  xxl: Object.freeze({ id: 'xxl', displayName: 'XXL', dimensionsMeters: Object.freeze([17.92, 4.48]) as readonly [number, number], relativeToPreviousLarge: 16 }),
});

export const DEFAULT_PLANET_LABEL_SCALE: PlanetLabelScale = 'medium';

export function getPlanetLabelScaleDefinition(scale: PlanetLabelScale = DEFAULT_PLANET_LABEL_SCALE): PlanetLabelScaleDefinition {
  return PLANET_LABEL_SCALE_DEFINITIONS[scale];
}

export interface PlanetLabelPlacement {
  readonly kind: 'VALID_PLANET_LABEL_PLACEMENT';
  readonly direction: THREE.Vector3;
  readonly tangentRight: THREE.Vector3;
  readonly tangentUp: THREE.Vector3;
  readonly tangentOffset: THREE.Vector3;
  readonly anchor: THREE.Vector3;
  readonly presentationDistanceMeters: number;
  readonly scaleMeters: readonly [number, number];
}

export interface InvalidPlanetLabelPlacement {
  readonly kind: 'INVALID_PLANET_LABEL_PLACEMENT';
  readonly reason: string;
}

export type PlanetLabelPlacementResult = PlanetLabelPlacement | InvalidPlanetLabelPlacement;

export interface PlanetLabelTexture {
  readonly kind: 'VALID_PLANET_LABEL_TEXTURE';
  readonly texture: THREE.CanvasTexture;
  readonly width: number;
  readonly height: number;
  readonly visibleAlphaPixelCount: number;
}

export interface InvalidPlanetLabelTexture {
  readonly kind: 'INVALID_PLANET_LABEL_TEXTURE';
  readonly reason: string;
}

export type PlanetLabelTextureResult = PlanetLabelTexture | InvalidPlanetLabelTexture;
export type PlanetLabelCanvasFactory = () => HTMLCanvasElement;

export function parsePlanetLabelStudyMode(search: string): PlanetLabelStudyMode {
  return new URLSearchParams(search).get('labelStudy') === 'uranus-xr-proof'
    ? 'uranus-xr-proof'
    : 'baseline';
}

export function parsePlanetLabelScale(value: string | null | undefined): PlanetLabelScale {
  return value === 'small' || value === 'large' || value === 'xl' || value === 'xxl'
    ? value
    : DEFAULT_PLANET_LABEL_SCALE;
}

export function createPlanetLabelPlacement(
  source: ApplicationBasisDirection,
  scale: PlanetLabelScale = DEFAULT_PLANET_LABEL_SCALE,
): PlanetLabelPlacementResult {
  const direction = new THREE.Vector3(source.x, source.y, source.z);
  const length = direction.length();
  if (!Number.isFinite(length) || length < 1e-12) {
    return Object.freeze({ kind: 'INVALID_PLANET_LABEL_PLACEMENT', reason: 'non-finite-or-zero-body-direction' });
  }
  direction.multiplyScalar(1 / length);
  const fallback = Math.abs(direction.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangentRight = new THREE.Vector3().crossVectors(fallback, direction).normalize();
  const tangentUp = new THREE.Vector3().crossVectors(direction, tangentRight).normalize();
  const tangentOffset = tangentRight.clone().multiplyScalar(PLANET_LABEL_TANGENT_RIGHT_METERS)
    .addScaledVector(tangentUp, PLANET_LABEL_TANGENT_UP_METERS);
  const anchor = direction.clone().multiplyScalar(PLANET_LABEL_PRESENTATION_DISTANCE_METERS)
    .add(tangentOffset);
  if (![...direction, ...tangentRight, ...tangentUp, ...tangentOffset, ...anchor].every(Number.isFinite)) {
    return Object.freeze({ kind: 'INVALID_PLANET_LABEL_PLACEMENT', reason: 'non-finite-derived-placement' });
  }
  return Object.freeze({
    kind: 'VALID_PLANET_LABEL_PLACEMENT',
    direction,
    tangentRight,
    tangentUp,
    tangentOffset,
    anchor,
    presentationDistanceMeters: PLANET_LABEL_PRESENTATION_DISTANCE_METERS,
    scaleMeters: getPlanetLabelScaleDefinition(scale).dimensionsMeters,
  });
}

export function createPlanetLabelTexture(
  text: string,
  canvasFactory: PlanetLabelCanvasFactory = () => document.createElement('canvas'),
): PlanetLabelTextureResult {
  if (text.trim().length === 0) {
    return Object.freeze({ kind: 'INVALID_PLANET_LABEL_TEXTURE', reason: 'blank-label-text' });
  }
  try {
    const canvas = canvasFactory();
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return Object.freeze({ kind: 'INVALID_PLANET_LABEL_TEXTURE', reason: 'canvas-2d-context-unavailable' });
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(5, 13, 18, 0.68)';
    context.fillRect(4, 8, canvas.width - 8, canvas.height - 16);
    context.font = '600 58px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#e7f7ff';
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 8;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visibleAlphaPixelCount = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) visibleAlphaPixelCount += 1;
    }
    if (visibleAlphaPixelCount === 0) {
      return Object.freeze({ kind: 'INVALID_PLANET_LABEL_TEXTURE', reason: 'texture-has-no-visible-alpha' });
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.userData.labelText = text;
    texture.userData.visibleAlphaPixelCount = visibleAlphaPixelCount;
    return Object.freeze({
      kind: 'VALID_PLANET_LABEL_TEXTURE',
      texture,
      width: canvas.width,
      height: canvas.height,
      visibleAlphaPixelCount,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'INVALID_PLANET_LABEL_TEXTURE',
      reason: error instanceof Error ? error.message : 'label-texture-creation-failed',
    });
  }
}
