import { describe, expect, it } from 'vitest';
import {
  FIRST_CONSTELLATION_DATASET_METADATA,
  FIRST_CONSTELLATION_FIGURES,
  FIRST_CONSTELLATION_IDENTIFIERS,
  FIRST_CONSTELLATION_STARS,
  validateFirstConstellationDataset,
} from '../../src/science/constellations/firstConstellationCatalog';

describe('first-set constellation catalog', () => {
  it('defines exactly seven unique constellations and a unique typed star subset', () => {
    expect(FIRST_CONSTELLATION_IDENTIFIERS).toEqual(['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO']);
    expect(FIRST_CONSTELLATION_FIGURES).toHaveLength(7);
    expect(new Set(FIRST_CONSTELLATION_FIGURES.map(({ identifier }) => identifier)).size).toBe(7);
    expect(new Set(FIRST_CONSTELLATION_STARS.map(({ catalogIdentifier }) => catalogIdentifier)).size).toBe(FIRST_CONSTELLATION_STARS.length);
  });

  it('keeps every catalog coordinate finite, valid, and explicitly EQJ/J2000', () => {
    for (const star of FIRST_CONSTELLATION_STARS) {
      expect(star.rightAscensionHours).toBeGreaterThanOrEqual(0);
      expect(star.rightAscensionHours).toBeLessThan(24);
      expect(star.declinationDegrees).toBeGreaterThanOrEqual(-90);
      expect(star.declinationDegrees).toBeLessThanOrEqual(90);
      expect([star.rightAscensionHours, star.declinationDegrees, star.visualMagnitude].every(Number.isFinite)).toBe(true);
      expect(star).toMatchObject({ catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0' });
      expect(star.sourceReference).toContain('NASA HEASARC BSC5P HR');
    }
  });

  it('validates all segment references without degeneracy or duplicates', () => {
    expect(validateFirstConstellationDataset()).toEqual({ valid: true, errors: [] });
    const stars = new Set(FIRST_CONSTELLATION_STARS.map(({ catalogIdentifier }) => catalogIdentifier));
    for (const figure of FIRST_CONSTELLATION_FIGURES) {
      const keys = new Set<string>();
      for (const segment of figure.segments) {
        expect(stars.has(segment.startCatalogIdentifier)).toBe(true);
        expect(stars.has(segment.endCatalogIdentifier)).toBe(true);
        expect(segment.startCatalogIdentifier).not.toBe(segment.endCatalogIdentifier);
        const key = [segment.startCatalogIdentifier, segment.endCatalogIdentifier].sort().join('|');
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
    }
  });

  it('records public-domain provenance and an explicit conventional connectivity policy', () => {
    expect(FIRST_CONSTELLATION_DATASET_METADATA).toMatchObject({
      starCoordinateSource: 'NASA_HEASARC_BSC5P',
      license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN',
      catalogFrame: 'EQJ_J2000',
      catalogEpoch: 'J2000.0',
      properMotionPolicy: 'OMITTED_FIXED_J2000_FIRST_VISUAL_LAYER',
      connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1',
    });
    expect(FIRST_CONSTELLATION_DATASET_METADATA.starCoordinateSourceUrl).toMatch(/^https:\/\/heasarc\.gsfc\.nasa\.gov/);
    expect(FIRST_CONSTELLATION_STARS.every(({ displayName }) => !['Sun', 'Moon', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(displayName))).toBe(true);
  });
});
