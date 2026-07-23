import { describe, expect, it } from 'vitest';
import {
  CONSTELLATION_CATALOG_V2_DATASET_METADATA,
  CONSTELLATION_CATALOG_V2_FIGURES,
  CONSTELLATION_CATALOG_V2_STARS,
  EXPANDED_CONSTELLATION_IDENTIFIERS,
  validateConstellationCatalogV2,
} from '../../src/science/constellations/constellationCatalogV2';

describe('expanded V2 constellation catalog', () => {
  it('defines the requested 29 unique figures, including Libra for the coherent zodiac group', () => {
    expect(EXPANDED_CONSTELLATION_IDENTIFIERS).toHaveLength(29);
    expect(EXPANDED_CONSTELLATION_IDENTIFIERS).toContain('LIB');
    expect(CONSTELLATION_CATALOG_V2_FIGURES).toHaveLength(29);
    expect(new Set(CONSTELLATION_CATALOG_V2_FIGURES.map((value) => value.identifier)).size).toBe(29);
    expect(new Set(CONSTELLATION_CATALOG_V2_FIGURES.map((value) => value.displayName)).size).toBe(29);
  });

  it('uses one canonical finite EQJ/J2000 star record per catalog identifier and complete provenance', () => {
    expect(new Set(CONSTELLATION_CATALOG_V2_STARS.map((value) => value.catalogIdentifier)).size).toBe(CONSTELLATION_CATALOG_V2_STARS.length);
    for (const star of CONSTELLATION_CATALOG_V2_STARS) {
      expect(star.rightAscensionHours).toBeGreaterThanOrEqual(0);
      expect(star.rightAscensionHours).toBeLessThan(24);
      expect(star.declinationDegrees).toBeGreaterThanOrEqual(-90);
      expect(star.declinationDegrees).toBeLessThanOrEqual(90);
      expect(star).toMatchObject({ catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0' });
      expect(star.sourceReference).toContain('NASA HEASARC BSC5P HR');
    }
    expect(CONSTELLATION_CATALOG_V2_DATASET_METADATA).toMatchObject({
      version: 'COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29',
      starCoordinateSource: 'NASA_HEASARC_BSC5P',
      license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN',
      catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0',
    });
  });

  it('validates connectivity references, duplicate prevention, and local segment integrity', () => {
    expect(validateConstellationCatalogV2()).toEqual({ valid: true, errors: [] });
    for (const figure of CONSTELLATION_CATALOG_V2_FIGURES) {
      expect(figure.connectivityRationale.length).toBeGreaterThan(0);
      expect(figure.segments.every((segment) => segment.startCatalogIdentifier !== segment.endCatalogIdentifier)).toBe(true);
    }
  });
});
