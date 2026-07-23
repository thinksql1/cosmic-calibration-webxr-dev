export const FIRST_CONSTELLATION_IDENTIFIERS = Object.freeze(['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO'] as const);
export type FirstConstellationIdentifier = (typeof FIRST_CONSTELLATION_IDENTIFIERS)[number];

export interface FirstConstellationCatalogStar {
  readonly catalogIdentifier: `BSC5P-HR-${number}`;
  readonly displayName: string;
  readonly constellationIdentifier: FirstConstellationIdentifier;
  readonly rightAscensionHours: number;
  readonly declinationDegrees: number;
  readonly catalogFrame: 'EQJ_J2000';
  readonly catalogEpoch: 'J2000.0';
  readonly visualMagnitude: number;
  readonly sourceReference: string;
}
export interface FirstConstellationSegment {
  readonly startCatalogIdentifier: FirstConstellationCatalogStar['catalogIdentifier'];
  readonly endCatalogIdentifier: FirstConstellationCatalogStar['catalogIdentifier'];
}
export interface FirstConstellationFigure {
  readonly identifier: FirstConstellationIdentifier;
  readonly displayName: string;
  readonly sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1';
  readonly starCatalogIdentifiers: readonly FirstConstellationCatalogStar['catalogIdentifier'][];
  readonly segments: readonly FirstConstellationSegment[];
}

export const FIRST_CONSTELLATION_DATASET_METADATA = Object.freeze({
  version: '1.0.0',
  starCoordinateSource: 'NASA_HEASARC_BSC5P',
  starCoordinateSourceUrl: 'https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html',
  sourceReference: 'Hoffleit and Warren (1991), Bright Star Catalogue, 5th Revised Edition (preliminary BSC5P)',
  license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN',
  licenseUrl: 'https://www.usa.gov/government-copyright',
  dataCatalogUrl: 'https://catalog.data.gov/dataset/bright-star-catalog',
  catalogFrame: 'EQJ_J2000',
  catalogEpoch: 'J2000.0',
  properMotionPolicy: 'OMITTED_FIXED_J2000_FIRST_VISUAL_LAYER',
  connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1',
  connectivityPolicy: 'Small original endpoint selection for recognizable conventional stick figures; not an IAU boundary or standardized IAU figure.',
} as const);

const star = (hr: number, displayName: string, constellationIdentifier: FirstConstellationIdentifier, rightAscensionHours: number, declinationDegrees: number, visualMagnitude: number): FirstConstellationCatalogStar => Object.freeze({
  catalogIdentifier: `BSC5P-HR-${hr}`,
  displayName,
  constellationIdentifier,
  rightAscensionHours,
  declinationDegrees,
  catalogFrame: 'EQJ_J2000',
  catalogEpoch: 'J2000.0',
  visualMagnitude,
  sourceReference: `NASA HEASARC BSC5P HR ${hr}`,
});

