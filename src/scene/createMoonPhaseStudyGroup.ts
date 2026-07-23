import * as THREE from 'three';
import {
  CURRENT_MOON_IMAGE_DIAMETER_METERS,
  createMoonPhasePixels,
  MOON_PHASE_DIAL_RADIUS_METERS,
  MOON_PHASE_IMAGE_DIAMETER_METERS,
  MOON_PHASE_LABEL_SIZE_METERS,
  type MoonPhasePixelData,
  type MoonPhasePresentationModel,
} from '../presentation/moonPhasePresentation';
import {
  createPlanetLabelTexture,
  type PlanetLabelCanvasFactory,
} from '../presentation/planetLabelPresentation';

export interface MoonPhaseStudyDisplaySettings {
  readonly showDial: boolean;
  readonly showNotches: boolean;
  readonly showLabels: boolean;
  readonly showImages: boolean;
  readonly showCurrentAppearance: boolean;
  readonly showCurrentIndicator: boolean;
}

export interface MoonPhaseStudyDiagnostics {
  readonly ready: boolean;
  readonly suppressionReason?: string;
  readonly activeObjectNames: readonly string[];
  readonly textureCacheKeys: readonly string[];
  readonly canonicalTextureCount: number;
  readonly currentTextureUpdateCount: number;
  readonly geometryBuildCount: number;
  readonly perEyeMutation: false;
  readonly notchCount: number;
  readonly labelCount: number;
  readonly imageCount: number;
  readonly currentProjectedCentersNdc: Readonly<Record<string, readonly [number, number, number]>>;
  readonly currentStereoDisparityNdc?: number;
  readonly callbackErrorCount: number;
  readonly currentTexture?: {
    readonly width: number;
    readonly height: number;
    readonly visibleAlphaPixelCount: number;
    readonly illuminatedPixelCount: number;
    readonly borderPixelCount: number;
  };
}

export interface MoonPhaseStudyGroupHandle {
  readonly group: THREE.Group;
  update(model: MoonPhasePresentationModel, settings: MoonPhaseStudyDisplaySettings): void;
  clear(reason?: string): void;
  enforceVisibilityControls(): void;
  getDiagnostics(): MoonPhaseStudyDiagnostics;
  dispose(): void;
}

interface CachedTexture {
  readonly texture: THREE.DataTexture;
  readonly pixels: MoonPhasePixelData;
}

const point = (value: readonly [number, number, number]): THREE.Vector3 =>
  new THREE.Vector3(value[0], value[1], value[2]);

function createPhaseTexture(phaseDeg: number, borderStrength = 0.65): CachedTexture {
  const pixels = createMoonPhasePixels(phaseDeg, borderStrength);
  const texture = new THREE.DataTexture(
    pixels.pixels,
    pixels.width,
    pixels.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return Object.freeze({ texture, pixels });
}

function createSpriteMaterial(texture: THREE.Texture): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.96,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
}

function activeNames(root: THREE.Object3D): readonly string[] {
  const names: string[] = [];
  root.traverse((object) => {
    let visible = object.visible;
    let parent = object.parent;
    while (visible && parent) {
      visible = parent.visible;
      if (parent === root) break;
      parent = parent.parent;
    }
    const renderable = object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points ||
      object instanceof THREE.Sprite;
    if (object !== root && renderable && visible && object.name) names.push(object.name);
  });
  return Object.freeze(names.sort());
}

