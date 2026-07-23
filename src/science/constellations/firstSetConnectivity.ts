import type { RawConstellationFigure } from './constellationCatalogTypes';

export const FIRST_SET_CONSTELLATION_IDENTIFIERS = Object.freeze(['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO'] as const);
export type FirstConstellationIdentifier = (typeof FIRST_SET_CONSTELLATION_IDENTIFIERS)[number];

const figure = (
  identifier: FirstConstellationIdentifier,
  displayName: string,
  starHrs: readonly number[],
  segmentHrs: readonly (readonly [number, number])[],
  suggestedLabelAnchorHr: number,
  connectivityRationale: string,
): RawConstellationFigure<FirstConstellationIdentifier> => Object.freeze({
  identifier, displayName, starHrs: Object.freeze([...starHrs]), segmentHrs: Object.freeze([...segmentHrs]),
  suggestedLabelAnchorHr, suggestedLabelPriority: 'anchor', connectivityRationale,
});

/** Historical accepted first-set connectivity; coordinates live only in brightStarCatalog.ts. */
export const FIRST_SET_CONNECTIVITY_V1 = Object.freeze([
  figure('ORI', 'Orion', [2061, 1790, 1852, 1903, 1948, 2004, 1713], [[2061, 1790], [2061, 1948], [1790, 1852], [1852, 1903], [1903, 1948], [1948, 2004], [2004, 1713], [1713, 1790]], 2061, 'Accepted seven-star hourglass and belt form.'),
  figure('UMA', 'Ursa Major', [4301, 4295, 4554, 4660, 4905, 5054, 5191], [[4301, 4295], [4295, 4554], [4554, 4660], [4660, 4301], [4660, 4905], [4905, 5054], [5054, 5191]], 4905, 'Accepted Big Dipper bowl and handle.'),
  figure('CAS', 'Cassiopeia', [21, 168, 264, 403, 542], [[21, 168], [168, 264], [264, 403], [403, 542]], 264, 'Accepted W-shaped northern anchor.'),
  figure('CYG', 'Cygnus', [7924, 7796, 7417, 7949, 7528], [[7924, 7796], [7796, 7417], [7949, 7796], [7796, 7528]], 7796, 'Accepted Northern Cross.'),
  figure('TAU', 'Taurus', [1457, 1409, 1791, 1346, 1910], [[1457, 1409], [1409, 1791], [1457, 1346], [1346, 1910]], 1457, 'Accepted simplified Hyades horns.'),
  figure('LEO', 'Leo', [3905, 4031, 4057, 3982, 4357, 4359, 4534], [[3905, 4031], [4031, 4057], [4057, 3982], [4057, 4357], [4357, 4534], [4357, 4359], [4359, 3982]], 3982, 'Accepted sickle and body.'),
  figure('SCO', 'Scorpius', [5984, 5953, 6134, 6241, 6553, 6508, 6527], [[5984, 5953], [5953, 6134], [6134, 6241], [6241, 6553], [6553, 6508], [6508, 6527]], 6134, 'Accepted curved body and stinger.'),
] as const);