/** Public-domain BSC5P J2000 subset; HEASARC RA degrees are divided by 15. */
export const FIRST_CONSTELLATION_STARS = Object.freeze([
  star(2061, 'Betelgeuse', 'ORI', 5.91952667, 7.4069, 0.50),
  star(1790, 'Bellatrix', 'ORI', 5.41886000, 6.3497, 1.64),
  star(1852, 'Mintaka', 'ORI', 5.53344667, -0.2992, 2.23),
  star(1903, 'Alnilam', 'ORI', 5.60355333, -1.2019, 1.70),
  star(1948, 'Alnitak', 'ORI', 5.67930667, -1.9428, 2.05),
  star(2004, 'Saiph', 'ORI', 5.79594667, -9.6697, 2.06),
  star(1713, 'Rigel', 'ORI', 5.24230667, -8.2017, 0.12),
  star(4301, 'Dubhe', 'UMA', 11.06214000, 61.7508, 1.79),
  star(4295, 'Merak', 'UMA', 11.03069333, 56.3825, 2.37),
  star(4554, 'Phecda', 'UMA', 11.89716667, 53.6947, 2.44),
  star(4660, 'Megrez', 'UMA', 12.25711333, 57.0325, 3.31),
  star(4905, 'Alioth', 'UMA', 12.90047333, 55.9597, 1.77),
  star(5054, 'Mizar', 'UMA', 13.39874667, 54.9253, 2.27),
  star(5191, 'Alkaid', 'UMA', 13.79233333, 49.3133, 1.86),
  star(21, 'Caph', 'CAS', 0.15297333, 59.1497, 2.27),
  star(168, 'Schedar', 'CAS', 0.67514000, 56.5372, 2.23),
  star(264, 'Gamma Cassiopeiae', 'CAS', 0.94514000, 60.7167, 2.47),
  star(403, 'Ruchbah', 'CAS', 1.43028000, 60.2353, 2.68),
  star(542, 'Segin', 'CAS', 1.90658000, 63.6700, 3.38),
  star(7924, 'Deneb', 'CYG', 20.69052667, 45.2803, 1.25),
  star(7796, 'Sadr', 'CYG', 20.37047333, 40.2567, 2.20),
  star(7417, 'Albireo', 'CYG', 19.51202667, 27.9597, 3.08),
  star(7949, 'Gienah Cygni', 'CYG', 20.77019333, 33.9703, 2.46),
  star(7528, 'Delta Cygni', 'CYG', 19.74958000, 45.1308, 2.87),
  star(1457, 'Aldebaran', 'TAU', 4.59866667, 16.5092, 0.85),
  star(1409, 'Ain', 'TAU', 4.47694667, 19.1803, 3.53),
  star(1791, 'Elnath', 'TAU', 5.43819333, 28.6075, 1.65),
  star(1346, 'Hyadum I', 'TAU', 4.32988667, 15.6275, 3.65),
  star(1910, 'Tianguan', 'TAU', 5.62741333, 21.1425, 3.00),
  star(3905, 'Rasalas', 'LEO', 9.87938667, 26.0069, 3.88),
  star(4031, 'Adhafera', 'LEO', 10.27816667, 23.4172, 3.44),
  star(4057, 'Algieba', 'LEO', 10.33286000, 19.8417, 2.61),
  star(3982, 'Regulus', 'LEO', 10.13952667, 11.9672, 1.35),
  star(4357, 'Zosma', 'LEO', 11.23514000, 20.5236, 2.56),
  star(4359, 'Chertan', 'LEO', 11.23733333, 15.4294, 3.34),
  star(4534, 'Denebola', 'LEO', 11.81766667, 14.5719, 2.14),
  star(5984, 'Acrab', 'SCO', 16.09061333, -19.8056, 2.62),
  star(5953, 'Dschubba', 'SCO', 16.00555333, -22.6217, 2.32),
  star(6134, 'Antares', 'SCO', 16.49011333, -26.4319, 0.96),
  star(6241, 'Larawag', 'SCO', 16.83605333, -34.2933, 2.29),
  star(6553, 'Sargas', 'SCO', 17.62200000, -42.9978, 1.87),
  star(6508, 'Lesath', 'SCO', 17.51272000, -37.2958, 2.69),
  star(6527, 'Shaula', 'SCO', 17.56014000, -37.1039, 1.63),
] as const);

const segment = (start: number, end: number): FirstConstellationSegment => Object.freeze({ startCatalogIdentifier: `BSC5P-HR-${start}`, endCatalogIdentifier: `BSC5P-HR-${end}` });
const figure = (identifier: FirstConstellationIdentifier, displayName: string, starHrs: readonly number[], segments: readonly FirstConstellationSegment[]): FirstConstellationFigure => Object.freeze({
  identifier,
  displayName,
  sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1',
  starCatalogIdentifiers: Object.freeze(starHrs.map((hr) => `BSC5P-HR-${hr}` as const)),
  segments: Object.freeze(segments),
});

