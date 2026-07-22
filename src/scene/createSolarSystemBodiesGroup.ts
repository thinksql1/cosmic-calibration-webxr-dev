import * as THREE from 'three';
import {
  SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES,
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type ObserverRelativeBody,
} from '../science/astronomy/types';
import type { SolarSystemBodyPresentationModel } from '../presentation/solarSystemBodyPresentationModel';
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
const labelVertexShader = /* glsl */ `
  uniform vec3 uDirection; uniform vec2 uOffsetNdc; varying vec2 vUv;
  void main() {
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(uDirection, 0.0);
    clipPosition.xy += uOffsetNdc * clipPosition.w;
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition; vUv = uv;
  }
`;
const labelFragmentShader = /* glsl */ `
  uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv;
  void main() { vec4 sampled = texture2D(uMap, vUv); gl_FragColor = vec4(sampled.rgb, sampled.a * uOpacity); }
`;

function markerMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader: markerVertexShader, fragmentShader: markerFragmentShader,
    uniforms: { uOpacity: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}
function labelTexture(text: string): THREE.Texture | undefined {
  try {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const context = canvas.getContext('2d'); if (!context) return undefined;
    context.font = '600 28px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = '#d9edf4'; context.shadowColor = 'rgba(0,0,0,0.72)'; context.shadowBlur = 6;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  } catch { return undefined; }
}
function bodyName(body: ObserverRelativeBody): string { return `apparent-${body.toLowerCase()}-marker`; }
function labelName(body: string): string { return `apparent-${body.toLowerCase()}-label`; }

export interface SolarSystemBodiesDiagnostics {
  readonly activeMarkerObjectNames: readonly string[];
  readonly activeLabelObjectNames: readonly string[];
  readonly suppressedMarkerObjectNames: readonly string[];
  readonly suppressedLabelObjectNames: readonly string[];
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
 * Owns immutable projective marker and label objects. Native Three.js model-view
 * and projection matrices resolve each XR eye; no shared geometry or uniforms
 * are changed during rendering.
 */
export function createSolarSystemBodiesGroup(): SolarSystemBodiesGroupHandle {
  const group = new THREE.Group(); group.name = 'actual-apparent-solar-system-body-directions'; group.visible = false;
  const markers = new Map<ObserverRelativeBody, THREE.Points>();
  const labels = new Map<string, THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>();
  const ownedTextures: THREE.Texture[] = []; let currentModel: SolarSystemBodyPresentationModel | undefined; let disposed = false;
  let diagnostics: SolarSystemBodiesDiagnostics = Object.freeze({ activeMarkerObjectNames: Object.freeze([]), activeLabelObjectNames: Object.freeze([]), suppressedMarkerObjectNames: Object.freeze([]), suppressedLabelObjectNames: Object.freeze([]) });
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
    const texture = labelTexture(body === 'Pluto' ? 'Pluto (dwarf planet)' : body);
    if (!texture) continue;
    ownedTextures.push(texture);
    const material = new THREE.ShaderMaterial({ vertexShader: labelVertexShader, fragmentShader: labelFragmentShader,
      uniforms: { uDirection: { value: new THREE.Vector3(0, 0, -1) }, uOffsetNdc: { value: new THREE.Vector2() }, uMap: { value: texture }, uOpacity: { value: 0.88 } },
      transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); label.name = labelName(body); label.visible = false; label.frustumCulled = false; label.renderOrder = 25;
    label.userData.body = body; label.userData.projectiveW = 0; group.add(label); labels.set(body, label);
  }

  const refreshDiagnostics = (): void => {
    diagnostics = Object.freeze({
      activeMarkerObjectNames: Object.freeze([...markers.values()].filter((object) => object.visible).map((object) => object.name)),
      activeLabelObjectNames: Object.freeze([...labels.values()].filter((object) => object.visible).map((object) => object.name)),
      suppressedMarkerObjectNames: Object.freeze([...suppressedMarkers]),
      suppressedLabelObjectNames: Object.freeze([...new Set([...SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES.filter((body) => !labels.has(body)).map(labelName), ...suppressedLabels])]),
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
        const object = labels.get(labelModel.body); if (!object) continue;
        const valid = [labelModel.directionApplication.x, labelModel.directionApplication.y, labelModel.directionApplication.z, labelModel.offsetNdc[0], labelModel.offsetNdc[1]]
          .every(Number.isFinite);
        if (!valid) {
          object.visible = false; object.userData.controlVisible = false; suppressedLabels.add(object.name); continue;
        }
        (object.material.uniforms.uDirection.value as THREE.Vector3).set(labelModel.directionApplication.x, labelModel.directionApplication.y, labelModel.directionApplication.z);
        (object.material.uniforms.uOffsetNdc.value as THREE.Vector2).set(labelModel.offsetNdc[0], labelModel.offsetNdc[1]);
        object.userData.controlVisible = model.visible && labelModel.visible;
        object.visible = object.userData.controlVisible;
      }
      group.visible = model.visible; group.userData.provenance = model.provenance; group.userData.bodyCacheKey = model.snapshotIdentity.bodyCacheKey; refreshDiagnostics();
    },
    clear() { currentModel = undefined; group.visible = false; suppressedMarkers.clear(); suppressedLabels.clear(); [...markers.values(), ...labels.values()].forEach((object) => { object.visible = false; object.userData.controlVisible = false; }); refreshDiagnostics(); },
    enforceVisibilityControls() {
      if (!currentModel?.visible) group.visible = false;
      [...markers.values(), ...labels.values()].forEach((object) => {
        if (object.userData.controlVisible !== true) object.visible = false;
      });
      refreshDiagnostics();
    },
    dispose() { if (disposed) return; disposed = true; currentModel = undefined; group.removeFromParent(); for (const object of markers.values()) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } for (const object of labels.values()) { object.geometry.dispose(); object.material.dispose(); } ownedTextures.forEach((texture) => texture.dispose()); group.clear(); },
    createFrameForCamera(camera: THREE.Camera) { if (disposed) throw new Error('Solar-system body renderer has been disposed.'); if (!currentModel) throw new Error('Solar-system body render frame is not scientifically ready.'); group.updateWorldMatrix(true, false); camera.updateWorldMatrix(true, false); return createSolarSystemBodiesCameraRelativeFrame(currentModel, group.matrixWorld, camera.matrixWorld); },
    getDiagnostics() { return diagnostics; },
  });
}
