import * as THREE from 'three';
import type { GeocentricCelestialStructurePresentation } from '../presentation/geocentricCelestialStructurePresentation';
import {
  LUNAR_TRANSIT_IMAGE_DIAMETER_METERS,
  type LunarPhaseTransitPresentation,
} from '../presentation/lunarPhaseTransitPresentation';
import {
  createMoonPhaseLabelTexture,
  moonPhaseLabelWorldSize,
} from '../presentation/moonPhaseLabels';
import type { PlanetLabelCanvasFactory } from '../presentation/planetLabelPresentation';
import type { MoonPhaseTextureCache } from './moonPhaseTextureCache';
import { lunarSemanticPalette } from '../presentation/color/lunarColorPolicy';
import type { LunarPalette } from '../presentation/color/celestialColorModes';

const CLIP_DEPTH = 0.996;
const vertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  uniform vec3 uEncodedCore;
  uniform mat3 uEqjToApplication;
  varying float vUp;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec3 appDirection = uEqjToApplication * position;
    vUp = appDirection.y;
    vec3 encodedPosition = uEncodedCore + appDirection;
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(encodedPosition, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH.toFixed(3)};
    gl_Position = clipPosition;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHemisphere;
  varying float vUp;
  void main() {
    if (uHemisphere > 0.5 && vUp < 0.0) discard;
    if (uHemisphere < -0.5 && vUp >= 0.0) discard;
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

function shaderMaterial(color: number, opacity: number, hemisphere: -1 | 0 | 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uHemisphere: { value: hemisphere },
      uProjectiveW: { value: 0 },
      uDrawEnabled: { value: 0 },
      uEncodedCore: { value: new THREE.Vector3() },
      uEqjToApplication: { value: new THREE.Matrix3() },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function spriteMaterial(texture: THREE.Texture): THREE.SpriteMaterial {
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
    if (
      object.visible
      && object.name
      && (
        object instanceof THREE.Line
        || object instanceof THREE.LineSegments
        || object instanceof THREE.Sprite
        || object instanceof THREE.Mesh
      )
    ) names.push(object.name);
  });
  return Object.freeze(names.sort());
}

export interface LunarPhaseTransitDiagnostics {
  readonly ready: boolean;
  readonly suppressionReason?: string;
  readonly activeObjectNames: readonly string[];
  readonly geometryBuildCount: number;
  readonly orientationUpdateCount: number;
  readonly perEyeMutation: false;
  readonly providerSampleCount: number;
  readonly renderedVertexCount: number;
  readonly aboveHorizonCount: number;
  readonly earthHiddenCount: number;
  readonly maximumAngularSpacingDeg: number;
  readonly closureErrorDeg: number;
  readonly notchCount: number;
  readonly imageCount: number;
  readonly labelCount: number;
  readonly textureCacheSize: number;
  readonly currentPathErrorDeg?: number;
  readonly callbackErrorCount: number;
  readonly spriteShapeEvidence: readonly {
    readonly name: string;
    readonly parent: string;
    readonly localScale: readonly [number, number, number];
    readonly worldScale: readonly [number, number, number];
    readonly aspectRatio: number;
    readonly textureDimensions?: readonly [number, number];
    readonly shearError: number;
  }[];
  readonly currentProjectedCentersNdc: Readonly<Record<string, readonly [number, number, number]>>;
  readonly currentStereoDisparityNdc?: number;
  readonly colorTokens: Readonly<Record<string, string>>;
  readonly geometryHash: string;
}

export interface LunarPhaseTransitGroupHandle {
  readonly group: THREE.Group;
  update(
    model: LunarPhaseTransitPresentation,
    structure: GeocentricCelestialStructurePresentation,
  ): void;
  clear(reason?: string): void;
  enforceVisibilityControls(): void;
  setLunarPalette(palette: LunarPalette): void;
  getDiagnostics(): LunarPhaseTransitDiagnostics;
  dispose(): void;
}

