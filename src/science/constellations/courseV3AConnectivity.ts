import type { RawConstellationFigure } from './constellationCatalogTypes';

export const COURSE_V3A_ADDITION_IDENTIFIERS = Object.freeze([
  'UMI', 'CNC', 'CVN', 'COM', 'CRV', 'CRT', 'MON', 'LEP', 'DEL', 'SGE', 'TRI',
] as const);
export type CourseV3AAdditionIdentifier = (typeof COURSE_V3A_ADDITION_IDENTIFIERS)[number];

const figure = (identifier: CourseV3AAdditionIdentifier, displayName: string, starHrs: readonly number[], segmentHrs: readonly (readonly [number, number])[], anchor: number, rationale: string): RawConstellationFigure<CourseV3AAdditionIdentifier> => Object.freeze({
  identifier, displayName, starHrs: Object.freeze([...starHrs]), segmentHrs: Object.freeze([...segmentHrs]), suggestedLabelAnchorHr: anchor, suggestedLabelPriority: 'standard', connectivityRationale: rationale,
});

/** Original project-authored V3A instructional connectivity over canonical BSC5P anchors. */
export const COURSE_V3A_CONNECTIVITY = Object.freeze([
  figure('UMI', 'Ursa Minor', [424, 6789, 6322, 5903, 6116, 5735, 5563], [[424, 6789], [6789, 6322], [6322, 5903], [5903, 6116], [6116, 5735], [5735, 5563], [5563, 5903]], 424, 'Little Dipper handle terminates at Polaris; the four remaining segments form the restrained bowl.'),
  figure('CNC', 'Cancer', [3249, 3449, 3461, 3475, 3572], [[3572, 3449], [3449, 3461], [3461, 3249], [3449, 3475]], 3249, 'Restrained faint-star zigzag with the Iota branch; it deliberately avoids a prominent artificial crab outline.'),
  figure('CVN', 'Canes Venatici', [4915, 4785], [[4915, 4785]], 4915, 'The Cor Caroli–Chara pair is the clearest sparse instructional form; no elaborate hunting-dog drawing is implied.'),
  figure('COM', 'Coma Berenices', [4737, 4968, 4983], [[4737, 4983], [4983, 4968]], 4983, 'A small open three-star cluster-region trace, not an attempt to draw the full Coma cluster.'),
  figure('CRV', 'Corvus', [4630, 4662, 4757, 4786], [[4630, 4662], [4662, 4757], [4757, 4786], [4786, 4630]], 4662, 'Compact four-star quadrilateral, intentionally isolated from Crater and the future Hydra figure.'),
  figure('CRT', 'Crater', [4287, 4343, 4382, 4405], [[4287, 4343], [4343, 4405], [4405, 4382], [4382, 4287]], 4287, 'A four-anchor cup-like outline with no external or decorative connections.'),
  figure('MON', 'Monoceros', [2227, 2356, 2970, 3188, 2714], [[2227, 2356], [2356, 2970], [2970, 3188], [3188, 2714]], 2970, 'Sparse central-Unicorn route providing Orion-neighborhood structure without attaching to Orion.'),
  figure('LEP', 'Lepus', [1654, 1829, 1865, 1983, 1998, 2035], [[1654, 1829], [1829, 1865], [1865, 1998], [1829, 1983], [1983, 2035], [2035, 1865]], 1865, 'Compact rabbit body and ears drawn in true-sky coordinates below Orion; no Orion segment is present.'),
  figure('DEL', 'Delphinus', [7852, 7882, 7906, 7928, 7948], [[7906, 7882], [7882, 7928], [7928, 7948], [7948, 7906], [7882, 7852]], 7906, 'The compact diamond core and its short Epsilon extension retain the immediately recognizable dolphin/coffin form.'),
  figure('SGE', 'Sagitta', [7479, 7488, 7536, 7635], [[7479, 7488], [7488, 7536], [7536, 7635], [7488, 7635]], 7635, 'Minimal arrow shaft and feathered tail; the open layout avoids a dense compact web.'),
  figure('TRI', 'Triangulum', [544, 622, 664], [[544, 622], [622, 664], [664, 544]], 544, 'The conventional three-anchor triangle, with no added internal segment.'),
] as const);
