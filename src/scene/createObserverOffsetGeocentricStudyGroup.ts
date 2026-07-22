import * as THREE from 'three';
import type {
  BoundedHomogeneousFiniteAnchor,
  ObserverOffsetGeocentricPresentation,
} from '../presentation/observerOffsetGeocentricPresentation';
import {
  selectedObserverOffsetGeoStudyComponents,
  type ObserverOffsetGeoStudySettings,
} from '../presentation/observerOffsetGeocentricStudy';

const CLIP_DEPTH_WITHOUT_DEPTH_WRITE = 0.995;
const PATCH_HALF_SIZE_METERS = 350_000;
const RADIUS_HALF_WIDTH_METERS = 45_000;

const vertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }
`;
const pointVertexShader = /* glsl */ `
  uniform float uProjectiveW;
  uniform float uDrawEnabled;
  uniform float uSizePixels;
  void main() {
    if (uDrawEnabled < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, uProjectiveW);
    if (clipPosition.w > 0.0) clipPosition.z = clipPosition.w * ${CLIP_DEPTH_WITHOUT_DEPTH_WRITE.toFixed(3)};
    gl_Position = clipPosition; gl_PointSize = uSizePixels;
  }
`;
const pointFragmentShader = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  void main() { if (dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) > 0.25) discard; gl_FragColor = vec4(uColor, uOpacity); }
`;

function material(color: number, opacity: number, point = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: point ? pointVertexShader : vertexShader,
    fragmentShader: point ? pointFragmentShader : fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity },
      uProjectiveW: { value: 1 }, uDrawEnabled: { value: 1 },
      ...(point ? { uSizePixels: { value: 13 } } : {}),
    },
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function finiteAnchor(anchor: BoundedHomogeneousFiniteAnchor | { readonly kind: 'not-ready' }): anchor is BoundedHomogeneousFiniteAnchor {
  return anchor.kind === 'FINITE_GEOCENTRIC_HOMOGENEOUS_ANCHOR';
}

function geometry(values: readonly BoundedHomogeneousFiniteAnchor[]): THREE.BufferGeometry {
  const data = new Float32Array(values.length * 3);
  values.forEach((value, index) => { data[index * 3] = value.x; data[index * 3 + 1] = value.y; data[index * 3 + 2] = value.z; });
  return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(data, 3));
}

function offset(
  contract: ObserverOffsetGeocentricPresentation,
  center: Readonly<{ x: number; y: number; z: number }>,
  eastMeters: number,
  northMeters: number,
): BoundedHomogeneousFiniteAnchor | { readonly kind: 'not-ready' } {
  const encoded = contract.encodeFiniteAnchor(Object.freeze({
    frame: 'APPLICATION_BASIS' as const, units: 'meters' as const,
    x: center.x + contract.localEast.x * eastMeters + contract.localNorth.x * northMeters,
    y: center.y + contract.localEast.y * eastMeters + contract.localNorth.y * northMeters,
    z: center.z + contract.localEast.z * eastMeters + contract.localNorth.z * northMeters,
  }));
  return encoded.kind === 'FINITE_GEOCENTRIC_HOMOGENEOUS_ANCHOR'
    ? encoded
    : Object.freeze({ kind: 'not-ready' as const });
}

export interface ObserverOffsetGeocentricStudyGroupHandle {
  readonly group: THREE.Group;
  update(contract: ObserverOffsetGeocentricPresentation, settings: ObserverOffsetGeoStudySettings): void;
  clear(): void;
  dispose(): void;
  getDiagnostics(): Readonly<Record<string, unknown>>;
}

