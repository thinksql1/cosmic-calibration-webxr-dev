import { describe, expect, it } from 'vitest';
import { COURSE_V3A_ADDITION_IDENTIFIERS } from '../../src/science/constellations/courseV3AConnectivity';
import { CONSTELLATION_CATALOG_V2_FIGURES, CONSTELLATION_CATALOG_V2_STARS } from '../../src/science/constellations/constellationCatalogV2';
import { CONSTELLATION_CATALOG_V3A_DATASET_METADATA, CONSTELLATION_CATALOG_V3A_FIGURES, CONSTELLATION_CATALOG_V3A_STARS, COURSE_40_CONSTELLATION_IDENTIFIERS, validateConstellationCatalogV3A } from '../../src/science/constellations/constellationCatalogV3A';
import { constellationLearningGroup } from '../../src/science/constellations/constellationLearningGroups';

describe('V3A course-40 constellation catalog', () => {
  it('preserves V2 and adds exactly the specified eleven figures', () => {
    expect(CONSTELLATION_CATALOG_V2_FIGURES).toHaveLength(29);
    expect(CONSTELLATION_CATALOG_V3A_FIGURES).toHaveLength(40);
    expect(COURSE_40_CONSTELLATION_IDENTIFIERS).toHaveLength(40);
    expect(COURSE_V3A_ADDITION_IDENTIFIERS).toEqual(['UMI', 'CNC', 'CVN', 'COM', 'CRV', 'CRT', 'MON', 'LEP', 'DEL', 'SGE', 'TRI']);
    expect(CONSTELLATION_CATALOG_V3A_FIGURES.slice(0, 29)).toEqual(CONSTELLATION_CATALOG_V2_FIGURES);
  });
  it('uses canonical, finite, public-domain BSC5P records without duplicating V2 stars', () => {
    expect(CONSTELLATION_CATALOG_V3A_DATASET_METADATA).toMatchObject({ version: 'COSMIC_CONSTELLATION_CATALOG_V3A_COURSE_40', starCoordinateSource: 'NASA_HEASARC_BSC5P', license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN', catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0' });
    expect(new Set(CONSTELLATION_CATALOG_V3A_STARS.map((star) => star.catalogIdentifier)).size).toBe(CONSTELLATION_CATALOG_V3A_STARS.length);
    for (const star of CONSTELLATION_CATALOG_V3A_STARS) {
      expect(star.catalogIdentifier).toMatch(/^BSC5P-HR-\d+$/);
      expect(Number.isFinite(star.rightAscensionHours)).toBe(true);
      expect(Number.isFinite(star.declinationDegrees)).toBe(true);
      expect(star.sourceReference).toContain('NASA HEASARC BSC5P HR');
    }
    for (const star of CONSTELLATION_CATALOG_V2_STARS) expect(CONSTELLATION_CATALOG_V3A_STARS.find((candidate) => candidate.catalogIdentifier === star.catalogIdentifier)).toBe(star);
  });
  it('keeps connectivity local, non-degenerate, and reviewed', () => {
    expect(validateConstellationCatalogV3A()).toEqual({ valid: true, errors: [] });
    for (const figure of CONSTELLATION_CATALOG_V3A_FIGURES) {
      expect(figure.segments.length).toBeGreaterThan(0);
      const keys = new Set<string>();
      for (const segment of figure.segments) {
        expect(segment.startCatalogIdentifier).not.toBe(segment.endCatalogIdentifier);
        expect(figure.starCatalogIdentifiers).toContain(segment.startCatalogIdentifier);
        expect(figure.starCatalogIdentifiers).toContain(segment.endCatalogIdentifier);
        const key = [segment.startCatalogIdentifier, segment.endCatalogIdentifier].sort().join('|');
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
    }
  });
  it('supplies complete V3A learning groups with the required exact counts', () => {
    expect(constellationLearningGroup('complete-zodiac')?.constellationIdentifiers).toHaveLength(12);
    expect(constellationLearningGroup('complete-zodiac')?.constellationIdentifiers).toContain('CNC');
    expect(constellationLearningGroup('v3a-additions-only')?.constellationIdentifiers).toEqual(COURSE_V3A_ADDITION_IDENTIFIERS);
    expect(constellationLearningGroup('all-course-40')?.constellationIdentifiers).toEqual(COURSE_40_CONSTELLATION_IDENTIFIERS);
    expect(constellationLearningGroup('north-star-and-circumpolar')?.constellationIdentifiers).toEqual(['UMI', 'UMA', 'CAS', 'CEP', 'DRA']);
  });
  it('keeps requested separation and figure-specific forms', () => {
    const figure = (identifier: string) => CONSTELLATION_CATALOG_V3A_FIGURES.find((value) => value.identifier === identifier)!;
    expect(figure('UMI').starCatalogIdentifiers).toContain('BSC5P-HR-424');
    expect(figure('UMI').segments.some((segment) => segment.startCatalogIdentifier === 'BSC5P-HR-424' || segment.endCatalogIdentifier === 'BSC5P-HR-424')).toBe(true);
    expect(figure('CRV').segments.every((segment) => !figure('CRT').starCatalogIdentifiers.includes(segment.startCatalogIdentifier) && !figure('CRT').starCatalogIdentifiers.includes(segment.endCatalogIdentifier))).toBe(true);
    expect(figure('MON').segments.every((segment) => !figure('ORI').starCatalogIdentifiers.includes(segment.startCatalogIdentifier) && !figure('ORI').starCatalogIdentifiers.includes(segment.endCatalogIdentifier))).toBe(true);
    expect(figure('LEP').segments.every((segment) => !figure('ORI').starCatalogIdentifiers.includes(segment.startCatalogIdentifier) && !figure('ORI').starCatalogIdentifiers.includes(segment.endCatalogIdentifier))).toBe(true);
    expect(figure('DEL').segments).toHaveLength(5);
    expect(figure('SGE').segments).toHaveLength(4);
    expect(figure('TRI').segments).toHaveLength(3);
  });
});
