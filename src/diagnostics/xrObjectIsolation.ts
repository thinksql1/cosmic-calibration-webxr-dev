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

const CELESTIAL_GRID_LINE_NAMES = Object.freeze([
  'declination-circle-plus-60', 'declination-circle-plus-30',
  'declination-circle-minus-30', 'declination-circle-minus-60',
  'right-ascension-meridian-00h', 'right-ascension-meridian-02h',
  'right-ascension-meridian-04h', 'right-ascension-meridian-06h',
  'right-ascension-meridian-08h', 'right-ascension-meridian-10h',
  'right-ascension-meridian-12h', 'right-ascension-meridian-14h',
  'right-ascension-meridian-16h', 'right-ascension-meridian-18h',
  'right-ascension-meridian-20h', 'right-ascension-meridian-22h',
]);
const REAL_SKY_OVERLAY_LINE_NAMES = Object.freeze(
  CELESTIAL_GRID_LINE_NAMES.map((name) => `real-sky-overlay-${name}`),
);

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
  state('celestial-grid', 'All celestial coordinate grid lines only', ['declination-circle-plus-60', 'declination-circle-plus-30', 'declination-circle-minus-30', 'declination-circle-minus-60', 'right-ascension-meridian-00h', 'right-ascension-meridian-02h', 'right-ascension-meridian-04h', 'right-ascension-meridian-06h', 'right-ascension-meridian-08h', 'right-ascension-meridian-10h', 'right-ascension-meridian-12h', 'right-ascension-meridian-14h', 'right-ascension-meridian-16h', 'right-ascension-meridian-18h', 'right-ascension-meridian-20h', 'right-ascension-meridian-22h']),
  state('canonical-grid-only', 'Canonical non-sidereal grid only', CELESTIAL_GRID_LINE_NAMES),
  state('real-sky-grid-only', 'Real-sky grid only', CELESTIAL_GRID_LINE_NAMES),
  state('canonical-real-sky-overlay', 'Canonical and real-sky grid overlay', [...CELESTIAL_GRID_LINE_NAMES, ...REAL_SKY_OVERLAY_LINE_NAMES]),
  state('real-sky-overlay-only', 'Real-sky overlay representation only', REAL_SKY_OVERLAY_LINE_NAMES),
  state('real-sky-horizon-compass', 'Real-sky grid plus local horizon and compass', [...CELESTIAL_GRID_LINE_NAMES, 'local-astronomical-horizon-circle', 'geographic-north-south-line', 'geographic-east-west-line', 'cardinal-n', 'cardinal-s', 'cardinal-e', 'cardinal-w']),
  state('real-sky-poles', 'Real-sky grid plus pole markers', [...CELESTIAL_GRID_LINE_NAMES, 'north-celestial-pole-marker', 'south-celestial-pole-marker']),
  state('real-sky-sun-moon', 'Real-sky grid plus Sun and Moon', [...CELESTIAL_GRID_LINE_NAMES, 'apparent-sun-marker', 'apparent-moon-marker']),
  state('real-sky-planets', 'Real-sky grid plus planet markers', [...CELESTIAL_GRID_LINE_NAMES, 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('real-sky-north-pole-alignment', 'North celestial pole convergence alignment', ['north-celestial-pole-marker', ...CELESTIAL_GRID_LINE_NAMES.filter((name) => name.startsWith('right-ascension-'))]),
  state('real-sky-south-pole-alignment', 'South celestial pole convergence alignment', ['south-celestial-pole-marker', ...CELESTIAL_GRID_LINE_NAMES.filter((name) => name.startsWith('right-ascension-'))]),
  state('real-sky-equator-horizon', 'Celestial equator and geometric horizon relationship', ['mean-celestial-equator-geocentric-reference-ring', 'local-astronomical-horizon-circle', ...CELESTIAL_GRID_LINE_NAMES.filter((name) => name.startsWith('declination-'))]),
  state('real-sky-ra-zero', 'Real-sky RA zero meridian only', ['right-ascension-meridian-00h']),
  state('real-sky-ra-quadrants', 'Real-sky RA 6h, 12h, and 18h meridians', ['right-ascension-meridian-06h', 'right-ascension-meridian-12h', 'right-ascension-meridian-18h']),
  state('real-sky-basis-axes', 'Astronomy basis axes represented by cardinal RA meridians and poles', ['right-ascension-meridian-00h', 'right-ascension-meridian-06h', 'right-ascension-meridian-12h', 'right-ascension-meridian-18h', 'north-celestial-pole-marker', 'south-celestial-pole-marker']),
  state('declination-grid', 'Declination circles only', ['declination-circle-plus-60', 'declination-circle-plus-30', 'declination-circle-minus-30', 'declination-circle-minus-60']),
  state('right-ascension-grid', 'Right-ascension meridians only', ['right-ascension-meridian-00h', 'right-ascension-meridian-02h', 'right-ascension-meridian-04h', 'right-ascension-meridian-06h', 'right-ascension-meridian-08h', 'right-ascension-meridian-10h', 'right-ascension-meridian-12h', 'right-ascension-meridian-14h', 'right-ascension-meridian-16h', 'right-ascension-meridian-18h', 'right-ascension-meridian-20h', 'right-ascension-meridian-22h']),
  state('right-ascension-00h', '0h meridian only', ['right-ascension-meridian-00h']),
  state('right-ascension-02h', '2h meridian only', ['right-ascension-meridian-02h']),
  state('declination-plus-30', '+30 degree declination only', ['declination-circle-plus-30']),
  state('declination-minus-60', '-60 degree declination only', ['declination-circle-minus-60']),
  state('equator-and-grid', 'Celestial equator plus coordinate grid', ['mean-celestial-equator-geocentric-reference-ring', 'declination-circle-plus-60', 'declination-circle-plus-30', 'declination-circle-minus-30', 'declination-circle-minus-60', 'right-ascension-meridian-00h', 'right-ascension-meridian-02h', 'right-ascension-meridian-04h', 'right-ascension-meridian-06h', 'right-ascension-meridian-08h', 'right-ascension-meridian-10h', 'right-ascension-meridian-12h', 'right-ascension-meridian-14h', 'right-ascension-meridian-16h', 'right-ascension-meridian-18h', 'right-ascension-meridian-20h', 'right-ascension-meridian-22h']),
  state('floor-origin', 'Floor origin only', ['floor-origin'], { 'floor-origin': 0xffffff }),
  state('room-axes', 'Room-relative axes only', ['room-relative-axes']),
  state('zenith-nadir', 'Zenith–nadir line only', ['zenith-nadir-line'], { 'zenith-nadir-line': 0xaa55ff }),
  state('geographic-north-south', 'Geographic north–south line only', ['geographic-north-south-line'], { 'geographic-north-south-line': 0xffd000 }),
  state('geographic-east-west', 'Geographic east–west line only', ['geographic-east-west-line'], { 'geographic-east-west-line': 0x00dfff }),
  state('cardinal-north', 'Cardinal N label only', ['cardinal-n']),
  state('cardinal-south', 'Cardinal S label only', ['cardinal-s']),
  state('cardinal-east', 'Cardinal E label only', ['cardinal-e']),
  state('cardinal-west', 'Cardinal W label only', ['cardinal-w']),
  state('body-markers', 'All apparent body markers only', ['apparent-sun-marker', 'apparent-moon-marker', 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('planet-markers', 'All planet and dwarf-planet markers only', ['apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('planet-labels', 'All planet and dwarf-planet labels only', ['apparent-mercury-label', 'apparent-venus-label', 'apparent-mars-label', 'apparent-jupiter-label', 'apparent-saturn-label', 'apparent-uranus-label', 'apparent-neptune-label', 'apparent-pluto-label']),
  state('outer-planets', 'Outer planets and Pluto only', ['apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('uranus', 'Uranus only', ['apparent-uranus-marker']),
  state('uranus-label-proof', 'Uranus finite label proof only', ['apparent-uranus-label']),
  state('uranus-marker-label-proof', 'Uranus marker plus finite label proof', ['apparent-uranus-marker', 'apparent-uranus-label']),
  state('uranus-label-grid-proof', 'Uranus marker, finite label proof, and celestial grid', ['apparent-uranus-marker', 'apparent-uranus-label', ...CELESTIAL_GRID_LINE_NAMES]),
  state('uranus-repaired-label', 'Repaired Uranus finite label path only', ['apparent-uranus-label']),
  state('repaired-planet-labels', 'All repaired finite planet labels', ['apparent-mercury-label', 'apparent-venus-label', 'apparent-mars-label', 'apparent-jupiter-label', 'apparent-saturn-label', 'apparent-uranus-label', 'apparent-neptune-label', 'apparent-pluto-label']),
  state('planet-markers-repaired-labels', 'Planet markers plus repaired finite labels', ['apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker', 'apparent-mercury-label', 'apparent-venus-label', 'apparent-mars-label', 'apparent-jupiter-label', 'apparent-saturn-label', 'apparent-uranus-label', 'apparent-neptune-label', 'apparent-pluto-label']),
  state('neptune', 'Neptune only', ['apparent-neptune-marker']),
  state('pluto', 'Pluto only', ['apparent-pluto-marker']),
  state('uranus-label', 'Uranus with label', ['apparent-uranus-marker', 'apparent-uranus-label']),
  state('neptune-label', 'Neptune with label', ['apparent-neptune-marker', 'apparent-neptune-label']),
  state('pluto-label', 'Pluto with label', ['apparent-pluto-marker', 'apparent-pluto-label']),
  state('planets-labels', 'All planets with labels', ['apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker', 'apparent-mercury-label', 'apparent-venus-label', 'apparent-mars-label', 'apparent-jupiter-label', 'apparent-saturn-label', 'apparent-uranus-label', 'apparent-neptune-label', 'apparent-pluto-label']),
  state('planets-grid', 'Planets plus celestial grid', ['apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker', ...CELESTIAL_GRID_LINE_NAMES]),
  state('sun-moon', 'Sun and Moon only', ['apparent-sun-marker', 'apparent-moon-marker']),
  state('sun-path', 'Apparent Sun daily path only', ['apparent-sun-civil-day-projective-path'], { 'apparent-sun-civil-day-projective-path': 0xff5500 }),
  state('sun-notches', 'Sun civil-hour notches only', ['apparent-sun-civil-hour-notches']),
  state('calibration-ray', 'North-calibration target ray only', ['north-calibration-target-ray'], { 'north-calibration-target-ray': 0xffee00 }),
  state('controller-feedback', 'Controller calibration feedback only', ['north-calibration-controller-feedback']),
  state('world-feedback', 'World calibration feedback only', ['north-calibration-world-feedback']),
  state('finite-core-proxy', 'Finite holographic core proxy only', ['finite-core-holographic-proxy'], { 'finite-core-holographic-proxy': 0x9cecff }),
  state('finite-core-proxy-grid', 'Finite core proxy plus celestial grid', ['finite-core-holographic-proxy', ...CELESTIAL_GRID_LINE_NAMES]),
  state('scientific-core-marker', 'Existing scientific core marker only', ['modeled-earth-core-marker'], { 'modeled-earth-core-marker': 0xffffff }),
  state('scientific-core-grid', 'Scientific core marker plus celestial grid', ['modeled-earth-core-marker', ...CELESTIAL_GRID_LINE_NAMES]),
  state('geo-study-core-radius', 'Observer-to-core radius only', ['observer-to-earth-core-radius']),
  state('geo-study-surface', 'Observer reference surface marker only', ['observer-reference-surface-marker']),
  state('geo-study-earth', 'Reference Earth wireframe only', ['reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150']),
  state('geo-study-tangent', 'Observer local tangent plane only', ['observer-local-tangent-plane', 'observer-local-east-axis', 'observer-local-north-axis']),
  state('geo-study-earth-core', 'Reference Earth plus core', ['reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150', 'modeled-earth-core-marker']),
  state('geo-study-earth-observer', 'Reference Earth plus observer marker', ['reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150', 'observer-reference-surface-marker']),
  state('geo-study-earth-radius', 'Reference Earth plus radius', ['reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150', 'observer-to-earth-core-radius']),
  state('geo-study-grid-earth', 'Celestial grid plus reference Earth', ['declination-circle-plus-60', 'declination-circle-plus-30', 'declination-circle-minus-30', 'declination-circle-minus-60', 'right-ascension-meridian-00h', 'right-ascension-meridian-02h', 'right-ascension-meridian-04h', 'right-ascension-meridian-06h', 'right-ascension-meridian-08h', 'right-ascension-meridian-10h', 'right-ascension-meridian-12h', 'right-ascension-meridian-14h', 'right-ascension-meridian-16h', 'right-ascension-meridian-18h', 'right-ascension-meridian-20h', 'right-ascension-meridian-22h', 'reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150']),
  state('geo-study-core-grid-observer', 'Core plus grid plus observer marker', ['modeled-earth-core-marker', 'observer-reference-surface-marker', 'declination-circle-plus-60', 'declination-circle-plus-30', 'declination-circle-minus-30', 'declination-circle-minus-60', 'right-ascension-meridian-00h', 'right-ascension-meridian-02h', 'right-ascension-meridian-04h', 'right-ascension-meridian-06h', 'right-ascension-meridian-08h', 'right-ascension-meridian-10h', 'right-ascension-meridian-12h', 'right-ascension-meridian-14h', 'right-ascension-meridian-16h', 'right-ascension-meridian-18h', 'right-ascension-meridian-20h', 'right-ascension-meridian-22h']),
  state('geo-study-combined', 'Combined observer-offset study', ['observer-to-earth-core-radius', 'observer-reference-surface-marker', 'reference-earth-terrestrial-equator', 'reference-earth-latitude-plus-30', 'reference-earth-latitude-minus-30', 'reference-earth-latitude-plus-60', 'reference-earth-latitude-minus-60', 'reference-earth-meridian-000', 'reference-earth-meridian-030', 'reference-earth-meridian-060', 'reference-earth-meridian-090', 'reference-earth-meridian-120', 'reference-earth-meridian-150', 'observer-local-tangent-plane', 'observer-local-east-axis', 'observer-local-north-axis']),
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
