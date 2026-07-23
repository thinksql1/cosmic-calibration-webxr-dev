import type { RawConstellationFigure } from './constellationCatalogTypes';

export const EXPANDED_ADDITION_IDENTIFIERS = Object.freeze([
  'CEP', 'DRA', 'AUR', 'GEM', 'CMA', 'CMI', 'VIR', 'BOO', 'CRB', 'LYR', 'AQL', 'HER', 'SGR', 'OPH', 'AND', 'PEG', 'PER', 'ARI', 'PSC', 'CAP', 'AQR', 'LIB',
] as const);
export type ExpandedAdditionIdentifier = (typeof EXPANDED_ADDITION_IDENTIFIERS)[number];

const figure = (identifier: ExpandedAdditionIdentifier, displayName: string, starHrs: readonly number[], segmentHrs: readonly (readonly [number, number])[], anchor: number, rationale: string): RawConstellationFigure<ExpandedAdditionIdentifier> => Object.freeze({
  identifier, displayName, starHrs: Object.freeze([...starHrs]), segmentHrs: Object.freeze([...segmentHrs]), suggestedLabelAnchorHr: anchor, suggestedLabelPriority: 'standard', connectivityRationale: rationale,
});

/** Project-authored instructional connectivity using verified BSC5P bright-star anchors. */
export const EXPANDED_SET_CONNECTIVITY_V2 = Object.freeze([
  figure('CEP', 'Cepheus', [8162, 8238, 8417, 8571, 8974], [[8162, 8238], [8238, 8417], [8417, 8571], [8571, 8974], [8974, 8238]], 8162, 'Simplified house form centered on Alderamin and Errai.'),
  figure('DRA', 'Draco', [5291, 4434, 6536, 6705, 7310], [[5291, 4434], [4434, 6536], [6536, 6705], [6705, 7310]], 6705, 'Bright-star northern dragon spine, intentionally sparse.'),
  figure('AUR', 'Auriga', [1708, 2088, 1605, 1791], [[1708, 2088], [2088, 1605], [1605, 1791], [1791, 1708]], 1708, 'Capella-centered quadrilateral; Elnath is a shared Taurus/Auriga anchor.'),
  figure('GEM', 'Gemini', [2891, 2990, 2421, 2484, 2650, 2286], [[2891, 2990], [2891, 2421], [2421, 2484], [2484, 2650], [2650, 2286], [2286, 2421]], 2990, 'Twin heads and simplified paired body lines.'),
  figure('CMA', 'Canis Major', [2491, 2618, 2646, 2693, 2827], [[2491, 2618], [2618, 2646], [2646, 2693], [2693, 2827]], 2491, 'Sirius-led bright southern dog spine.'),
  figure('CMI', 'Canis Minor', [2943, 2845], [[2943, 2845]], 2943, 'Minimal traditional Procyon–Gomeisa pair.'),
  figure('VIR', 'Virgo', [5056, 4825, 4932, 4689, 4540, 5338], [[4540, 4689], [4689, 4825], [4825, 4932], [4825, 5056], [5056, 5338]], 5056, 'Simplified Virgo bowl and Spica extension.'),
  figure('BOO', 'Boötes', [5340, 5506, 5429, 5681, 5602, 5733], [[5340, 5506], [5506, 5429], [5429, 5602], [5602, 5681], [5681, 5733]], 5340, 'Arcturus-led kite with a northern handle.'),
  figure('CRB', 'Corona Borealis', [5793, 5747, 5849, 5889], [[5747, 5793], [5793, 5849], [5849, 5889]], 5793, 'Restrained crown arc; intentionally not a dense semicircle.'),
  figure('LYR', 'Lyra', [7001, 7106, 7178, 7056], [[7001, 7056], [7056, 7106], [7106, 7178], [7178, 7001]], 7001, 'Vega-centered compact parallelogram.'),
  figure('AQL', 'Aquila', [7557, 7525, 7595, 7377], [[7525, 7557], [7557, 7595], [7557, 7377]], 7557, 'Altair with the conventional flanking wings.'),
  figure('HER', 'Hercules', [6148, 6406, 6212, 6695, 6410, 6418], [[6148, 6212], [6212, 6695], [6695, 6418], [6418, 6410], [6410, 6406]], 6148, 'Bright-anchor keystone and body route, deliberately simplified.'),
  figure('SGR', 'Sagittarius', [6746, 6859, 6879, 7121, 7194], [[6746, 6859], [6859, 6879], [6859, 7121], [7121, 7194], [7194, 6879]], 6859, 'Compact Teapot-inspired instructional outline.'),
  figure('OPH', 'Ophiuchus', [6556, 6603, 6378, 6056, 6075], [[6556, 6603], [6603, 6075], [6075, 6056], [6056, 6378]], 6556, 'Rasalhague-to-Yed simplified serpent-bearer line.'),
  figure('AND', 'Andromeda', [15, 337, 603, 269], [[15, 337], [337, 269], [269, 603]], 337, 'Alpheratz–Mirach–Almach chain with a visible branch.'),
  figure('PEG', 'Pegasus', [15, 39, 8775, 8781, 8308], [[15, 39], [39, 8781], [8781, 8775], [8775, 15], [8781, 8308]], 8781, 'Great Square plus Enif extension; Alpheratz is shared with Andromeda.'),
  figure('PER', 'Perseus', [936, 1017, 1220, 1131], [[936, 1017], [1017, 1220], [1220, 1131]], 1017, 'Mirfak-led simplified Perseus route.'),
  figure('ARI', 'Aries', [617, 553, 546], [[617, 553], [553, 546]], 617, 'Traditional three-star ram line.'),
  figure('PSC', 'Pisces', [596, 8773, 8852, 8969, 8916], [[8773, 8852], [8852, 8969], [8969, 8916], [8916, 596]], 596, 'Deliberately sparse two-fish bridge across the RA wrap.'),
  figure('CAP', 'Capricornus', [7754, 7776, 8204, 8278, 8322], [[7754, 7776], [7776, 8204], [8204, 8278], [8278, 8322]], 7776, 'Bright-star sea-goat route with no implied boundary.'),
  figure('AQR', 'Aquarius', [8232, 8414, 7950, 8499], [[7950, 8232], [8232, 8414], [8414, 8499]], 8232, 'Sparse water-bearer chain joining its brightest anchors.'),
  figure('LIB', 'Libra', [5531, 5685, 5603, 5787], [[5531, 5685], [5685, 5787], [5787, 5603], [5603, 5531]], 5685, 'Balanced quadrilateral included for a coherent zodiac learning group.'),
] as const);