export const FIRST_CONSTELLATION_FIGURES = Object.freeze([
  figure('ORI', 'Orion', [2061, 1790, 1852, 1903, 1948, 2004, 1713], [segment(2061, 1790), segment(2061, 1948), segment(1790, 1852), segment(1852, 1903), segment(1903, 1948), segment(1948, 2004), segment(2004, 1713), segment(1713, 1790)]),
  figure('UMA', 'Ursa Major', [4301, 4295, 4554, 4660, 4905, 5054, 5191], [segment(4301, 4295), segment(4295, 4554), segment(4554, 4660), segment(4660, 4301), segment(4660, 4905), segment(4905, 5054), segment(5054, 5191)]),
  figure('CAS', 'Cassiopeia', [21, 168, 264, 403, 542], [segment(21, 168), segment(168, 264), segment(264, 403), segment(403, 542)]),
  figure('CYG', 'Cygnus', [7924, 7796, 7417, 7949, 7528], [segment(7924, 7796), segment(7796, 7417), segment(7949, 7796), segment(7796, 7528)]),
  figure('TAU', 'Taurus', [1457, 1409, 1791, 1346, 1910], [segment(1457, 1409), segment(1409, 1791), segment(1457, 1346), segment(1346, 1910)]),
  figure('LEO', 'Leo', [3905, 4031, 4057, 3982, 4357, 4359, 4534], [segment(3905, 4031), segment(4031, 4057), segment(4057, 3982), segment(4057, 4357), segment(4357, 4534), segment(4357, 4359), segment(4359, 3982)]),
  figure('SCO', 'Scorpius', [5984, 5953, 6134, 6241, 6553, 6508, 6527], [segment(5984, 5953), segment(5953, 6134), segment(6134, 6241), segment(6241, 6553), segment(6553, 6508), segment(6508, 6527)]),
] as const);

export interface FirstConstellationDatasetValidation { readonly valid: boolean; readonly errors: readonly string[]; }
export function validateFirstConstellationDataset(): FirstConstellationDatasetValidation {
  const errors: string[] = [];
  const stars = new Map(FIRST_CONSTELLATION_STARS.map((value) => [value.catalogIdentifier, value]));
  if (stars.size !== FIRST_CONSTELLATION_STARS.length) errors.push('duplicate star catalog identifier');
  if (new Set(FIRST_CONSTELLATION_FIGURES.map((value) => value.identifier)).size !== FIRST_CONSTELLATION_FIGURES.length) errors.push('duplicate constellation identifier');
  for (const value of FIRST_CONSTELLATION_STARS) {
    if (!Number.isFinite(value.rightAscensionHours) || value.rightAscensionHours < 0 || value.rightAscensionHours >= 24) errors.push(`${value.catalogIdentifier}: invalid RA`);
    if (!Number.isFinite(value.declinationDegrees) || value.declinationDegrees < -90 || value.declinationDegrees > 90) errors.push(`${value.catalogIdentifier}: invalid declination`);
    if (value.catalogFrame !== 'EQJ_J2000' || value.catalogEpoch !== 'J2000.0' || !value.sourceReference) errors.push(`${value.catalogIdentifier}: incomplete provenance`);
  }
  for (const constellation of FIRST_CONSTELLATION_FIGURES) {
    const keys = new Set<string>();
    for (const starIdentifier of constellation.starCatalogIdentifiers) if (!stars.has(starIdentifier)) errors.push(`${constellation.identifier}: missing star ${starIdentifier}`);
    for (const value of constellation.segments) {
      if (!stars.has(value.startCatalogIdentifier) || !stars.has(value.endCatalogIdentifier)) errors.push(`${constellation.identifier}: segment references missing star`);
      if (value.startCatalogIdentifier === value.endCatalogIdentifier) errors.push(`${constellation.identifier}: degenerate segment`);
      const key = [value.startCatalogIdentifier, value.endCatalogIdentifier].sort().join('|');
      if (keys.has(key)) errors.push(`${constellation.identifier}: duplicate segment ${key}`);
      keys.add(key);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
