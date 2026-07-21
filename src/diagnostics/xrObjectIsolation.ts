import * as THREE from 'three';

export interface XrObjectIsolationState {
  readonly id: string;
  readonly name: string;
  readonly objectNames: readonly string[];
  readonly colorByObjectName?: Readonly<Record<string, number>>;
}

const state = (
  id: string,
  name: string,
  objectNames: readonly string[],
  colorByObjectName?: Readonly<Record<string, number>>,
): XrObjectIsolationState => Object.freeze({
  id,
  name,
  objectNames: Object.freeze([...objectNames]),
  colorByObjectName: colorByObjectName ? Object.freeze({ ...colorByObjectName }) : undefined,
});

export const XR_OBJECT_ISOLATION_STATES: readonly XrObjectIsolationState[] = Object.freeze([
  state('all', 'Preset behavior — no object isolation', []),
  state('core-marker', 'Earth core marker only', ['modeled-earth-core-marker'], { 'modeled-earth-core-marker': 0xffffff }),
  state('north-pole-marker', 'North pole marker only', ['north-celestial-pole-marker'], { 'north-celestial-pole-marker': 0xffff00 }),
  state('south-pole-marker', 'South pole marker only', ['south-celestial-pole-marker'], { 'south-celestial-pole-marker': 0x00ffff }),
  state('pole-labels', 'North and south pole labels only', ['north-celestial-pole-label', 'south-celestial-pole-label']),
  state('north-spindle', 'North spindle segment only', ['mean-earth-axis-rigid-spindle-north-segment'], { 'mean-earth-axis-rigid-spindle-north-segment': 0xff2020 }),
  state('south-spindle', 'South spindle segment only', ['mean-earth-axis-rigid-spindle-south-segment'], { 'mean-earth-axis-rigid-spindle-south-segment': 0x2070ff }),
  state('both-spindles', 'Both spindle segments only', ['mean-earth-axis-rigid-spindle-north-segment', 'mean-earth-axis-rigid-spindle-south-segment'], {
    'mean-earth-axis-rigid-spindle-north-segment': 0xff2020,
    'mean-earth-axis-rigid-spindle-south-segment': 0x2070ff,
  }),
  state('floor-horizon-ring', 'Floor horizon ring only', ['floor-horizon-ring'], { 'floor-horizon-ring': 0xff00ff }),
  state('local-horizon-circle', 'Local astronomical horizon circle only', ['local-astronomical-horizon-circle'], { 'local-astronomical-horizon-circle': 0x00ff66 }),
  state('celestial-equator-ring', 'Celestial equator ring only', ['mean-celestial-equator-geocentric-reference-ring'], { 'mean-celestial-equator-geocentric-reference-ring': 0xff8800 }),
  state('floor-origin', 'Floor origin only', ['floor-origin'], { 'floor-origin': 0xffffff }),
  state('room-axes', 'Room-relative axes only', ['room-relative-axes']),
  state('zenith-nadir', 'Zenith–nadir line only', ['zenith-nadir-line'], { 'zenith-nadir-line': 0xaa55ff }),
  state('geographic-north-south', 'Geographic north–south line only', ['geographic-north-south-line'], { 'geographic-north-south-line': 0xffd000 }),
  state('geographic-east-west', 'Geographic east–west line only', ['geographic-east-west-line'], { 'geographic-east-west-line': 0x00dfff }),
  state('cardinal-north', 'Cardinal N label only', ['cardinal-n']),
  state('cardinal-south', 'Cardinal S label only', ['cardinal-s']),
  state('cardinal-east', 'Cardinal E label only', ['cardinal-e']),
  state('cardinal-west', 'Cardinal W label only', ['cardinal-w']),
  state('body-markers', 'Solar-system body markers only', ['actual-apparent-solar-system-body-markers']),
  state('sun-path', 'Apparent Sun daily path only', ['apparent-sun-civil-day-projective-path'], { 'apparent-sun-civil-day-projective-path': 0xff5500 }),
  state('sun-notches', 'Sun civil-hour notches only', ['apparent-sun-civil-hour-notches']),
  state('calibration-ray', 'North-calibration target ray only', ['north-calibration-target-ray'], { 'north-calibration-target-ray': 0xffee00 }),
  state('controller-feedback', 'Controller calibration feedback only', ['north-calibration-controller-feedback']),
  state('world-feedback', 'World calibration feedback only', ['north-calibration-world-feedback']),
]);