export function createLunarPhaseTransitGroup(
  textureCache: MoonPhaseTextureCache,
  canvasFactory?: PlanetLabelCanvasFactory,
): LunarPhaseTransitGroupHandle {
  const group = new THREE.Group();
  group.name = 'lunar-phase-transit-study';
  group.visible = false;
  let pathGeometry = new THREE.BufferGeometry();
  const visibleMaterial = shaderMaterial(0xcdb8ff, 0.56, 1);
  const hiddenMaterial = shaderMaterial(0x9383ba, 0.24, -1);
  const visiblePath = new THREE.Line(pathGeometry, visibleMaterial);
  visiblePath.name = 'lunar-phase-transit-visible-sky-path';
  visiblePath.renderOrder = 24;
  visiblePath.frustumCulled = false;
  const hiddenPath = new THREE.Line(pathGeometry, hiddenMaterial);
  hiddenPath.name = 'lunar-phase-transit-earth-hidden-path';
  hiddenPath.renderOrder = 24;
  hiddenPath.frustumCulled = false;
  const notchGroup = new THREE.Group();
  notchGroup.name = 'lunar-phase-transit-notches';
  // All event notches share one semantic material. Their immutable geometry and
  // per-object draw guards remain independent; no per-notch material is needed.
  const notchMaterial = shaderMaterial(0xf0e6ff, 0.82, 0);
  const notchEntries = [
    'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
    'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
  ].map((id) => {
    const geometry = new THREE.BufferGeometry();
    const line = new THREE.Line(geometry, notchMaterial);
    line.name = `lunar-transit-notch-${id}`;
    line.renderOrder = 25;
    line.frustumCulled = false;
    notchGroup.add(line);
    return { geometry, material: notchMaterial, line };
  });
  group.add(visiblePath, hiddenPath, notchGroup);

  const currentMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffe39a,
      transparent: true,
      opacity: 0.94,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  currentMarker.name = 'current-lunar-phase-transit-marker';
  currentMarker.renderOrder = 31;
  currentMarker.frustumCulled = false;
  group.add(currentMarker);

  const imageAnchors: THREE.Group[] = [];
  const imageSprites: THREE.Sprite[] = [];
  const imageMaterials: THREE.SpriteMaterial[] = [];
  const labelAnchors: THREE.Group[] = [];
  const labelSprites: (THREE.Sprite | undefined)[] = [];
  const labelMaterials: THREE.SpriteMaterial[] = [];
  const labelTextures: THREE.Texture[] = [];
  const phaseData = [
    ['new-moon', 'New Moon', 0],
    ['waxing-crescent', 'Waxing Crescent', 45],
    ['first-quarter', 'First Quarter', 90],
    ['waxing-gibbous', 'Waxing Gibbous', 135],
    ['full-moon', 'Full Moon', 180],
    ['waning-gibbous', 'Waning Gibbous', 225],
    ['last-quarter', 'Last Quarter', 270],
    ['waning-crescent', 'Waning Crescent', 315],
  ] as const;
  for (const [id, name, angle] of phaseData) {
    const imageAnchor = new THREE.Group();
    imageAnchor.name = `lunar-transit-image-anchor-${id}`;
    const imageMaterial = spriteMaterial(textureCache.get(id, angle).texture);
    const image = new THREE.Sprite(imageMaterial);
    image.name = `lunar-transit-phase-image-${id}`;
    image.scale.set(
      LUNAR_TRANSIT_IMAGE_DIAMETER_METERS,
      LUNAR_TRANSIT_IMAGE_DIAMETER_METERS,
      1,
    );
    image.frustumCulled = false;
    image.renderOrder = 29;
    imageAnchor.add(image);
    group.add(imageAnchor);
    imageAnchors.push(imageAnchor);
    imageSprites.push(image);
    imageMaterials.push(imageMaterial);

    const labelTexture = createMoonPhaseLabelTexture(name, canvasFactory);
    if (labelTexture.kind !== 'VALID_MOON_PHASE_LABEL_TEXTURE') {
      const empty = new THREE.Group();
      empty.name = `lunar-transit-label-anchor-${id}`;
      labelAnchors.push(empty);
      group.add(empty);
      labelSprites.push(undefined);
      continue;
    }
    const labelAnchor = new THREE.Group();
    labelAnchor.name = `lunar-transit-label-anchor-${id}`;
    const labelMaterial = spriteMaterial(labelTexture.texture);
    const label = new THREE.Sprite(labelMaterial);
    label.name = `lunar-transit-phase-label-${id}`;
    const labelSize = moonPhaseLabelWorldSize(labelTexture.width, labelTexture.height, 'medium');
    label.scale.set(labelSize[0], labelSize[1], 1);
    label.frustumCulled = false;
    label.renderOrder = 30;
    labelAnchor.add(label);
    group.add(labelAnchor);
    labelAnchors.push(labelAnchor);
    labelSprites.push(label);
    labelMaterials.push(labelMaterial);
    labelTextures.push(labelTexture.texture);
  }

  let currentModel: LunarPhaseTransitPresentation | undefined;
  let currentStructure: GeocentricCelestialStructurePresentation | undefined;
  let suppressionReason: string | undefined = 'scientific state not ready';
  let cacheKey = '';
  let geometryBuildCount = 0;
  let orientationUpdateCount = 0;
  let callbackErrorCount = 0;
  const projectedCenters = new Map<string, readonly [number, number, number]>();
  let disposed = false;
  let activePalette: LunarPalette = 'lunar-purple';

  const allMaterials = [
    visibleMaterial,
    hiddenMaterial,
    notchMaterial,
  ];
  const configureMaterial = (
    material: THREE.ShaderMaterial,
    model: LunarPhaseTransitPresentation,
    structure: GeocentricCelestialStructurePresentation,
  ): void => {
    const inverseRadius = 1 / structure.celestialEquatorDisplayRadiusMeters;
    material.uniforms.uProjectiveW.value = Math.fround(inverseRadius);
    material.uniforms.uEncodedCore.value.set(
      Math.fround(structure.earthCore.x * inverseRadius),
      Math.fround(structure.earthCore.y * inverseRadius),
      Math.fround(structure.earthCore.z * inverseRadius),
    );
    const rows = model.orientationRows;
    material.uniforms.uEqjToApplication.value.set(
      rows[0][0], rows[0][1], rows[0][2],
      rows[1][0], rows[1][1], rows[1][2],
      rows[2][0], rows[2][1], rows[2][2],
    );
    material.uniforms.uDrawEnabled.value = 1;
  };

  const enforce = (): void => {
    const ready = currentModel !== undefined && currentStructure !== undefined
      && suppressionReason === undefined && !disposed;
    const settings = currentModel?.settings;
    group.visible = ready && Boolean(settings && (
      settings.showPath
      || settings.showNotches
      || settings.showImages
      || settings.showLabels
      || settings.showCurrentTransit
    ));
    visiblePath.visible = ready && Boolean(settings?.showPath);
    hiddenPath.visible = ready && Boolean(settings?.showPath && settings.showEarthHiddenPath);
    notchGroup.visible = ready && Boolean(settings?.showNotches);
    notchEntries.forEach((entry, index) => {
      const phaseId = phaseData[index]?.[0];
      entry.line.visible = notchGroup.visible && Boolean(
        phaseId
        && (
          !settings?.isolatedNotchPhaseIds
          || settings.isolatedNotchPhaseIds.includes(phaseId)
        )
      );
    });
    currentMarker.visible = ready && Boolean(settings?.showCurrentTransit);
    imageSprites.forEach((sprite) => { sprite.visible = ready && Boolean(settings?.showImages); });
    labelSprites.forEach((sprite) => {
      if (sprite) sprite.visible = ready && Boolean(settings?.showLabels);
    });
  };

  const drawGuard = (object: THREE.Object3D, material: THREE.ShaderMaterial): void => {
    object.onBeforeRender = (_renderer, _scene, camera) => {
      try {
        const finite = camera.projectionMatrix.elements.every(Number.isFinite)
          && object.matrixWorld.elements.every(Number.isFinite);
        material.uniforms.uDrawEnabled.value = finite ? 1 : 0;
        if (!finite) object.userData.suppressionReason = 'non-finite eye state';
      } catch (error) {
        callbackErrorCount += 1;
        material.uniforms.uDrawEnabled.value = 0;
        object.userData.suppressionReason = error instanceof Error ? error.message : String(error);
      }
    };
  };
  drawGuard(visiblePath, visibleMaterial);
  drawGuard(hiddenPath, hiddenMaterial);
  notchEntries.forEach((entry) => drawGuard(entry.line, entry.material));
  const currentWorld = new THREE.Vector3();
  currentMarker.onBeforeRender = (_renderer, _scene, camera) => {
    try {
      const mask = camera.layers.mask >>> 0;
      const eye = (mask & (1 << 1)) !== 0 && (mask & (1 << 2)) === 0
        ? 'left'
        : (mask & (1 << 2)) !== 0 && (mask & (1 << 1)) === 0 ? 'right' : 'mono';
      currentMarker.getWorldPosition(currentWorld);
      const projected = currentWorld.clone().project(camera);
      if (![projected.x, projected.y, projected.z].every(Number.isFinite)) {
        throw new Error('non-finite current transit projection');
      }
      projectedCenters.set(eye, Object.freeze([projected.x, projected.y, projected.z]));
    } catch {
      callbackErrorCount += 1;
    }
  };

  return Object.freeze({
    group,
    update(
      model: LunarPhaseTransitPresentation,
      structure: GeocentricCelestialStructurePresentation,
    ): void {
      if (disposed) return;
      if (
        model.kind !== 'READY_LUNAR_PHASE_TRANSIT_PRESENTATION'
        || structure.validity !== 'VALIDATED'
        || model.events.length !== 8
        || !model.orientationRows.flat().every(Number.isFinite)
      ) {
        this.clear('invalid lunar phase-transit presentation');
        return;
      }
      currentModel = model;
      currentStructure = structure;
      suppressionReason = undefined;
      if (cacheKey !== model.transit.cacheKey) {
        cacheKey = model.transit.cacheKey;
        const replacementPath = new THREE.BufferGeometry();
        replacementPath.setAttribute('position', new THREE.Float32BufferAttribute(
          model.renderedEqjDirections.flatMap((direction) => [direction.x, direction.y, direction.z]),
          3,
        ));
        visiblePath.geometry = replacementPath;
        hiddenPath.geometry = replacementPath;
        pathGeometry.dispose();
        pathGeometry = replacementPath;
        model.events.forEach((event, index) => {
          const entry = notchEntries[index]!;
          const replacement = new THREE.BufferGeometry();
          replacement.setAttribute('position', new THREE.Float32BufferAttribute(
            event.notchDirectionsEqj.flatMap((direction) => [
              direction.x,
              direction.y,
              direction.z,
            ]),
            3,
          ));
          entry.line.geometry = replacement;
          entry.geometry.dispose();
          (entry as { geometry: THREE.BufferGeometry }).geometry = replacement;
        });
        geometryBuildCount += 1;
      }
      for (const material of allMaterials) configureMaterial(material, model, structure);
      orientationUpdateCount += 1;
      model.events.forEach((event, index) => {
        imageAnchors[index]?.position.set(...event.imageAnchor);
        labelAnchors[index]?.position.set(...event.labelAnchor);
        const label = labelSprites[index];
        const image = label?.material.map?.image as { width?: number; height?: number } | undefined;
        if (label && image) {
          const size = moonPhaseLabelWorldSize(
            Number(image.width),
            Number(image.height),
            model.settings.labelPreset,
          );
          label.scale.set(size[0], size[1], 1);
        }
      });
      currentMarker.position.set(...model.current.anchor);
      enforce();
    },
    clear(reason = 'scientific state not ready'): void {
      currentModel = undefined;
      currentStructure = undefined;
      suppressionReason = reason;
      for (const material of allMaterials) material.uniforms.uDrawEnabled.value = 0;
      enforce();
    },
    enforceVisibilityControls(): void {
      enforce();
    },
    setLunarPalette(palette: LunarPalette): void {
      if (activePalette === palette) return;
      activePalette = palette;
      const colors = lunarSemanticPalette(palette);
      visibleMaterial.uniforms.uColor.value.setHex(colors.transitVisible.hex);
      visibleMaterial.uniforms.uOpacity.value = colors.transitVisible.opacity;
      hiddenMaterial.uniforms.uColor.value.setHex(colors.transitHidden.hex);
      hiddenMaterial.uniforms.uOpacity.value = colors.transitHidden.opacity;
      notchMaterial.uniforms.uColor.value.setHex(colors.transitNotch.hex);
      notchMaterial.uniforms.uOpacity.value = colors.transitNotch.opacity;
      (currentMarker.material as THREE.MeshBasicMaterial).color.setHex(colors.currentTransit.hex);
      (currentMarker.material as THREE.MeshBasicMaterial).opacity = colors.currentTransit.opacity;
      group.userData.lunarPalette = palette;
    },
    getDiagnostics(): LunarPhaseTransitDiagnostics {
      group.updateWorldMatrix(true, true);
      const evidence = [...imageSprites, ...labelSprites]
        .filter((sprite): sprite is THREE.Sprite => sprite !== undefined && sprite.visible)
        .map((sprite) => {
        const worldScale = new THREE.Vector3();
        sprite.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale);
        const basisX = new THREE.Vector3().setFromMatrixColumn(sprite.matrixWorld, 0);
        const basisY = new THREE.Vector3().setFromMatrixColumn(sprite.matrixWorld, 1);
        const shearError = Math.abs(basisX.normalize().dot(basisY.normalize()));
        return Object.freeze({
          name: sprite.name,
          parent: sprite.parent?.name ?? 'none',
          localScale: Object.freeze([sprite.scale.x, sprite.scale.y, sprite.scale.z] as const),
          worldScale: Object.freeze([worldScale.x, worldScale.y, worldScale.z] as const),
          aspectRatio: worldScale.x / worldScale.y,
          textureDimensions: sprite.material.map?.image
            ? Object.freeze([
                Number((sprite.material.map.image as { width?: number }).width),
                Number((sprite.material.map.image as { height?: number }).height),
              ] as const)
            : undefined,
          shearError,
        });
        });
      const left = projectedCenters.get('left');
      const right = projectedCenters.get('right');
      return Object.freeze({
        ready: currentModel !== undefined && suppressionReason === undefined,
        suppressionReason,
        activeObjectNames: activeNames(group),
        geometryBuildCount,
        orientationUpdateCount,
        perEyeMutation: false,
        providerSampleCount: currentModel?.diagnostics.providerSampleCount ?? 0,
        renderedVertexCount: currentModel?.diagnostics.renderedVertexCount ?? 0,
        aboveHorizonCount: currentModel?.diagnostics.aboveHorizonCount ?? 0,
        earthHiddenCount: currentModel?.diagnostics.earthHiddenCount ?? 0,
        maximumAngularSpacingDeg: currentModel?.diagnostics.maximumRenderedAngularSpacingDeg ?? 0,
        closureErrorDeg: currentModel?.diagnostics.closureErrorDeg ?? 0,
        notchCount: currentModel?.events.length ?? 0,
        imageCount: imageSprites.filter((sprite) => sprite.visible).length,
        labelCount: labelSprites.filter((sprite) => sprite?.visible).length,
        textureCacheSize: textureCache.size,
        currentPathErrorDeg: currentModel?.current.pathErrorDeg,
        callbackErrorCount,
        spriteShapeEvidence: Object.freeze(evidence),
        currentProjectedCentersNdc: Object.freeze(Object.fromEntries(projectedCenters)),
        currentStereoDisparityNdc: left && right
          ? Math.hypot(left[0] - right[0], left[1] - right[1])
          : undefined,
        colorTokens: Object.freeze({
          visible: lunarSemanticPalette(activePalette).transitVisible.id,
          hidden: lunarSemanticPalette(activePalette).transitHidden.id,
          notch: lunarSemanticPalette(activePalette).transitNotch.id,
          current: lunarSemanticPalette(activePalette).currentTransit.id,
          nextPhase: lunarSemanticPalette(activePalette).nextPhase.id,
        }),
        geometryHash: `${pathGeometry.getAttribute('position').count}:${pathGeometry.drawRange.count}|${notchEntries.map((entry) => entry.geometry.getAttribute('position').count).join(',')}`,
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      visiblePath.onBeforeRender = () => undefined;
      hiddenPath.onBeforeRender = () => undefined;
      notchEntries.forEach((entry) => { entry.line.onBeforeRender = () => undefined; });
      currentMarker.onBeforeRender = () => undefined;
      pathGeometry.dispose();
      visibleMaterial.dispose();
      hiddenMaterial.dispose();
      notchEntries.forEach((entry) => entry.geometry.dispose());
      notchMaterial.dispose();
      currentMarker.geometry.dispose();
      (currentMarker.material as THREE.Material).dispose();
      imageMaterials.forEach((material) => material.dispose());
      labelMaterials.forEach((material) => material.dispose());
      labelTextures.forEach((texture) => texture.dispose());
      group.removeFromParent();
      group.clear();
    },
  });
}