export function createMoonPhaseStudyGroup(
  canvasFactory?: PlanetLabelCanvasFactory,
): MoonPhaseStudyGroupHandle {
  const group = new THREE.Group();
  group.name = 'moon-phase-presentation-study';
  group.visible = false;
  const dialAnchor = new THREE.Group();
  dialAnchor.name = 'moon-phase-dial-world-anchor';
  group.add(dialAnchor);

  const ringGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 96 }, (_, index) => {
      const angle = index * 2 * Math.PI / 96;
      return new THREE.Vector3(
        Math.sin(angle) * MOON_PHASE_DIAL_RADIUS_METERS,
        Math.cos(angle) * MOON_PHASE_DIAL_RADIUS_METERS,
        0,
      );
    }),
  );
  const ringMaterial = new THREE.LineBasicMaterial({
    color: 0xaad8e8,
    transparent: true,
    opacity: 0.42,
    depthTest: false,
    depthWrite: false,
  });
  const ring = new THREE.LineLoop(ringGeometry, ringMaterial);
  ring.name = 'moon-phase-dial-ring';
  ring.renderOrder = 26;
  ring.frustumCulled = false;
  dialAnchor.add(ring);

  const notchGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 8 }, (_, index) => {
      const angle = index * Math.PI / 4;
      const radial = new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0);
      return [
        radial.clone().multiplyScalar(MOON_PHASE_DIAL_RADIUS_METERS - 0.18),
        radial.clone().multiplyScalar(MOON_PHASE_DIAL_RADIUS_METERS + 0.18),
      ];
    }).flat(),
  );
  const notchMaterial = new THREE.LineBasicMaterial({
    color: 0xe0f1f7,
    transparent: true,
    opacity: 0.7,
    depthTest: false,
    depthWrite: false,
  });
  const notches = new THREE.LineSegments(notchGeometry, notchMaterial);
  notches.name = 'moon-phase-dial-notches';
  notches.renderOrder = 27;
  notches.frustumCulled = false;
  dialAnchor.add(notches);

  const indicatorGeometry = new THREE.SphereGeometry(0.09, 8, 6);
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd27d,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
    depthWrite: false,
  });
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  indicator.name = 'moon-current-phase-indicator';
  indicator.renderOrder = 30;
  indicator.frustumCulled = false;
  dialAnchor.add(indicator);

  const canonicalTextureCache = new Map<string, CachedTexture>();
  const imageSprites: THREE.Sprite[] = [];
  const imageMaterials: THREE.SpriteMaterial[] = [];
  const labelSprites: THREE.Sprite[] = [];
  const labelMaterials: THREE.SpriteMaterial[] = [];
  const labelTextures: THREE.Texture[] = [];

  const phaseNames = [
    ['new-moon', 'New Moon', 0],
    ['waxing-crescent', 'Waxing Crescent', 45],
    ['first-quarter', 'First Quarter', 90],
    ['waxing-gibbous', 'Waxing Gibbous', 135],
    ['full-moon', 'Full Moon', 180],
    ['waning-gibbous', 'Waning Gibbous', 225],
    ['last-quarter', 'Last Quarter', 270],
    ['waning-crescent', 'Waning Crescent', 315],
  ] as const;
  for (const [id, name, angle] of phaseNames) {
    const cached = createPhaseTexture(angle);
    canonicalTextureCache.set(id, cached);
    const material = createSpriteMaterial(cached.texture);
    const sprite = new THREE.Sprite(material);
    sprite.name = `moon-phase-image-${id}`;
    sprite.scale.set(MOON_PHASE_IMAGE_DIAMETER_METERS, MOON_PHASE_IMAGE_DIAMETER_METERS, 1);
    sprite.visible = false;
    sprite.frustumCulled = false;
    sprite.renderOrder = 29;
    imageSprites.push(sprite);
    imageMaterials.push(material);
    dialAnchor.add(sprite);

    const labelTexture = createPlanetLabelTexture(name, canvasFactory);
    if (labelTexture.kind === 'VALID_PLANET_LABEL_TEXTURE') {
      const labelMaterial = createSpriteMaterial(labelTexture.texture);
      const label = new THREE.Sprite(labelMaterial);
      label.name = `moon-phase-label-${id}`;
      label.scale.set(MOON_PHASE_LABEL_SIZE_METERS[0], MOON_PHASE_LABEL_SIZE_METERS[1], 1);
      label.visible = false;
      label.frustumCulled = false;
      label.renderOrder = 30;
      labelTextures.push(labelTexture.texture);
      labelMaterials.push(labelMaterial);
      labelSprites.push(label);
      dialAnchor.add(label);
    }
  }

  let currentTexture = createPhaseTexture(0);
  let currentTextureKey = 'initial';
  const currentMaterial = createSpriteMaterial(currentTexture.texture);
  const currentAppearance = new THREE.Sprite(currentMaterial);
  currentAppearance.name = 'current-moon-appearance';
  currentAppearance.scale.set(
    CURRENT_MOON_IMAGE_DIAMETER_METERS,
    CURRENT_MOON_IMAGE_DIAMETER_METERS,
    1,
  );
  currentAppearance.visible = false;
  currentAppearance.frustumCulled = false;
  currentAppearance.renderOrder = 30;
  dialAnchor.add(currentAppearance);
  const projectedCenters = new Map<string, readonly [number, number, number]>();
  let callbackErrorCount = 0;
  const worldScratch = new THREE.Vector3();
  currentAppearance.onBeforeRender = (_renderer, _scene, camera) => {
    try {
      const mask = camera.layers.mask >>> 0;
      const eye = (mask & (1 << 1)) !== 0 && (mask & (1 << 2)) === 0
        ? 'left'
        : (mask & (1 << 2)) !== 0 && (mask & (1 << 1)) === 0 ? 'right' : 'mono';
      currentAppearance.getWorldPosition(worldScratch);
      const projected = worldScratch.clone().project(camera);
      if (![projected.x, projected.y, projected.z].every(Number.isFinite)) {
        throw new Error('non-finite-current-Moon-projection');
      }
      projectedCenters.set(eye, Object.freeze([projected.x, projected.y, projected.z]));
    } catch {
      callbackErrorCount += 1;
    }
  };

  let currentModel: MoonPhasePresentationModel | undefined;
  let currentSettings: MoonPhaseStudyDisplaySettings | undefined;
  let suppressionReason: string | undefined = 'scientific state not ready';
  let currentTextureUpdateCount = 0;
  const geometryBuildCount = 1;
  let disposed = false;

  const applyVisibility = (): void => {
    const ready = currentModel !== undefined && suppressionReason === undefined && !disposed;
    const settings = currentSettings;
    group.visible = ready && Boolean(settings && (
      settings.showDial ||
      settings.showCurrentAppearance
    ));
    ring.visible = ready && Boolean(settings?.showDial);
    notches.visible = ready && Boolean(settings?.showDial && settings.showNotches);
    indicator.visible = ready && Boolean(settings?.showDial && settings.showCurrentIndicator);
    imageSprites.forEach((sprite) => {
      sprite.visible = ready && Boolean(settings?.showDial && settings.showImages);
    });
    labelSprites.forEach((sprite) => {
      sprite.visible = ready && Boolean(settings?.showDial && settings.showLabels);
    });
    currentAppearance.visible = ready && Boolean(settings?.showCurrentAppearance);
  };

  const handle: MoonPhaseStudyGroupHandle = Object.freeze({
    group,
    update(
      model: MoonPhasePresentationModel,
      settings: MoonPhaseStudyDisplaySettings,
    ): void {
      if (disposed) return;
      const finite = [
        ...model.dialCenter,
        ...model.currentAppearanceAnchor,
        ...model.currentIndicatorPosition,
        model.presentationDistanceMeters,
        model.dialRadiusMeters,
      ].every(Number.isFinite);
      if (!finite || model.positions.length !== 8 || model.basis.orthonormalityError > 1e-8) {
        this.clear('invalid Moon phase presentation state');
        return;
      }
      currentModel = model;
      currentSettings = Object.freeze({ ...settings });
      suppressionReason = undefined;

      dialAnchor.position.copy(point(model.dialCenter));
      const basisMatrix = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(model.basis.right.x, model.basis.right.y, model.basis.right.z),
        new THREE.Vector3(model.basis.up.x, model.basis.up.y, model.basis.up.z),
        new THREE.Vector3(model.basis.normal.x, model.basis.normal.y, model.basis.normal.z),
      );
      dialAnchor.quaternion.setFromRotationMatrix(basisMatrix);
      model.positions.forEach((position, index: number) => {
        imageSprites[index]?.position.set(position.dialX, position.dialY, 0);
        const labelRadius = model.dialRadiusMeters + 0.68;
        const angle = position.phaseAngleDeg * Math.PI / 180;
        labelSprites[index]?.position.set(
          Math.sin(angle) * labelRadius,
          Math.cos(angle) * labelRadius,
          0,
        );
      });
      const indicatorAngle = model.phase.phaseLongitudeDeg * Math.PI / 180;
      indicator.position.set(
        Math.sin(indicatorAngle) * (model.dialRadiusMeters - 0.25),
        Math.cos(indicatorAngle) * (model.dialRadiusMeters - 0.25),
        0,
      );
      currentAppearance.position.set(0.58, 0.32, 0);

      if (model.currentTextureKey !== currentTextureKey) {
        const replacement = createPhaseTexture(model.phase.phaseLongitudeDeg);
        const previous = currentTexture;
        currentTexture = replacement;
        currentTextureKey = model.currentTextureKey;
        currentMaterial.map = replacement.texture;
        currentMaterial.needsUpdate = true;
        previous.texture.dispose();
        currentTextureUpdateCount += 1;
      }
      applyVisibility();
    },
    clear(reason = 'scientific state not ready'): void {
      if (disposed) return;
      currentModel = undefined;
      suppressionReason = reason;
      applyVisibility();
    },
    enforceVisibilityControls(): void {
      applyVisibility();
    },
    getDiagnostics(): MoonPhaseStudyDiagnostics {
      const left = projectedCenters.get('left');
      const right = projectedCenters.get('right');
      return Object.freeze({
        ready: currentModel !== undefined && suppressionReason === undefined,
        suppressionReason,
        activeObjectNames: activeNames(group),
        textureCacheKeys: Object.freeze([...canonicalTextureCache.keys(), currentTextureKey]),
        canonicalTextureCount: canonicalTextureCache.size,
        currentTextureUpdateCount,
        geometryBuildCount,
        perEyeMutation: false,
        notchCount: currentModel?.positions.length ?? 0,
        labelCount: labelSprites.filter((sprite) => sprite.visible).length,
        imageCount: imageSprites.filter((sprite) => sprite.visible).length,
        currentProjectedCentersNdc: Object.freeze(Object.fromEntries(projectedCenters)),
        currentStereoDisparityNdc: left && right
          ? Math.hypot(left[0] - right[0], left[1] - right[1])
          : undefined,
        callbackErrorCount,
        currentTexture: Object.freeze({
          width: currentTexture.pixels.width,
          height: currentTexture.pixels.height,
          visibleAlphaPixelCount: currentTexture.pixels.visibleAlphaPixelCount,
          illuminatedPixelCount: currentTexture.pixels.illuminatedPixelCount,
          borderPixelCount: currentTexture.pixels.borderPixelCount,
        }),
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      ringGeometry.dispose();
      ringMaterial.dispose();
      notchGeometry.dispose();
      notchMaterial.dispose();
      indicatorGeometry.dispose();
      indicatorMaterial.dispose();
      for (const cached of canonicalTextureCache.values()) cached.texture.dispose();
      for (const material of imageMaterials) material.dispose();
      for (const texture of labelTextures) texture.dispose();
      for (const material of labelMaterials) material.dispose();
      currentTexture.texture.dispose();
      currentMaterial.dispose();
    },
  });
  applyVisibility();
  return handle;
}