/** Static, bounded study geometry; all eye matrices remain native Three.js state. */
export function createObserverOffsetGeocentricStudyGroup(
  reportDiagnostic: (event: string, detail: string) => void = () => undefined,
): ObserverOffsetGeocentricStudyGroupHandle {
  const group = new THREE.Group();
  group.name = 'observer-offset-geocentric-study';
  group.visible = false;
  let disposed = false;
  let sourceKey: string | undefined;
  let contract: ObserverOffsetGeocentricPresentation | undefined;
  const objects = new Map<string, THREE.Object3D>();
  const owned: Array<{ geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial }> = [];
  const report = (event: string, detail: string) => { try { reportDiagnostic(event, detail); } catch { /* diagnostics are non-blocking */ } };

  const add = (object: THREE.Object3D, geometryValue: THREE.BufferGeometry, materialValue: THREE.ShaderMaterial) => {
    object.frustumCulled = false; group.add(object); objects.set(object.name, object); owned.push({ geometry: geometryValue, material: materialValue });
  };
  const removeOwned = () => {
    objects.clear(); group.clear(); owned.forEach(({ geometry: value, material: surface }) => { value.dispose(); surface.dispose(); }); owned.length = 0;
  };
  const homogeneousMaterial = (color: number, opacity: number, point = false) => {
    const value = material(color, opacity, point); return value;
  };
  const setW = (value: THREE.ShaderMaterial, anchor: BoundedHomogeneousFiniteAnchor) => {
    value.uniforms.uProjectiveW.value = anchor.w;
  };
  const addRadius = (source: ObserverOffsetGeocentricPresentation) => {
    const a = source.referenceEarthSphereSurfaceAnchor;
    const width = RADIUS_HALF_WIDTH_METERS;
    const p0 = offset(source, source.referenceEarthSphereSurfacePoint, width, 0);
    const p1 = offset(source, source.referenceEarthSphereSurfacePoint, -width, 0);
    const p2 = offset(source, source.scientificEarthCore, -width, 0);
    const p3 = offset(source, source.scientificEarthCore, width, 0);
    const anchors = [p0, p1, p2, p3];
    if (!anchors.every(finiteAnchor)) { report('geo-study.component-suppressed', 'observer-to-earth-core-radius|invalid-anchor'); return; }
    const valid = anchors as BoundedHomogeneousFiniteAnchor[];
    const surface = homogeneousMaterial(0xe1ad76, 0.32);
    setW(surface, a);
    const mesh = new THREE.Mesh(geometry([
      a, valid[0], valid[3], a, valid[3], source.earthCoreAnchor,
      a, source.earthCoreAnchor, valid[2], a, valid[2], valid[1],
    ]), surface);
    mesh.name = 'observer-to-earth-core-radius'; mesh.userData.endpointNames = ['observer-reference-surface-marker', 'modeled-earth-core-marker'];
    mesh.userData.openSegment = true; mesh.userData.thicknessMeters = width * 2; add(mesh, mesh.geometry, surface);
  };
  const addSurfaceMarker = (source: ObserverOffsetGeocentricPresentation) => {
    const surface = homogeneousMaterial(0xffd48a, 0.72, true); setW(surface, source.referenceEarthSphereSurfaceAnchor);
    const marker = new THREE.Points(geometry([source.referenceEarthSphereSurfaceAnchor]), surface);
    marker.name = 'observer-reference-surface-marker'; marker.userData.anchor = 'referenceEarthSphereSurfaceAnchor'; add(marker, marker.geometry, surface);
  };
  const addWireframe = (source: ObserverOffsetGeocentricPresentation) => {
    const makeCircle = (name: string, directions: readonly THREE.Vector3[], opacity: number) => {
      const anchors = directions.map((d) => source.encodeOffsetFromCore(Object.freeze({ frame: 'APPLICATION_BASIS' as const, units: 'unitless' as const, x: d.x, y: d.y, z: d.z }), source.referenceEarthSphereRadiusMeters));
      if (!anchors.every(finiteAnchor)) { report('geo-study.component-suppressed', `${name}|invalid-anchor`); return; }
      const valid = anchors as BoundedHomogeneousFiniteAnchor[];
      const surface = homogeneousMaterial(0x68d4c4, opacity); setW(surface, valid[0]);
      const line = new THREE.LineLoop(geometry(valid), surface); line.name = name; line.userData.referenceEarthRadiusMeters = source.referenceEarthSphereRadiusMeters; add(line, line.geometry, surface);
    };
    const basis = (east: number, north: number, up: number) => new THREE.Vector3(
      source.localEast.x * east + source.localNorth.x * north + source.localUp.x * up,
      source.localEast.y * east + source.localNorth.y * north + source.localUp.y * up,
      source.localEast.z * east + source.localNorth.z * north + source.localUp.z * up,
    ).normalize();
    const circle = (latitudeDeg: number, meridianDeg: number | undefined) => Array.from({ length: 48 }, (_, index) => {
      const angle = index / 48 * Math.PI * 2;
      if (meridianDeg === undefined) {
        const lat = latitudeDeg * Math.PI / 180; return basis(Math.cos(lat) * Math.cos(angle), Math.cos(lat) * Math.sin(angle), Math.sin(lat));
      }
      const lon = meridianDeg * Math.PI / 180; return basis(Math.sin(angle) * Math.cos(lon), Math.sin(angle) * Math.sin(lon), Math.cos(angle));
    });
    makeCircle('reference-earth-terrestrial-equator', circle(0, undefined), 0.26);
    [30, -30, 60, -60].forEach((latitude) => makeCircle(`reference-earth-latitude-${latitude >= 0 ? 'plus' : 'minus'}-${Math.abs(latitude)}`, circle(latitude, undefined), 0.16));
    for (let meridian = 0; meridian < 180; meridian += 30) makeCircle(`reference-earth-meridian-${String(meridian).padStart(3, '0')}`, circle(0, meridian), meridian === 0 ? 0.30 : 0.14);
  };
  const addTangentPlane = (source: ObserverOffsetGeocentricPresentation) => {
    const c = source.referenceEarthSphereSurfacePoint;
    const p0 = offset(source, c, -PATCH_HALF_SIZE_METERS, -PATCH_HALF_SIZE_METERS);
    const p1 = offset(source, c, PATCH_HALF_SIZE_METERS, -PATCH_HALF_SIZE_METERS);
    const p2 = offset(source, c, PATCH_HALF_SIZE_METERS, PATCH_HALF_SIZE_METERS);
    const p3 = offset(source, c, -PATCH_HALF_SIZE_METERS, PATCH_HALF_SIZE_METERS);
    const anchors = [p0, p1, p2, p3];
    if (!anchors.every(finiteAnchor)) { report('geo-study.component-suppressed', 'observer-local-tangent-plane|invalid-anchor'); return; }
    const valid = anchors as BoundedHomogeneousFiniteAnchor[];
    const surface = homogeneousMaterial(0x79b8d7, 0.13); setW(surface, valid[0]);
    const patch = new THREE.Mesh(geometry([valid[0], valid[1], valid[2], valid[0], valid[2], valid[3]]), surface); patch.name = 'observer-local-tangent-plane'; patch.userData.normal = source.localUp; add(patch, patch.geometry, surface);
    const axis = (name: string, east: number, north: number, color: number) => {
      const first = offset(source, c, -east, -north); const second = offset(source, c, east, north);
      if (!finiteAnchor(first) || !finiteAnchor(second)) return;
      const axisSurface = homogeneousMaterial(color, 0.38); setW(axisSurface, first);
      const line = new THREE.Line(geometry([first, second]), axisSurface); line.name = name; add(line, line.geometry, axisSurface);
    };
    axis('observer-local-east-axis', PATCH_HALF_SIZE_METERS, 0, 0x72d9cf);
    axis('observer-local-north-axis', 0, PATCH_HALF_SIZE_METERS, 0xadc9f4);
  };
  const build = (source: ObserverOffsetGeocentricPresentation) => {
    removeOwned(); contract = source; sourceKey = source.geocentricStructure.snapshotCacheKey;
    addRadius(source); addSurfaceMarker(source); addWireframe(source); addTangentPlane(source);
    group.userData.duplicateGeometryCreation = false; group.userData.contractKind = source.kind;
  };
  const visibility = (settings: ObserverOffsetGeoStudySettings) => {
    const selected = new Set(selectedObserverOffsetGeoStudyComponents(settings));
    objects.forEach((object, name) => {
      const component = name.startsWith('reference-earth-') ? 'reference-earth-wireframe'
        : name === 'observer-local-east-axis' || name === 'observer-local-north-axis'
          ? 'observer-local-tangent-plane' : name;
      object.visible = selected.has(component) && (component !== 'observer-local-tangent-plane' || name === 'observer-local-tangent-plane' || settings.showLocalAxes);
      const raw = (object as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
      if (raw?.uniforms?.uOpacity) raw.uniforms.uOpacity.value = Math.min(0.8, Math.max(0.08, settings.opacity * (name.includes('tangent') ? 0.4 : 1)));
    });
    group.visible = settings.mode !== 'baseline' && selected.size > 0;
    group.userData.mode = settings.mode; group.userData.enabledComponents = [...selected]; group.userData.activeObjectNames = [...objects.values()].filter((object) => object.visible).map((object) => object.name);
  };
  return Object.freeze({
    group,
    update(source: ObserverOffsetGeocentricPresentation, settings: ObserverOffsetGeoStudySettings) {
      if (disposed) return;
      if (settings.mode !== 'baseline' && sourceKey !== source.geocentricStructure.snapshotCacheKey) build(source);
      visibility(settings);
    },
    clear() { group.visible = false; objects.forEach((object) => { object.visible = false; }); },
    dispose() { if (disposed) return; disposed = true; removeOwned(); group.removeFromParent(); group.userData.disposed = true; },
    getDiagnostics() { return Object.freeze({ ...(group.userData as Record<string, unknown>), sourceKey: contract?.geocentricStructure.snapshotCacheKey ?? 'not-ready' }); },
  });
}
