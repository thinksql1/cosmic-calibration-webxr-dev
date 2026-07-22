import * as THREE from 'three';
import {
  SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES,
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type ObserverRelativeBody,
  type SupportedPlanetBody,
} from '../science/astronomy/types';
import type { SolarSystemBodyPresentationModel } from '../presentation/solarSystemBodyPresentationModel';
import type { PlanetLabelCanvasFactory } from '../presentation/planetLabelPresentation';
import {
  createPlanetLabelSprite,
  type PlanetLabelSpriteDiagnostics,
  type PlanetLabelSpriteHandle,
} from './createPlanetLabelSprite';
import {
  createSolarSystemBodiesCameraRelativeFrame,
  type SolarSystemBodiesCameraRelativeFrame,
} from './solarSystemBodiesCameraRelativeFrame';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.997;

const markerVertexShader = /* glsl */ `
  attribute vec3 aColor; attribute float aPointSize; attribute float aOpacity;
  varying vec3 vColor; varying float vOpacity;
  void main() {
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 0.0);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition; gl_PointSize = aPointSize; vColor = aColor; vOpacity = aOpacity;
  }
`;
const markerFragmentShader = /* glsl */ `
  uniform float uOpacity; varying vec3 vColor; varying float vOpacity;
  void main() { vec2 c = gl_PointCoord - vec2(0.5); if (dot(c, c) > 0.25) discard; gl_FragColor = vec4(vColor, uOpacity * vOpacity); }
`;
function markerMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader: markerVertexShader, fragmentShader: markerFragmentShader,
    uniforms: { uOpacity: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}
function bodyName(body: ObserverRelativeBody): string { return `apparent-${body.toLowerCase()}-marker`; }
function labelName(body: string): string { return `apparent-${body.toLowerCase()}-label`; }

export interface SolarSystemBodiesDiagnostics {
  readonly activeMarkerObjectNames: readonly string[];
  readonly activeLabelObjectNames: readonly string[];
  readonly suppressedMarkerObjectNames: readonly string[];
  readonly suppressedLabelObjectNames: readonly string[];
  readonly configuredLabelObjectNames: readonly string[];
  readonly submittedLabelObjectNames: readonly string[];
  readonly renderedLabelObjectNames: readonly string[];
  readonly labelDetails: Readonly<Record<string, PlanetLabelSpriteDiagnostics>>;
}
export interface SolarSystemBodiesGroupHandle {
  readonly group: THREE.Group;
  update(model: SolarSystemBodyPresentationModel): void;
  clear(): void;
  /** Reapplies user feature gates after diagnostics isolate a descendant. */
  enforceVisibilityControls(): void;
  dispose(): void;
  createFrameForCamera(camera: THREE.Camera): SolarSystemBodiesCameraRelativeFrame;
  getDiagnostics(): SolarSystemBodiesDiagnostics;
}

/**
 * Owns immutable projective markers and finite world-anchored label sprites.
 * Native Three.js model-view and projection matrices resolve each XR eye; no
 * shared geometry or transforms are changed during rendering.
 */
