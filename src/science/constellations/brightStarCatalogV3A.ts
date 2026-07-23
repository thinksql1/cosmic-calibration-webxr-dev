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

/** V3A-only canonical BSC5P records; V2 records remain owned by brightStarCatalog.ts. */
export const BRIGHT_STAR_CATALOG_V3A_ADDITIONS = Object.freeze([
  star(424, 'Polaris', 2.53019333, 89.2642, 2.02), star(6789, 'Yildun', 17.53691333, 86.5864, 4.36), star(6322, 'Epsilon Ursae Minoris', 16.76614000, 82.0372, 4.23), star(5903, 'Zeta Ursae Minoris', 15.73430667, 77.7944, 4.32), star(6116, 'Eta Ursae Minoris', 16.29175333, 75.7553, 4.95), star(5735, 'Pherkad', 15.34547333, 71.8339, 3.05), star(5563, 'Kochab', 14.84508667, 74.1556, 2.08),
  star(3249, 'Altarf', 8.27525333, 9.1856, 3.52), star(3449, 'Asellus Borealis', 8.72141333, 21.4686, 4.66), star(3461, 'Asellus Australis', 8.74474667, 18.1542, 3.94), star(3475, 'Iota Cancri', 8.77828000, 28.7600, 4.02), star(3572, 'Acubens', 8.97478000, 11.8578, 4.25),
  star(4915, 'Cor Caroli', 12.93380667, 38.3183, 2.90), star(4785, 'Chara', 12.56236000, 41.3575, 4.26),
  star(4737, 'Gamma Comae Berenices', 12.44897333, 28.2683, 4.36), star(4968, 'Diadem', 13.16647333, 17.5294, 5.22), star(4983, 'Beta Comae Berenices', 13.19788667, 27.8781, 4.26),
  star(4630, 'Minkar', 12.16874667, -22.6197, 3.00), star(4662, 'Gienah', 12.26344667, -17.5419, 2.59), star(4757, 'Algorab', 12.49774667, -16.5156, 2.95), star(4786, 'Kraz', 12.57311333, -23.3967, 2.65),
  star(4287, 'Alkes', 10.99625333, -18.2989, 4.08), star(4343, 'Beta Crateris', 11.19430667, -22.8258, 4.48), star(4382, 'Labrum', 11.32236000, -14.7786, 3.56), star(4405, 'Gamma Crateris', 11.41469333, -17.6839, 4.08),
  star(2227, 'Gamma Monocerotis', 6.24758667, -6.2747, 3.98), star(2356, 'Beta Monocerotis', 6.48028000, -7.0328, 4.60), star(2714, 'Delta Monocerotis', 7.19774667, -0.4928, 4.15), star(2970, 'Alpha Monocerotis', 7.68744667, -9.5511, 3.93), star(3188, 'Zeta Monocerotis', 8.14322000, -2.9839, 4.34),
  star(1654, 'Epsilon Leporis', 5.09102667, -22.3711, 3.19), star(1829, 'Nihal', 5.47074667, -20.7594, 2.84), star(1865, 'Arneb', 5.54550000, -17.8222, 2.58), star(1983, 'Gamma Leporis', 5.74105333, -22.4483, 3.60), star(1998, 'Zeta Leporis', 5.78258000, -14.8219, 3.55), star(2035, 'Delta Leporis', 5.85536000, -20.8792, 3.81),
  star(7852, 'Epsilon Delphini', 20.55355333, 11.3033, 4.03), star(7882, 'Rotanev', 20.62583333, 14.5953, 3.63), star(7906, 'Sualocin', 20.66064000, 15.9119, 3.77), star(7928, 'Delta Delphini', 20.72430667, 15.0744, 4.43), star(7948, 'Gamma Delphini', 20.77764000, 16.1242, 4.27),
  star(7479, 'Sham', 19.66828000, 18.0139, 4.37), star(7488, 'Beta Sagittae', 19.68414000, 17.4761, 4.37), star(7536, 'Delta Sagittae', 19.78980667, 18.5342, 3.82), star(7635, 'Gamma Sagittae', 19.97928000, 19.4922, 3.47),
  star(544, 'Mothallah', 1.88469333, 29.5789, 3.41), star(622, 'Beta Trianguli', 2.15905333, 34.9872, 3.00), star(664, 'Gamma Trianguli', 2.28858667, 33.8472, 4.01),
] as const);
