/**
 * Compatibility facade for the physically accepted first seven figures.
 * Coordinates are owned once by the expanded V2 catalog.
 */
import {
  CONSTELLATION_CATALOG_V2_DATASET_METADATA,
  FIRST_CONSTELLATION_FIGURES,
  FIRST_CONSTELLATION_STARS,
  validateConstellationCatalogV2,
  type ConstellationCatalogStar,
  type ConstellationFigure,
} from './constellationCatalogV2';
import { FIRST_SET_CONSTELLATION_IDENTIFIERS, type FirstConstellationIdentifier } from './firstSetConnectivity';

export const FIRST_CONSTELLATION_IDENTIFIERS = FIRST_SET_CONSTELLATION_IDENTIFIERS;
export type { FirstConstellationIdentifier };
export type FirstConstellationCatalogStar = ConstellationCatalogStar;
export type FirstConstellationSegment = ConstellationFigure['segments'][number];
export type FirstConstellationFigure = ConstellationFigure<FirstConstellationIdentifier>;
export { FIRST_CONSTELLATION_FIGURES, FIRST_CONSTELLATION_STARS };
export const FIRST_CONSTELLATION_DATASET_METADATA = Object.freeze({
  ...CONSTELLATION_CATALOG_V2_DATASET_METADATA,
  version: '1.0.0-accepted-subset-within-v2',
  connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1',
  properMotionPolicy: 'OMITTED_FIXED_J2000_VISUAL_CATALOG',
});
export interface FirstConstellationDatasetValidation { readonly valid: boolean; readonly errors: readonly string[]; }
export function validateFirstConstellationDataset(): FirstConstellationDatasetValidation {
  const all = validateConstellationCatalogV2();
  const errors = all.errors.filter((error) => FIRST_CONSTELLATION_IDENTIFIERS.some((identifier) => error.startsWith(`${identifier}:`)) || error === 'duplicate star catalog identifier');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