export function createSolarSystemBodiesGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
  labelCanvasFactory?: PlanetLabelCanvasFactory,
): SolarSystemBodiesGroupHandle {
  const group = new THREE.Group(); group.name = 'actual-apparent-solar-system-body-directions'; group.visible = false;
  const markers = new Map<ObserverRelativeBody, THREE.Points>();
  const labels = new Map<SupportedPlanetBody, PlanetLabelSpriteHandle>();
  let currentModel: SolarSystemBodyPresentationModel | undefined; let disposed = false;
  let diagnostics: SolarSystemBodiesDiagnostics = Object.freeze({ activeMarkerObjectNames: Object.freeze([]), activeLabelObjectNames: Object.freeze([]), suppressedMarkerObjectNames: Object.freeze([]), suppressedLabelObjectNames: Object.freeze([]), configuredLabelObjectNames: Object.freeze([]), submittedLabelObjectNames: Object.freeze([]), renderedLabelObjectNames: Object.freeze([]), labelDetails: Object.freeze({}) });
  const suppressedMarkers = new Set<string>(); const suppressedLabels = new Set<string>();

  for (const body of SUPPORTED_SOLAR_SYSTEM_BODIES) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1], 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute([1, 1, 1], 3));
    geometry.setAttribute('aPointSize', new THREE.Float32BufferAttribute([1], 1));
    geometry.setAttribute('aOpacity', new THREE.Float32BufferAttribute([0], 1));
    const points = new THREE.Points(geometry, markerMaterial()); points.name = bodyName(body); points.visible = false; points.frustumCulled = false; points.renderOrder = 24;
    points.userData.body = body; points.userData.projectiveW = 0; group.add(points); markers.set(body, points);
  }
  for (const body of SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES) {
    const result = createPlanetLabelSprite(labelName(body), body === 'Pluto' ? 'Pluto (dwarf planet)' : body, labelCanvasFactory, reportDiagnostic);
    if (result.kind !== 'VALID_PLANET_LABEL_SPRITE') {
      suppressedLabels.add(labelName(body));
      try { reportDiagnostic('planet-label.suppressed', `object=${labelName(body)}|reason=${result.reason}`); } catch { /* diagnostic transport is non-blocking */ }
      continue;
    }
    result.handle.sprite.userData.body = body;
    result.handle.sprite.userData.presentationDistanceMeters = 24;
    group.add(result.handle.sprite);
    labels.set(body, result.handle);
  }

  const refreshDiagnostics = (): void => {
    diagnostics = Object.freeze({
      activeMarkerObjectNames: Object.freeze([...markers.values()].filter((object) => object.visible).map((object) => object.name)),
      activeLabelObjectNames: Object.freeze([...labels.values()].filter(({ sprite }) => sprite.visible).map(({ sprite }) => sprite.name)),
      suppressedMarkerObjectNames: Object.freeze([...suppressedMarkers]),
      suppressedLabelObjectNames: Object.freeze([...new Set([...SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES.filter((body) => !labels.has(body)).map(labelName), ...suppressedLabels])]),
      configuredLabelObjectNames: Object.freeze(currentModel?.labels.filter((label) => label.visible).map((label) => labelName(label.body)) ?? []),
      submittedLabelObjectNames: Object.freeze([...labels.values()].filter(({ sprite }) => sprite.visible && sprite.parent === group).map(({ sprite }) => sprite.name)),
      renderedLabelObjectNames: Object.freeze([...labels.values()].filter((handle) => handle.getDiagnostics().renderCallbackCount > 0).map(({ sprite }) => sprite.name)),
      labelDetails: Object.freeze(Object.fromEntries([...labels.entries()].map(([body, handle]) => [body, handle.getDiagnostics()]))),
    });
  };
  return Object.freeze({
    group,
    update(model: SolarSystemBodyPresentationModel) {
      if (disposed) throw new Error('Cannot update a disposed solar-system body renderer.');
      if (model.markers.length !== SUPPORTED_SOLAR_SYSTEM_BODIES.length) throw new Error('Solar-system body renderer requires the complete supported catalog.');
      currentModel = model;
      suppressedMarkers.clear(); suppressedLabels.clear();
      for (const marker of model.markers) {
        const object = markers.get(marker.body)!; const geometry = object.geometry;
        const valid = [marker.directionApplication.x, marker.directionApplication.y, marker.directionApplication.z, marker.style.pixelDiameter, marker.style.opacity]
          .every(Number.isFinite);
        if (!valid) {
          object.visible = false; object.userData.controlVisible = false; suppressedMarkers.add(object.name); continue;
        }
        (geometry.getAttribute('position') as THREE.BufferAttribute).setXYZ(0, marker.directionApplication.x, marker.directionApplication.y, marker.directionApplication.z);
        const color = new THREE.Color(marker.style.colorHex); (geometry.getAttribute('aColor') as THREE.BufferAttribute).setXYZ(0, color.r, color.g, color.b);
        (geometry.getAttribute('aPointSize') as THREE.BufferAttribute).setX(0, marker.style.pixelDiameter);
        (geometry.getAttribute('aOpacity') as THREE.BufferAttribute).setX(0, marker.style.opacity);
        for (const attribute of Object.values(geometry.attributes)) attribute.needsUpdate = true;
        object.userData.controlVisible = model.visible && marker.visible && marker.style.opacity > 0;
        object.visible = object.userData.controlVisible;
      }
      for (const labelModel of model.labels) {
        const handle = labels.get(labelModel.body); if (!handle) continue;
        const placement = handle.update(labelModel.directionApplication, labelModel.scale);
        if (!placement) {
          handle.sprite.userData.controlVisible = false; suppressedLabels.add(handle.sprite.name); continue;
        }
        handle.sprite.userData.controlVisible = model.visible && labelModel.visible;
        handle.sprite.userData.directionApplication = labelModel.directionApplication;
        handle.sprite.userData.tangentOffset = placement.tangentOffset.toArray();
        handle.sprite.visible = handle.sprite.userData.controlVisible;
      }
      group.visible = model.visible; group.userData.provenance = model.provenance; group.userData.bodyCacheKey = model.snapshotIdentity.bodyCacheKey; refreshDiagnostics();
    },
    clear() { currentModel = undefined; group.visible = false; suppressedMarkers.clear(); suppressedLabels.clear(); [...markers.values()].forEach((object) => { object.visible = false; object.userData.controlVisible = false; }); [...labels.values()].forEach(({ sprite }) => { sprite.visible = false; sprite.userData.controlVisible = false; }); refreshDiagnostics(); },
    enforceVisibilityControls() {
      if (!currentModel?.visible) group.visible = false;
      [...markers.values(), ...[...labels.values()].map(({ sprite }) => sprite)].forEach((object) => {
        if (object.userData.controlVisible !== true) object.visible = false;
      });
      refreshDiagnostics();
    },
    dispose() { if (disposed) return; disposed = true; currentModel = undefined; group.removeFromParent(); for (const object of markers.values()) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } for (const handle of labels.values()) handle.dispose(); group.clear(); },
    createFrameForCamera(camera: THREE.Camera) { if (disposed) throw new Error('Solar-system body renderer has been disposed.'); if (!currentModel) throw new Error('Solar-system body render frame is not scientifically ready.'); group.updateWorldMatrix(true, false); camera.updateWorldMatrix(true, false); return createSolarSystemBodiesCameraRelativeFrame(currentModel, group.matrixWorld, camera.matrixWorld); },
    getDiagnostics() { refreshDiagnostics(); return diagnostics; },
  });
}
