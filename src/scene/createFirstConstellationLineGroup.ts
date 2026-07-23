import * as THREE from 'three';
import {
  FIRST_CONSTELLATION_CANONICAL_GEOMETRY,
  FIRST_CONSTELLATION_DATASET_METADATA,
  type FirstConstellationPresentationUpdate,
} from '../presentation/firstConstellationLinePresentation';
import { createEyePresentationLayerFilter, type EyePresentationDiagnostics, type XrViewIdentitySource } from './eyePresentationLayerFilter';
import { resolveConstellationColor } from '../presentation/color/constellationColorPolicy';
import { DEFAULT_CELESTIAL_COLOR_SETTINGS } from '../presentation/color/celestialColorModes';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.997;
const vertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  uniform vec3 uEncodedCore;
  uniform mat3 uEqjToApplication;
  uniform float uPointSize;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    vec3 encodedPosition = uEncodedCore + uEqjToApplication * position;
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(encodedPosition, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
    gl_PointSize = uPointSize;
  }
`;
const lineFragmentShader = /* glsl */ `uniform vec3 uColor; uniform float uOpacity; void main() { gl_FragColor = vec4(uColor, uOpacity); }`;
const pointFragmentShader = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  void main() { vec2 p = gl_PointCoord - vec2(0.5); if (dot(p, p) > 0.25) discard; gl_FragColor = vec4(uColor, uOpacity); }
`;

