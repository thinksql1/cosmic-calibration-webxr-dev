import type { ConstellationDatasetMetadata } from './constellationCatalogTypes';

export const COSMIC_CONSTELLATION_CATALOG_V3B_COURSE_50 = 'COSMIC_CONSTELLATION_CATALOG_V3B_COURSE_50' as const;
export const CONSTELLATION_CATALOG_V3B_METADATA: Omit<ConstellationDatasetMetadata, 'constellationCount' | 'uniqueStarCount' | 'segmentCount'> = Object.freeze({
  version: COSMIC_CONSTELLATION_CATALOG_V3B_COURSE_50,
  createdDate: '2026-07-23',
  starCoordinateSource: 'NASA_HEASARC_BSC5P',
  starCoordinateSourceUrl: 'https://heasarc.gsfc.nasa.gov/W3Browse/catalog/bsc5p.html',
  sourceReference: 'Hoffleit and Warren (1991), Bright Star Catalogue, 5th Revised Edition (preliminary BSC5P); V3B HR records independently queried through NASA HEASARC Xamin.',
  license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN', licenseUrl: 'https://www.usa.gov/government-works', dataCatalogUrl: 'https://catalog.data.gov/dataset/bright-star-catalog', catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0', properMotionPolicy: 'OMITTED_FIXED_J2000_VISUAL_CATALOG',
  connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V3B',
  connectivityPolicy: 'V3B reuses accepted V2 and V3A connectivity unchanged and adds original, project-authored conventional Western instructional figures. It is not an IAU standard, boundary polygon, or imported connectivity table.',
});
