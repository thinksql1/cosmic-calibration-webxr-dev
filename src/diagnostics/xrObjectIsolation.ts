import * as THREE from 'three';
import { CONSTELLATION_CATALOG_V2_FIGURES } from '../science/constellations/constellationCatalogV2';
import { CONSTELLATION_CATALOG_V3A_FIGURES } from '../science/constellations/constellationCatalogV3A';
import { CONSTELLATION_LEARNING_GROUPS } from '../science/constellations/constellationLearningGroups';

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
const constellationLineNames = (identifier: string) => Object.freeze(
  Array.from({ length: CONSTELLATION_CATALOG_V2_FIGURES.find((figure) => figure.identifier.toLowerCase() === identifier)?.segments.length ?? 0 }, (_, index) =>
    `constellation-${identifier}-segment-${String(index + 1).padStart(2, '0')}`),
);
const ORION_CONSTELLATION_NAMES = constellationLineNames('ori');
const URSA_MAJOR_CONSTELLATION_NAMES = constellationLineNames('uma');
const CASSIOPEIA_CONSTELLATION_NAMES = constellationLineNames('cas');
const CYGNUS_CONSTELLATION_NAMES = constellationLineNames('cyg');
const TAURUS_CONSTELLATION_NAMES = constellationLineNames('tau');
const LEO_CONSTELLATION_NAMES = constellationLineNames('leo');
const SCORPIUS_CONSTELLATION_NAMES = constellationLineNames('sco');
const FIRST_CONSTELLATION_LINE_NAMES = Object.freeze(['ori', 'uma', 'cas', 'cyg', 'tau', 'leo', 'sco'].flatMap(constellationLineNames));
const EXPANDED_CONSTELLATION_LINE_NAMES = Object.freeze(CONSTELLATION_CATALOG_V2_FIGURES.flatMap((figure) => constellationLineNames(figure.identifier.toLowerCase())));
const COURSE_40_CONSTELLATION_LINE_NAMES = Object.freeze(CONSTELLATION_CATALOG_V3A_FIGURES.flatMap((figure) => constellationLineNames(figure.identifier.toLowerCase())));
const FIRST_CONSTELLATION_ENDPOINT_NAMES = Object.freeze(['ori', 'uma', 'cas', 'cyg', 'tau', 'leo', 'sco'].map((identifier) => `constellation-${identifier}-endpoint-markers`));
const constellationGroupNames = (groupId: string) => {
  const group = CONSTELLATION_LEARNING_GROUPS.find((value) => value.id === groupId);
  return Object.freeze((group?.constellationIdentifiers ?? []).flatMap((identifier) => constellationLineNames(identifier.toLowerCase())));
};
const MOON_PHASE_IDS = Object.freeze([
  'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
  'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
]);
const MOON_PHASE_IMAGE_NAMES = Object.freeze(MOON_PHASE_IDS.map((id) => `moon-phase-image-${id}`));
const MOON_PHASE_LABEL_NAMES = Object.freeze(MOON_PHASE_IDS.map((id) => `moon-phase-label-${id}`));
const MOON_PHASE_DIAL_NAMES = Object.freeze([
  'moon-phase-dial-ring',
  'moon-phase-dial-notches',
  ...MOON_PHASE_LABEL_NAMES,
  ...MOON_PHASE_IMAGE_NAMES,
  'moon-current-phase-indicator',
]);
const LUNAR_TRANSIT_PATH_NAMES = Object.freeze([
  'lunar-phase-transit-visible-sky-path',
  'lunar-phase-transit-earth-hidden-path',
]);
const LUNAR_TRANSIT_IMAGE_NAMES = Object.freeze(
  MOON_PHASE_IDS.map((id) => `lunar-transit-phase-image-${id}`),
);
const LUNAR_TRANSIT_NOTCH_NAMES = Object.freeze(
  MOON_PHASE_IDS.map((id) => `lunar-transit-notch-${id}`),
);
const LUNAR_TRANSIT_LABEL_NAMES = Object.freeze(
  MOON_PHASE_IDS.map((id) => `lunar-transit-phase-label-${id}`),
);
const LUNAR_TRANSIT_COMPLETE_NAMES = Object.freeze([
  ...LUNAR_TRANSIT_PATH_NAMES,
  ...LUNAR_TRANSIT_NOTCH_NAMES,
  'current-lunar-phase-transit-marker',
  ...LUNAR_TRANSIT_IMAGE_NAMES,
  ...LUNAR_TRANSIT_LABEL_NAMES,
]);

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
  state('constellations-first-set', 'All seven first-set constellation figures', FIRST_CONSTELLATION_LINE_NAMES),
  state('constellation-orion', 'Orion only', ORION_CONSTELLATION_NAMES),
  state('constellation-ursa-major', 'Ursa Major only', URSA_MAJOR_CONSTELLATION_NAMES),
  state('constellation-cassiopeia', 'Cassiopeia only', CASSIOPEIA_CONSTELLATION_NAMES),
  state('constellation-cygnus', 'Cygnus only', CYGNUS_CONSTELLATION_NAMES),
  state('constellation-taurus', 'Taurus only', TAURUS_CONSTELLATION_NAMES),
  state('constellation-leo', 'Leo only', LEO_CONSTELLATION_NAMES),
  state('constellation-scorpius', 'Scorpius only', SCORPIUS_CONSTELLATION_NAMES),
  state('constellation-orion-grid', 'Orion plus celestial grid', [...ORION_CONSTELLATION_NAMES, ...CELESTIAL_GRID_LINE_NAMES]),
  state('constellations-real-sky-grid', 'All constellations plus real-sky grid', [...FIRST_CONSTELLATION_LINE_NAMES, ...CELESTIAL_GRID_LINE_NAMES]),
  state('constellations-horizon-compass', 'All constellations plus horizon and compass', [...FIRST_CONSTELLATION_LINE_NAMES, 'local-astronomical-horizon-circle', 'geographic-north-south-line', 'geographic-east-west-line', 'cardinal-n', 'cardinal-s', 'cardinal-e', 'cardinal-w']),
  state('constellations-planets', 'All constellations plus planet markers', [...FIRST_CONSTELLATION_LINE_NAMES, 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('constellation-endpoints', 'First-set catalog endpoint markers only', FIRST_CONSTELLATION_ENDPOINT_NAMES),
  state('constellation-segment-samples', 'One Orion belt segment with sample points', ['constellation-ori-segment-04', 'constellation-ori-endpoint-markers']),
  state('constellations-canonical-eqj', 'Canonical EQJ constellation geometry (use constellationFrame=canonical)', FIRST_CONSTELLATION_LINE_NAMES),
  state('constellations-real-sky', 'Real-sky transformed constellation geometry', FIRST_CONSTELLATION_LINE_NAMES),
  state('constellation-sun-path-comparison', 'Sun path plus Orion for wobble comparison', ['apparent-sun-civil-day-projective-path', ...ORION_CONSTELLATION_NAMES]),
  state('constellations-expanded-all', 'All expanded constellations', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('constellations-expanded-added-only', 'Added constellations only', constellationGroupNames('added-only')),
  state('constellations-expanded-introduction', 'Introduction anchors', constellationGroupNames('introduction-anchors')),
  state('constellations-expanded-circumpolar', 'Circumpolar group', constellationGroupNames('circumpolar')),
  state('constellations-expanded-winter', 'Winter group', constellationGroupNames('winter')),
  state('constellations-expanded-spring', 'Spring group', constellationGroupNames('spring')),
  state('constellations-expanded-summer', 'Summer group', constellationGroupNames('summer')),
  state('constellations-expanded-autumn', 'Autumn group', constellationGroupNames('autumn')),
  state('constellations-expanded-zodiac', 'Zodiac group', constellationGroupNames('zodiac')),
  ...CONSTELLATION_CATALOG_V2_FIGURES.filter((figure) => !['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO'].includes(figure.identifier)).map((figure) =>
    state(`constellation-${figure.identifier.toLowerCase()}`, `${figure.displayName} only`, constellationLineNames(figure.identifier.toLowerCase()))),
  state('constellations-expanded-grid', 'Expanded constellations plus real-sky grid', [...EXPANDED_CONSTELLATION_LINE_NAMES, ...CELESTIAL_GRID_LINE_NAMES]),
  state('constellations-expanded-planets', 'Expanded constellations plus planets', [...EXPANDED_CONSTELLATION_LINE_NAMES, 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('constellations-expanded-lunar-transit', 'Expanded constellations plus Lunar Phase Transit', [...EXPANDED_CONSTELLATION_LINE_NAMES, ...LUNAR_TRANSIT_PATH_NAMES]),
  state('constellations-expanded-sun-moon-paths', 'Expanded constellations plus Sun and Moon paths', [...EXPANDED_CONSTELLATION_LINE_NAMES, 'apparent-sun-civil-day-projective-path', 'apparent-moon-civil-day-projective-path']),
  state('constellations-expanded-performance', 'Expanded constellation performance diagnostic', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('constellations-expanded-long-segment', 'Long constellation-segment sampling proof', constellationLineNames('dra').slice(0, 1)),
  state('constellations-expanded-shared-star', 'Shared-star proof: Andromeda and Pegasus', [...constellationLineNames('and'), ...constellationLineNames('peg')]),
  state('constellations-expanded-canonical', 'Canonical EQJ expanded catalog', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('constellations-expanded-real-sky', 'Real-sky transformed expanded catalog', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('constellations-course-40', 'Course 40', constellationGroupNames('introduction-anchors')),
  state('constellations-v3a-additions-only', 'V3A additions only', constellationGroupNames('v3a-additions-only')),
  state('constellations-north-star-circumpolar', 'North Star and Circumpolar', constellationGroupNames('north-star-and-circumpolar')),
  state('constellations-winter-extended', 'Winter Extended', constellationGroupNames('winter-extended')),
  state('constellations-spring-extended', 'Spring Extended', constellationGroupNames('spring-extended')),
  state('constellations-summer-compact', 'Summer Compact Figures', constellationGroupNames('summer-compact-figures')),
  state('constellations-autumn-extended', 'Autumn Extended', constellationGroupNames('autumn-extended')),
  state('constellations-complete-zodiac', 'Complete Zodiac', constellationGroupNames('complete-zodiac')),
  state('constellations-orion-neighborhood', 'Orion Neighborhood', constellationGroupNames('orion-neighborhood')),
  state('constellations-course-40-performance', 'All 40 performance', COURSE_40_CONSTELLATION_LINE_NAMES),
  state('constellation-ursa-minor', 'Ursa Minor only', constellationLineNames('umi')),
  state('constellation-cancer', 'Cancer only', constellationLineNames('cnc')),
  state('constellation-canes-venatici', 'Canes Venatici only', constellationLineNames('cvn')),
  state('constellation-coma-berenices', 'Coma Berenices only', constellationLineNames('com')),
  state('constellation-corvus', 'Corvus only', constellationLineNames('crv')),
  state('constellation-crater', 'Crater only', constellationLineNames('crt')),
  state('constellation-monoceros', 'Monoceros only', constellationLineNames('mon')),
  state('constellation-lepus', 'Lepus only', constellationLineNames('lep')),
  state('constellation-delphinus', 'Delphinus only', constellationLineNames('del')),
  state('constellation-sagitta', 'Sagitta only', constellationLineNames('sge')),
  state('constellation-triangulum', 'Triangulum only', constellationLineNames('tri')),
  state('constellations-v3a-canonical-eqj', 'V3A canonical EQJ', COURSE_40_CONSTELLATION_LINE_NAMES),
  state('constellations-v3a-real-sky', 'V3A real-sky transformed', COURSE_40_CONSTELLATION_LINE_NAMES),
  state('constellations-v3a-grid', 'V3A plus real-sky grid', [...COURSE_40_CONSTELLATION_LINE_NAMES, ...CELESTIAL_GRID_LINE_NAMES]),
  state('constellations-v3a-planets', 'V3A plus planets', [...COURSE_40_CONSTELLATION_LINE_NAMES, 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('constellations-v3a-lunar-transit', 'V3A plus Lunar Phase Transit', [...COURSE_40_CONSTELLATION_LINE_NAMES, ...LUNAR_TRANSIT_PATH_NAMES]),
  state('constellations-v3a-orange-highlight', 'V3A orange-highlight integration', constellationGroupNames('v3a-additions-only')),
  state('constellations-v3a-alternate-base', 'V3A alternate-base-color integration', constellationGroupNames('v3a-additions-only')),
  state('constellations-v3a-geometry-hash', 'V3A geometry-hash preservation', COURSE_40_CONSTELLATION_LINE_NAMES),
  state('constellations-v3a-performance', 'V3A performance diagnostic', COURSE_40_CONSTELLATION_LINE_NAMES),
  state('semantic-unified-introduction', 'Unified Introduction Anchors', constellationGroupNames('introduction-anchors')),
  state('semantic-highlight-introduction', 'Highlighted Introduction Anchors', constellationGroupNames('introduction-anchors')),
  state('semantic-highlight-circumpolar', 'Highlighted Circumpolar', constellationGroupNames('circumpolar')),
  state('semantic-highlight-winter', 'Highlighted Winter', constellationGroupNames('winter')),
  state('semantic-highlight-spring', 'Highlighted Spring', constellationGroupNames('spring')),
  state('semantic-highlight-summer', 'Highlighted Summer', constellationGroupNames('summer')),
  state('semantic-highlight-autumn', 'Highlighted Autumn', constellationGroupNames('autumn')),
  state('semantic-highlight-zodiac', 'Highlighted Zodiac', constellationGroupNames('zodiac')),
  state('semantic-unified-all-expanded', 'Unified All Expanded', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('semantic-group-palette-all-expanded', 'Experimental Group Palette All Expanded', EXPANDED_CONSTELLATION_LINE_NAMES),
  state('semantic-lunar-daily', 'Moon Daily Path semantic palette diagnostic', ['apparent-moon-civil-day-projective-path']),
  state('semantic-lunar-transit-visible', 'Lunar transit visible semantic palette diagnostic', ['lunar-phase-transit-visible-sky-path']),
  state('semantic-lunar-transit-hidden', 'Lunar transit Earth-hidden semantic palette diagnostic', ['lunar-phase-transit-earth-hidden-path']),
  state('semantic-lunar-transit-complete', 'Lunar transit complete semantic palette diagnostic', LUNAR_TRANSIT_COMPLETE_NAMES),
  state('semantic-lunar-paths', 'Moon Daily Path plus Lunar Phase Transit semantic comparison', ['apparent-moon-civil-day-projective-path', ...LUNAR_TRANSIT_PATH_NAMES]),
  state('semantic-lunar-constellations', 'Lunar paths plus constellations semantic comparison', ['apparent-moon-civil-day-projective-path', ...LUNAR_TRANSIT_PATH_NAMES, ...EXPANDED_CONSTELLATION_LINE_NAMES]),
  state('semantic-lunar-sun', 'Lunar and solar path semantic comparison', ['apparent-moon-civil-day-projective-path', ...LUNAR_TRANSIT_PATH_NAMES, 'apparent-sun-civil-day-projective-path']),
  state('semantic-grayscale', 'Semantic luminance diagnostic', ['apparent-moon-civil-day-projective-path', ...LUNAR_TRANSIT_PATH_NAMES, ...EXPANDED_CONSTELLATION_LINE_NAMES]),
  state('semantic-material-lifecycle', 'Semantic material-cache lifecycle diagnostic', [...LUNAR_TRANSIT_PATH_NAMES, ...EXPANDED_CONSTELLATION_LINE_NAMES]),
  state('semantic-geometry-hash', 'Semantic geometry-hash preservation diagnostic', [...LUNAR_TRANSIT_PATH_NAMES, ...EXPANDED_CONSTELLATION_LINE_NAMES]),
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
  state('sun-path-notches', 'Safe Sun path with civil-hour notches', ['apparent-sun-civil-day-projective-path', 'apparent-sun-civil-hour-notches']),
  state('sun-path-orion-safe', 'Orion plus safe Sun path', ['apparent-sun-civil-day-projective-path', ...ORION_CONSTELLATION_NAMES]),
  state('moon-marker', 'Moon marker only', ['apparent-moon-marker']),
  state('moon-daily-path', 'Moon daily path only', ['apparent-moon-civil-day-projective-path']),
  state('moon-marker-daily-path', 'Moon marker plus daily path', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path']),
  state('lunar-phase-transit-path', 'Lunar Phase Transit Path only', LUNAR_TRANSIT_PATH_NAMES),
  state('lunar-phase-transit-visible', 'Transit path visible-sky portion', ['lunar-phase-transit-visible-sky-path']),
  state('lunar-phase-transit-hidden', 'Transit path Earth-hidden portion', ['lunar-phase-transit-earth-hidden-path']),
  state('lunar-phase-transit-current-moon', 'Transit path plus current Moon', [...LUNAR_TRANSIT_PATH_NAMES, 'apparent-moon-marker']),
  state('lunar-phase-transit-notches', 'Transit path plus phase notches', [...LUNAR_TRANSIT_PATH_NAMES, ...LUNAR_TRANSIT_NOTCH_NAMES]),
  state('lunar-transit-notches-only', 'Lunar transit phase notches only', LUNAR_TRANSIT_NOTCH_NAMES),
  state('lunar-transit-images', 'Lunar transit phase images only', LUNAR_TRANSIT_IMAGE_NAMES),
  state('lunar-transit-labels', 'Lunar transit phase labels only', LUNAR_TRANSIT_LABEL_NAMES),
  state('lunar-transit-path-images', 'Transit path plus images', [...LUNAR_TRANSIT_PATH_NAMES, ...LUNAR_TRANSIT_IMAGE_NAMES]),
  state('lunar-transit-path-labels', 'Transit path plus labels', [...LUNAR_TRANSIT_PATH_NAMES, ...LUNAR_TRANSIT_LABEL_NAMES]),
  state('lunar-transit-path-images-labels', 'Transit path plus images and labels', [...LUNAR_TRANSIT_PATH_NAMES, ...LUNAR_TRANSIT_IMAGE_NAMES, ...LUNAR_TRANSIT_LABEL_NAMES]),
  state('lunar-current-transit', 'Current lunar transit marker only', ['current-lunar-phase-transit-marker']),
  state('lunar-transit-previous-next', 'Previous and next phase notches', LUNAR_TRANSIT_NOTCH_NAMES),
  state('lunar-transit-new-moon', 'New Moon transit notch and image', ['lunar-transit-notch-new-moon', 'lunar-transit-phase-image-new-moon']),
  state('lunar-transit-first-quarter', 'First Quarter transit notch and image', ['lunar-transit-notch-first-quarter', 'lunar-transit-phase-image-first-quarter']),
  state('lunar-transit-full-moon', 'Full Moon transit notch and image', ['lunar-transit-notch-full-moon', 'lunar-transit-phase-image-full-moon']),
  state('lunar-transit-last-quarter', 'Last Quarter transit notch and image', ['lunar-transit-notch-last-quarter', 'lunar-transit-phase-image-last-quarter']),
  state('lunar-phase-transit-complete', 'Complete lunar phase transit presentation', LUNAR_TRANSIT_COMPLETE_NAMES),
  state('lunar-transit-grid', 'Transit path plus real-sky grid', [...LUNAR_TRANSIT_PATH_NAMES, ...CELESTIAL_GRID_LINE_NAMES]),
  state('lunar-transit-constellations', 'Transit path plus constellations', [...LUNAR_TRANSIT_PATH_NAMES, ...FIRST_CONSTELLATION_LINE_NAMES]),
  state('moon-daily-transit-paths', 'Moon daily path plus phase transit path', ['apparent-moon-civil-day-projective-path', ...LUNAR_TRANSIT_PATH_NAMES]),
  state('moon-phase-dial-ring', 'Moon phase dial ring only', ['moon-phase-dial-ring']),
  state('moon-phase-notches', 'Moon phase notches only', ['moon-phase-dial-notches']),
  state('moon-phase-labels', 'Moon phase labels only', MOON_PHASE_LABEL_NAMES),
  state('moon-phase-images', 'All eight phase images only', MOON_PHASE_IMAGE_NAMES),
  ...MOON_PHASE_IDS.map((id) => state(`moon-phase-${id}`, `${id} phase image only`, [`moon-phase-image-${id}`])),
  state('moon-phase-dial-complete', 'Complete symbolic Moon phase dial', MOON_PHASE_DIAL_NAMES),
  state('moon-dial-images-labels-off', 'Compact dial images with labels off', MOON_PHASE_IMAGE_NAMES),
  state('moon-dial-images-labels-on', 'Compact dial images and labels', [...MOON_PHASE_IMAGE_NAMES, ...MOON_PHASE_LABEL_NAMES]),
  state('moon-dial-label-distortion-proof', 'Compact dial label distortion proof', MOON_PHASE_LABEL_NAMES),
  state('moon-dial-image-aspect-proof', 'Compact dial image aspect-ratio proof', MOON_PHASE_IMAGE_NAMES),
  state('lunar-transit-image-aspect-proof', 'Transit image aspect-ratio proof', LUNAR_TRANSIT_IMAGE_NAMES),
  state('lunar-transit-label-readability-proof', 'Transit label readability proof', LUNAR_TRANSIT_LABEL_NAMES),
  state('current-moon-appearance', 'Current Moon appearance only', ['current-moon-appearance']),
  state('current-moon-marker', 'Current Moon appearance plus Moon marker', ['current-moon-appearance', 'apparent-moon-marker']),
  state('current-moon-sun', 'Current Moon appearance plus Sun marker', ['current-moon-appearance', 'apparent-sun-marker']),
  state('moon-current-phase-indicator', 'Current phase indicator only', ['moon-current-phase-indicator']),
  state('moon-path-phase-dial', 'Moon daily path plus phase dial', ['apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES]),
  state('moon-path-current-appearance', 'Moon daily path plus current appearance', ['apparent-moon-civil-day-projective-path', 'current-moon-appearance']),
  state('moon-study-complete', 'Complete Moon study', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES, 'current-moon-appearance']),
  state('moon-presentation-complete', 'Complete Moon presentation including phase transit', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES, 'current-moon-appearance', ...LUNAR_TRANSIT_COMPLETE_NAMES]),
  state('moon-study-grid', 'Moon study plus real-sky grid', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES, 'current-moon-appearance', ...CELESTIAL_GRID_LINE_NAMES]),
  state('moon-study-planets', 'Moon study plus planets', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES, 'current-moon-appearance', 'apparent-mercury-marker', 'apparent-venus-marker', 'apparent-mars-marker', 'apparent-jupiter-marker', 'apparent-saturn-marker', 'apparent-uranus-marker', 'apparent-neptune-marker', 'apparent-pluto-marker']),
  state('moon-study-constellations', 'Moon study plus constellations', ['apparent-moon-marker', 'apparent-moon-civil-day-projective-path', ...MOON_PHASE_DIAL_NAMES, 'current-moon-appearance', ...FIRST_CONSTELLATION_LINE_NAMES]),
  state('sun-moon-paths', 'Sun and Moon paths together', ['apparent-sun-civil-day-projective-path', 'apparent-moon-civil-day-projective-path']),
  state('sun-moon-path-smoothness', 'Sun and Moon path smoothness comparison', ['apparent-sun-civil-day-projective-path', 'apparent-moon-civil-day-projective-path', 'apparent-sun-civil-hour-notches']),
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