export function parseXrObjectIsolation(
  search: string,
  storedIsolation?: string | null,
): XrObjectIsolationState {
  const raw = new URLSearchParams(search).get('isolate') ?? storedIsolation ?? 'all';
  return XR_OBJECT_ISOLATION_STATES.find((candidate) => candidate.id === raw)
    ?? XR_OBJECT_ISOLATION_STATES[0];
}

function isRenderable(object: THREE.Object3D): object is THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite {
  return object instanceof THREE.Mesh
    || object instanceof THREE.Line
    || object instanceof THREE.Points
    || object instanceof THREE.Sprite;
}

function diagnosticColor(object: THREE.Object3D, color: number): void {
  const rawMaterial = (object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  const materials = rawMaterial ? (Array.isArray(rawMaterial) ? rawMaterial : [rawMaterial]) : [];
  for (const material of materials) {
    const colorProperty = (material as THREE.Material & { color?: THREE.Color }).color;
    if (colorProperty) colorProperty.setHex(color);
    if (material instanceof THREE.ShaderMaterial) {
      const uniformColor = material.uniforms.uColor?.value;
      if (uniformColor instanceof THREE.Color) uniformColor.setHex(color);
      if (typeof material.uniforms.uOpacity?.value === 'number') material.uniforms.uOpacity.value = 1;
    }
    const opacityMaterial = material as THREE.Material & { opacity?: number };
    if (typeof opacityMaterial.opacity === 'number') opacityMaterial.opacity = 1;
  }
}

export interface XrObjectIsolationResult {
  readonly stateId: string;
  readonly requestedObjectNames: readonly string[];
  readonly matchedObjectNames: readonly string[];
  readonly visibleRenderableNames: readonly string[];
}

/**
 * Diagnostic-only exact-object visibility filter. The default `all` state is
 * a strict no-op, so a non-diagnostic launch cannot alter scene behavior.
 */
export function applyXrObjectIsolation(
  root: THREE.Object3D,
  isolation: XrObjectIsolationState,
): XrObjectIsolationResult {
  if (isolation.id === 'all') {
    const visible: string[] = [];
    root.traverse((object) => {
      if (isRenderable(object) && object.visible) visible.push(object.name || `${object.type}#${object.id}`);
    });
    return Object.freeze({
      stateId: isolation.id,
      requestedObjectNames: isolation.objectNames,
      matchedObjectNames: Object.freeze([]),
      visibleRenderableNames: Object.freeze(visible.sort()),
    });
  }

  const requested = new Set(isolation.objectNames);
  const selected = new Set<THREE.Object3D>();
  const ancestors = new Set<THREE.Object3D>([root]);
  root.traverse((object) => {
    if (!isRenderable(object) || !requested.has(object.name)) return;
    selected.add(object);
    let ancestor: THREE.Object3D | null = object;
    while (ancestor) {
      ancestors.add(ancestor);
      if (ancestor === root) break;
      ancestor = ancestor.parent;
    }
  });

  root.traverse((object) => {
    object.visible = isRenderable(object) ? selected.has(object) : ancestors.has(object);
    if (!selected.has(object)) return;
    const color = isolation.colorByObjectName?.[object.name];
    if (color !== undefined) diagnosticColor(object, color);
    object.userData.diagnosticIsolation = isolation.id;
  });

  const matched = [...selected].map((object) => object.name).sort();
  return Object.freeze({
    stateId: isolation.id,
    requestedObjectNames: isolation.objectNames,
    matchedObjectNames: Object.freeze(matched),
    visibleRenderableNames: Object.freeze([...matched]),
  });
}