function finiteMatrix(matrix: THREE.Matrix4): boolean { return matrix.elements.every(Number.isFinite); }
function material(points = false, color = points ? 0xffe6a0 : 0xd9b7ff, opacity = points ? 0.72 : 0.42): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: points ? pointFragmentShader : lineFragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uProjectiveW: { value: 0 },
      uDrawEnabled: { value: 0 },
      uEncodedCore: { value: new THREE.Vector3() },
      uEqjToApplication: { value: new THREE.Matrix3() },
      uPointSize: { value: points ? 5 : 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

interface RenderEntry {
  readonly object: THREE.Line | THREE.Points;
  material: THREE.ShaderMaterial;
  readonly geometry: THREE.BufferGeometry;
  readonly constellationIdentifier: string;
  readonly endpointMarker: boolean;
}
export interface FirstConstellationLineDiagnostics {
  readonly datasetVersion: string;
  readonly starCount: number;
  readonly constellationCount: number;
  readonly segmentCount: number;
  readonly vertexCount: number;
  readonly activeLineObjectNames: readonly string[];
  readonly activeDrawCount: number;
  readonly suppressedObjectNames: readonly string[];
  readonly orientationUpdateCount: number;
  readonly geometryBuildCount: number;
  readonly perEyeMutation: false;
  readonly submittedObjectNames: readonly string[];
  readonly materialCount: number;
  readonly bufferCount: number;
  readonly colorMaterialUpdateCount: number;
  readonly materialCreationCount: number;
  readonly geometryHash: string;
}
export interface FirstConstellationLineGroupHandle {
  readonly group: THREE.Group;
  update(update: FirstConstellationPresentationUpdate): void;
  clear(reason?: string): void;
  enforceVisibilityControls(): void;
  applyEyePresentationViews(views?: readonly XrViewIdentitySource[], xrPresenting?: boolean): void;
  getEyePresentationDiagnostics(): EyePresentationDiagnostics;
  getDiagnostics(): FirstConstellationLineDiagnostics;
  dispose(): void;
}

export function createFirstConstellationLineGroup(reportDiagnostic: (event: string, detail: string) => void = () => undefined): FirstConstellationLineGroupHandle {
  const group = new THREE.Group();
  group.name = 'constellation-line-layer';
  group.visible = false;
  const entries: RenderEntry[] = [];
  const lineMaterials = new Map<string, THREE.ShaderMaterial>();
  const endpointMaterial = material(true);
  const groups = new Map<string, THREE.Group>();
  const modelViewScratch = new THREE.Matrix4();
  const eyeFilter = createEyePresentationLayerFilter(group);
  let disposed = false;
  let lastUpdate: FirstConstellationPresentationUpdate | undefined;
  let stateReady = false;
  let orientationUpdateCount = 0;
  let colorMaterialUpdateCount = 0;
  const geometryBuildCount = 1;
  const submitted = new Set<string>();
  const suppressed = new Set<string>();
  const report = (event: string, detail: string) => { try { reportDiagnostic(event, detail); } catch { /* bounded diagnostics only */ } };
  const lineMaterialFor = (color: number, opacity: number): THREE.ShaderMaterial => {
    const key = `${color.toString(16)}|${opacity.toFixed(3)}`;
    const existing = lineMaterials.get(key);
    if (existing) return existing;
    const created = material(false, color, opacity);
    lineMaterials.set(key, created);
    return created;
  };

  function configureDrawGuard(entry: RenderEntry): void {
    entry.object.onBeforeRender = (_renderer, _scene, camera) => {
      try {
        modelViewScratch.multiplyMatrices(camera.matrixWorldInverse, entry.object.matrixWorld);
        const valid = finiteMatrix(camera.projectionMatrix) && finiteMatrix(modelViewScratch)
          && Number.isFinite(entry.material.uniforms.uProjectiveW.value);
        entry.material.uniforms.uDrawEnabled.value = valid ? 1 : 0;
        entry.object.userData.lastDrawState = valid ? 'valid' : 'suppressed-non-finite-eye-state';
        if (valid) {
          submitted.add(entry.object.name);
          suppressed.delete(entry.object.name);
        } else {
          submitted.delete(entry.object.name);
          suppressed.add(entry.object.name);
        }
      } catch (error) {
        entry.material.uniforms.uDrawEnabled.value = 0;
        entry.object.userData.lastDrawState = 'suppressed-callback-error';
        suppressed.add(entry.object.name);
        report('constellation-line.callback-suppressed', `${entry.object.name}|${error instanceof Error ? error.message : String(error)}`);
      }
    };
  }

  for (const figure of FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures) {
    const figureGroup = new THREE.Group();
    figureGroup.name = `constellation-${figure.identifier.toLowerCase()}`;
    groups.set(figure.identifier, figureGroup);
    group.add(figureGroup);
    for (const segment of figure.segments) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(segment.directions.flatMap((direction) => [Math.fround(direction.x), Math.fround(direction.y), Math.fround(direction.z)]), 3));
      const lineMaterial = lineMaterialFor(0xd9b7ff, 0.42);
      const line = new THREE.Line(geometry, lineMaterial);
      line.name = segment.name;
      line.frustumCulled = false;
      line.renderOrder = 23;
      line.userData.segment = segment;
      const entry = { object: line, material: lineMaterial, geometry, constellationIdentifier: figure.identifier, endpointMarker: false } as const;
      configureDrawGuard(entry);
      entries.push(entry);
      figureGroup.add(line);
    }
    const endpointGeometry = new THREE.BufferGeometry();
    endpointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(figure.starDirections.flatMap(({ direction }) => [Math.fround(direction.x), Math.fround(direction.y), Math.fround(direction.z)]), 3));
    const endpoints = new THREE.Points(endpointGeometry, endpointMaterial);
    endpoints.name = `constellation-${figure.identifier.toLowerCase()}-endpoint-markers`;
    endpoints.frustumCulled = false;
    endpoints.renderOrder = 24;
    const endpointEntry = { object: endpoints, material: endpointMaterial, geometry: endpointGeometry, constellationIdentifier: figure.identifier, endpointMarker: true } as const;
    configureDrawGuard(endpointEntry);
    entries.push(endpointEntry);
    figureGroup.add(endpoints);
  }

  function enforce(): void {
    const update = lastUpdate;
    if (!update) { group.visible = false; return; }
    const ready = stateReady && update.settings.studyEnabled && update.settings.masterVisible;
    group.visible = ready;
    for (const [identifier, figureGroup] of groups) {
      figureGroup.visible = ready && update.settings.enabledConstellations.has(identifier as never);
    }
    for (const entry of entries) {
      const enabled = ready && update.settings.enabledConstellations.has(entry.constellationIdentifier as never);
      entry.object.visible = enabled && (!entry.endpointMarker || update.settings.showEndpointMarkers);
      if (!entry.object.visible) submitted.delete(entry.object.name);
    }
  }

  return Object.freeze({
    group,
    update(update: FirstConstellationPresentationUpdate): void {
      if (disposed) return;
      const values = [...update.orientationRows.flat(), update.structure.earthCore.x, update.structure.earthCore.y, update.structure.earthCore.z, update.structure.celestialEquatorDisplayRadiusMeters];
      const valid = update.structure.validity === 'VALIDATED' && values.every(Number.isFinite) && update.structure.celestialEquatorDisplayRadiusMeters > 0;
      lastUpdate = update;
      if (!valid) { this.clear('non-finite or invalid shared orientation'); return; }
      stateReady = true;
      suppressed.clear();
      orientationUpdateCount += 1;
      const inverseRadius = 1 / update.structure.celestialEquatorDisplayRadiusMeters;
      const rotation = new THREE.Matrix3().set(
        update.orientationRows[0][0], update.orientationRows[0][1], update.orientationRows[0][2],
        update.orientationRows[1][0], update.orientationRows[1][1], update.orientationRows[1][2],
        update.orientationRows[2][0], update.orientationRows[2][1], update.orientationRows[2][2],
      );
      for (const entry of entries) {
        if (entry.endpointMarker) {
          entry.material = endpointMaterial;
          entry.object.material = endpointMaterial;
        } else {
          const style = resolveConstellationColor(
            entry.constellationIdentifier as Parameters<typeof resolveConstellationColor>[0],
            update.settings.colorMode ?? DEFAULT_CELESTIAL_COLOR_SETTINGS.constellationMode,
            update.settings.colorStrength ?? DEFAULT_CELESTIAL_COLOR_SETTINGS.constellationStrength,
            update.settings.selectedLearningGroup,
          );
          const styleKey = `${style.token.id}|${style.opacity.toFixed(3)}|${style.role}|${style.colorSource}`;
          if (entry.object.userData.colorStyleKey !== styleKey) {
            const styledMaterial = lineMaterialFor(style.token.hex, style.opacity);
            entry.material = styledMaterial;
            entry.object.material = styledMaterial;
            entry.object.userData.colorToken = style.token.id;
            entry.object.userData.colorRole = style.role;
            entry.object.userData.colorSource = style.colorSource;
            entry.object.userData.colorStyleKey = styleKey;
            colorMaterialUpdateCount += 1;
          }
        }
        entry.material.uniforms.uProjectiveW.value = Math.fround(inverseRadius);
        entry.material.uniforms.uEncodedCore.value.set(
          Math.fround(update.structure.earthCore.x * inverseRadius),
          Math.fround(update.structure.earthCore.y * inverseRadius),
          Math.fround(update.structure.earthCore.z * inverseRadius),
        );
        entry.material.uniforms.uEqjToApplication.value.copy(rotation);
        entry.material.uniforms.uDrawEnabled.value = 1;
      }
      enforce();
      group.userData.catalogFrame = 'EQJ_J2000';
      group.userData.datasetSource = FIRST_CONSTELLATION_DATASET_METADATA.starCoordinateSource;
      group.userData.datasetLicense = FIRST_CONSTELLATION_DATASET_METADATA.license;
      group.userData.geometryRebuildCount = geometryBuildCount;
      group.userData.perEyeMutation = false;
    },
    clear(reason = 'not ready'): void {
      stateReady = false;
      group.visible = false;
      entries.forEach((entry) => { entry.object.visible = false; entry.material.uniforms.uDrawEnabled.value = 0; suppressed.add(entry.object.name); });
      group.userData.suppressionReason = reason;
      report('constellation-line.layer-suppressed', reason);
    },
    enforceVisibilityControls(): void { enforce(); },
    applyEyePresentationViews(views: readonly XrViewIdentitySource[] | undefined, xrPresenting = false): void { eyeFilter.applyViews(views, xrPresenting); },
    getEyePresentationDiagnostics(): EyePresentationDiagnostics { return eyeFilter.diagnostics; },
    getDiagnostics(): FirstConstellationLineDiagnostics {
      const active = entries.filter((entry) => entry.object.visible && !entry.endpointMarker).map((entry) => entry.object.name);
      return Object.freeze({
        datasetVersion: FIRST_CONSTELLATION_DATASET_METADATA.version,
        starCount: FIRST_CONSTELLATION_CANONICAL_GEOMETRY.starCount,
        constellationCount: FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures.length,
        segmentCount: FIRST_CONSTELLATION_CANONICAL_GEOMETRY.segmentCount,
        vertexCount: FIRST_CONSTELLATION_CANONICAL_GEOMETRY.vertexCount,
        activeLineObjectNames: Object.freeze(active),
        activeDrawCount: active.length,
        suppressedObjectNames: Object.freeze([...suppressed]),
        orientationUpdateCount,
        geometryBuildCount,
        perEyeMutation: false,
        submittedObjectNames: Object.freeze([...submitted]),
        materialCount: lineMaterials.size + 1,
        bufferCount: entries.length,
        colorMaterialUpdateCount,
        materialCreationCount: lineMaterials.size + 1,
        geometryHash: FIRST_CONSTELLATION_CANONICAL_GEOMETRY.figures
          .flatMap((figure) => figure.segments.map((segment) => `${segment.name}:${segment.directions.length}`))
          .join('|'),
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      eyeFilter.dispose();
      entries.forEach((entry) => { entry.object.onBeforeRender = () => undefined; entry.geometry.dispose(); });
      endpointMaterial.dispose();
      lineMaterials.forEach((value) => value.dispose());
      group.removeFromParent();
      group.clear();
    },
  });
}
