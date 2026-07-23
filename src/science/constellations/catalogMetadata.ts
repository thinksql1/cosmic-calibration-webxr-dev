import type { ConstellationDatasetMetadata } from './constellationCatalogTypes';

export const COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29 = 'COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29' as const;

export const CONSTELLATION_CATALOG_V2_METADATA: Omit<ConstellationDatasetMetadata, 'constellationCount' | 'uniqueStarCount' | 'segmentCount'> = Object.freeze({
  version: COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29,
  createdDate: '2026-07-23',
  starCoordinateSource: 'NASA_HEASARC_BSC5P',
  starCoordinateSourceUrl: 'https://heasarc.gsfc.nasa.gov/W3Browse/catalog/bsc5p.html',
  sourceReference: 'Hoffleit and Warren (1991), Bright Star Catalogue, 5th Revised Edition (preliminary BSC5P); individual HR records verified through NASA HEASARC Xamin.',
  license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN',
  licenseUrl: 'https://www.usa.gov/government-works',
  dataCatalogUrl: 'https://catalog.data.gov/dataset/bright-star-catalog',
  catalogFrame: 'EQJ_J2000',
  catalogEpoch: 'J2000.0',
  properMotionPolicy: 'OMITTED_FIXED_J2000_VISUAL_CATALOG',
  connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V2',
  connectivityPolicy: 'Project-authored conventional Western stick figures select bright naked-eye anchors for recognizable course figures. Connectivity is not an IAU standard or boundary polygon; alternate cultural traditions remain future work.',
});
