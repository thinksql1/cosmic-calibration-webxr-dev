import * as THREE from 'three';
import type { ApplicationBasisDirection } from '../presentation/mapEnuToApplicationBasis';
import {
  createPlanetLabelPlacement,
  createPlanetLabelTexture,
  DEFAULT_PLANET_LABEL_SCALE,
  type PlanetLabelCanvasFactory,
  type PlanetLabelPlacement,
  type PlanetLabelScale,
  type PlanetLabelTexture,
} from '../presentation/planetLabelPresentation';

export interface PlanetLabelSpriteDiagnostics {
  readonly objectCreated: boolean;
  readonly textureWidth: number;
  readonly textureHeight: number;
  readonly visibleAlphaPixelCount: number;
  readonly materialType: string;
  readonly opacity: number;
  readonly transparent: boolean;
  readonly depthTest: boolean;
  readonly depthWrite: boolean;
  readonly renderOrder: number;
  readonly frustumCulled: boolean;
  readonly worldScale: readonly [number, number, number];
  readonly placement?: PlanetLabelPlacement;
  readonly projectedCentersNdc: Readonly<Record<string, readonly [number, number, number]>>;
  readonly stereoDisparityNdc?: number;
  readonly cameraDistanceMeters?: number;
  readonly renderCallbackCount: number;
  readonly callbackErrorCount: number;
  readonly suppressionReason?: string;
}

export interface PlanetLabelSpriteHandle {
  readonly sprite: THREE.Sprite;
  update(direction: ApplicationBasisDirection, scale?: PlanetLabelScale): PlanetLabelPlacement | undefined;
  suppress(reason: string): void;
  getDiagnostics(): PlanetLabelSpriteDiagnostics;
  dispose(): void;
}

export interface InvalidPlanetLabelSprite {
  readonly kind: 'INVALID_PLANET_LABEL_SPRITE';
  readonly reason: string;
}

export type PlanetLabelSpriteResult =
  | { readonly kind: 'VALID_PLANET_LABEL_SPRITE'; readonly handle: PlanetLabelSpriteHandle }
  | InvalidPlanetLabelSprite;

export function createPlanetLabelSprite(
  name: string,
  text: string,
  canvasFactory?: PlanetLabelCanvasFactory,
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): PlanetLabelSpriteResult {
  const textureResult = createPlanetLabelTexture(text, canvasFactory);
  if (textureResult.kind !== 'VALID_PLANET_LABEL_TEXTURE') {
    return Object.freeze({ kind: 'INVALID_PLANET_LABEL_SPRITE', reason: textureResult.reason });
  }
  const texture: PlanetLabelTexture = textureResult;
  const material = new THREE.SpriteMaterial({
    map: texture.texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.94,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = name;
  sprite.visible = false;
  sprite.frustumCulled = false;
  sprite.renderOrder = 29;
  sprite.userData.finitePresentation = true;
  sprite.userData.cameraParented = false;
  sprite.userData.eyeParented = false;
  let placement: PlanetLabelPlacement | undefined;
  let suppressionReason: string | undefined;
  let disposed = false;
  const projectedCenters = new Map<string, readonly [number, number, number]>();
  let cameraDistanceMeters: number | undefined;
  let renderCallbackCount = 0;
  let callbackErrorCount = 0;
  const worldScratch = new THREE.Vector3();

  sprite.onBeforeRender = (_renderer, _scene, camera) => {
    try {
      const mask = camera.layers.mask >>> 0;
      const eye = (mask & (1 << 1)) !== 0 && (mask & (1 << 2)) === 0
        ? 'left'
        : (mask & (1 << 2)) !== 0 && (mask & (1 << 1)) === 0 ? 'right' : 'mono';
      sprite.getWorldPosition(worldScratch);
      cameraDistanceMeters = worldScratch.distanceTo(camera.getWorldPosition(new THREE.Vector3()));
      const ndc = worldScratch.clone().project(camera);
      if (![ndc.x, ndc.y, ndc.z, cameraDistanceMeters].every(Number.isFinite)) {
        throw new Error('non-finite-label-projection');
      }
      projectedCenters.set(eye, Object.freeze([ndc.x, ndc.y, ndc.z]));
      renderCallbackCount += 1;
    } catch (error) {
      callbackErrorCount += 1;
      try {
        reportDiagnostic('planet-label.projection-diagnostic', `object=${name}|reason=${error instanceof Error ? error.message : 'unknown'}`);
      } catch { /* diagnostic transport must not abort rendering */ }
    }
  };

  const diagnostics = (): PlanetLabelSpriteDiagnostics => {
    const left = projectedCenters.get('left');
    const right = projectedCenters.get('right');
    const worldScale = sprite.getWorldScale(new THREE.Vector3());
    return Object.freeze({
    objectCreated: true,
    textureWidth: texture.width,
    textureHeight: texture.height,
    visibleAlphaPixelCount: texture.visibleAlphaPixelCount,
    materialType: material.type,
    opacity: material.opacity,
    transparent: material.transparent,
    depthTest: material.depthTest,
    depthWrite: material.depthWrite,
    renderOrder: sprite.renderOrder,
    frustumCulled: sprite.frustumCulled,
    worldScale: Object.freeze([worldScale.x, worldScale.y, worldScale.z] as [number, number, number]),
    placement,
    projectedCentersNdc: Object.freeze(Object.fromEntries(projectedCenters)),
    stereoDisparityNdc: left && right ? Math.hypot(left[0] - right[0], left[1] - right[1]) : undefined,
    cameraDistanceMeters,
    renderCallbackCount,
    callbackErrorCount,
    suppressionReason,
    });
  };

  const handle: PlanetLabelSpriteHandle = Object.freeze({
    sprite,
    update(direction: ApplicationBasisDirection, scale: PlanetLabelScale = DEFAULT_PLANET_LABEL_SCALE) {
      if (disposed) return undefined;
      const result = createPlanetLabelPlacement(direction, scale);
      if (result.kind !== 'VALID_PLANET_LABEL_PLACEMENT') {
        sprite.visible = false;
        suppressionReason = result.reason;
        placement = undefined;
        return undefined;
      }
      sprite.position.copy(result.anchor);
      sprite.scale.set(result.scaleMeters[0], result.scaleMeters[1], 1);
      sprite.updateMatrix();
      placement = result;
      suppressionReason = undefined;
      return result;
    },
    suppress(reason: string) {
      sprite.visible = false;
      suppressionReason = reason;
    },
    getDiagnostics: diagnostics,
    dispose() {
      if (disposed) return;
      disposed = true;
      sprite.removeFromParent();
      texture.texture.dispose();
      material.dispose();
    },
  });
  return Object.freeze({ kind: 'VALID_PLANET_LABEL_SPRITE', handle });
}
