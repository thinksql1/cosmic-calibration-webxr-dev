import type { ConstellationCatalogStar } from './constellationCatalogTypes';

const star = (hr: number, displayName: string, rightAscensionHours: number, declinationDegrees: number, visualMagnitude: number): ConstellationCatalogStar => Object.freeze({
  catalogIdentifier: `BSC5P-HR-${hr}`,
  displayName,
  rightAscensionHours,
  declinationDegrees,
  catalogFrame: 'EQJ_J2000',
  catalogEpoch: 'J2000.0',
  visualMagnitude,
  sourceReference: `NASA HEASARC BSC5P HR ${hr}`,
});

/** V3B-only canonical BSC5P records; V2 and V3A ownership remains unchanged. */
export const BRIGHT_STAR_CATALOG_V3B_ADDITIONS = Object.freeze([
  // Hydra
  star(3410, 'Delta Hydrae', 8.62761333, 5.7036, 4.16), star(3418, 'Sigma Hydrae', 8.64594667, 3.3414, 4.44), star(3454, 'Eta Hydrae', 8.72041333, 3.3986, 4.30), star(3482, 'Epsilon Hydrae', 8.77961333, 6.4189, 3.38), star(3547, 'Zeta Hydrae', 8.92322000, 5.9456, 3.11), star(3665, 'Theta Hydrae', 9.23941333, 2.3142, 3.88), star(3748, 'Alphard', 9.45978000, -8.6586, 1.98), star(3903, 'Upsilon-1 Hydrae', 9.85797333, -14.8467, 4.12), star(3994, 'Lambda Hydrae', 10.17647333, -12.3542, 3.61), star(4094, 'Mu Hydrae', 10.43483333, -16.8364, 3.81), star(4232, 'Nu Hydrae', 10.82708000, -16.1936, 3.11), star(4314, 'Chi-1 Hydrae', 11.08886000, -27.2936, 4.94), star(4450, 'Xi Hydrae', 11.55002667, -31.8578, 3.54), star(4494, 'Omicron Hydrae', 11.67022000, -34.7447, 4.70), star(4552, 'Beta Hydrae', 11.88183333, -33.9081, 4.28), star(4958, 'Psi Hydrae', 13.15091333, -23.1181, 4.95), star(5020, 'Gamma Hydrae', 13.31536000, -23.1717, 3.00), star(5287, 'Pi Hydrae', 14.10619333, -26.6825, 3.27), star(5526, '58 Hydrae', 14.83814000, -27.9603, 4.41),
  // Eridanus
  star(1666, 'Beta Eridani', 5.13083333, -5.0864, 2.79), star(1679, 'Lambda Eridani', 5.15244667, -8.7542, 4.27), star(1617, 'Psi Eridani', 5.02397333, -7.1739, 4.81), star(1560, 'Omega Eridani', 4.88158000, -5.4528, 4.39), star(1520, 'Mu Eridani', 4.75836000, -3.2547, 4.02), star(1463, 'Nu Eridani', 4.60530667, -3.3525, 3.93), star(1325, 'Omicron-2 Eridani', 4.25452667, -7.6528, 4.43), star(1298, 'Omicron-1 Eridani', 4.19775333, -6.8375, 4.04), star(1231, 'Gamma Eridani', 3.96716667, -13.5086, 2.95), star(1162, 'Pi Eridani', 3.76902667, -12.1017, 4.42), star(1136, 'Delta Eridani', 3.72080667, -9.7633, 3.54), star(1084, 'Epsilon Eridani', 3.54883333, -9.4583, 3.73), star(984, 'Zeta Eridani', 3.26388667, -8.8197, 4.80), star(917, 'Rho-2 Eridani', 3.04508667, -7.6853, 5.32), star(874, 'Eta Eridani', 2.94047333, -8.8981, 3.89), star(850, 'Tau-2 Eridani', 2.85064000, -21.0042, 4.75), star(919, 'Tau-3 Eridani', 3.03986000, -23.6244, 4.09), star(883, '4 Eridani', 2.95658667, -23.8619, 5.45), star(897, 'Theta-1 Eridani', 2.97102667, -40.3047, 3.24), star(794, 'Iota Eridani', 2.67778000, -39.8556, 4.11), star(721, 'Kappa Eridani', 2.44975333, -47.7039, 4.25), star(674, 'Phi Eridani', 2.27516667, -51.5122, 3.56), star(566, 'Chi Eridani', 1.93264000, -51.6089, 3.70), star(472, 'Achernar', 1.62858000, -57.2367, 0.46),
  // Cetus
  star(188, 'Diphda', 0.72650000, -17.9867, 2.04), star(48, '7 Ceti', 0.24400000, -18.9328, 4.44), star(74, 'Iota Ceti', 0.32380667, -8.8239, 3.56), star(334, 'Eta Ceti', 1.14316667, -10.1822, 3.45), star(402, 'Theta Ceti', 1.40038667, -8.1833, 3.60), star(539, 'Zeta Ceti', 1.85766667, -10.3350, 3.73), star(681, 'Omicron Ceti', 2.32242000, -2.9775, 3.04), star(804, 'Gamma Ceti', 2.72166667, 3.2358, 3.47), star(911, 'Menkar', 3.03800000, 4.0897, 2.53),
  // Vulpecula
  star(7306, '1 Vulpeculae', 19.27028000, 21.3903, 4.77), star(7405, 'Anser', 19.47841333, 24.6650, 4.44), star(7592, '13 Vulpeculae', 19.89102667, 24.0797, 4.58), star(7744, '23 Vulpeculae', 20.26280667, 27.8142, 4.52), star(7891, '29 Vulpeculae', 20.64202667, 21.2011, 4.82), star(7995, '31 Vulpeculae', 20.86880667, 27.0969, 4.59),
  // Lacerta
  star(8498, '1 Lacertae', 22.26616667, 37.7489, 4.13), star(8523, '2 Lacertae', 22.35044667, 46.5367, 4.57), star(8538, 'Beta Lacertae', 22.39266667, 52.2292, 4.43), star(8585, 'Alpha Lacertae', 22.52152667, 50.2825, 3.77), star(8572, '5 Lacertae', 22.49216667, 47.7069, 4.36), star(8579, '6 Lacertae', 22.50814000, 43.1233, 4.51), star(8622, '10 Lacertae', 22.65436000, 39.0503, 4.88),
  // Equuleus
  star(8097, 'Gamma Equulei', 21.17236000, 10.1317, 4.69), star(8123, 'Delta Equulei', 21.24136000, 10.0069, 4.49), star(8131, 'Kitalpha', 21.26372000, 5.2478, 3.92),
  // Scutum
  star(6884, 'Zeta Scuti', 18.39430667, -8.9342, 4.68), star(6930, 'Gamma Scuti', 18.48664000, -14.5658, 4.70), star(6973, 'Alpha Scuti', 18.58678000, -8.2442, 3.85), star(7020, 'Delta Scuti', 18.70455333, -9.0525, 4.72), star(7032, 'Epsilon Scuti', 18.72536000, -8.2753, 4.90), star(7063, 'Beta Scuti', 18.78625333, -4.7478, 4.22), star(7149, 'Eta Scuti', 18.95102667, -5.8461, 4.83),
  // Serpens Caput then Serpens Cauda
  star(5788, 'Delta Serpentis', 15.58002667, 10.5375, 3.80), star(5842, 'Iota Serpentis', 15.69252667, 19.6703, 4.52), star(5854, 'Unukalhai', 15.73780667, 6.4256, 2.65), star(5867, 'Beta Serpentis', 15.76980667, 15.4219, 3.67), star(5868, 'Lambda Serpentis', 15.77405333, 7.3531, 4.43), star(5879, 'Kappa Serpentis', 15.81233333, 18.1417, 4.09), star(5892, 'Epsilon Serpentis', 15.84694667, 4.4778, 3.71), star(5933, 'Gamma Serpentis', 15.94088667, 15.6617, 3.85), star(6446, 'Nu Serpentis', 17.34714000, -12.8469, 4.33), star(6561, 'Xi Serpentis', 17.62644667, -15.3986, 3.54), star(6581, 'Omicron Serpentis', 17.69025333, -12.8753, 4.26), star(6710, 'Zeta Serpentis', 18.00805333, -3.6903, 4.62), star(6869, 'Eta Serpentis', 18.35516667, -2.8989, 3.26), star(7141, 'Theta-1 Serpentis', 18.93700000, 4.2036, 4.62),
  // Lupus
  star(5354, 'Iota Lupi', 14.32338667, -46.0578, 3.55), star(5396, 'Tau-2 Lupi', 14.43633333, -45.3794, 4.35), star(5425, 'Sigma Lupi', 14.54358000, -50.4569, 4.42), star(5453, 'Rho Lupi', 14.63144667, -49.4258, 4.05), star(5469, 'Alpha Lupi', 14.69883333, -47.3883, 2.30), star(5571, 'Beta Lupi', 14.97552667, -43.1339, 2.68), star(5695, 'Delta Lupi', 15.35619333, -40.6475, 3.22), star(5776, 'Gamma Lupi', 15.58569333, -41.1669, 2.78),
  // Crux
  star(4599, 'Theta-1 Crucis', 12.05042000, -63.3128, 4.33), star(4656, 'Delta Crucis', 12.25242000, -58.7489, 2.80), star(4730, 'Acrux', 12.44330667, -63.0992, 1.33), star(4763, 'Gacrux', 12.51941333, -57.1133, 1.63), star(4853, 'Mimosa', 12.79533333, -59.6886, 1.25),
] as const);
