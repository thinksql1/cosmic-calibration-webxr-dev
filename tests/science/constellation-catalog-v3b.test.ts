import { describe, expect, it } from 'vitest';
import { CONSTELLATION_CATALOG_V2_FIGURES } from '../../src/science/constellations/constellationCatalogV2';
import { CONSTELLATION_CATALOG_V3A_FIGURES } from '../../src/science/constellations/constellationCatalogV3A';
import { COURSE_V3B_ADDITION_IDENTIFIERS } from '../../src/science/constellations/courseV3BConnectivity';
import { CONSTELLATION_CATALOG_V3B_DATASET_METADATA, CONSTELLATION_CATALOG_V3B_FIGURES, CONSTELLATION_CATALOG_V3B_STARS, COURSE_50_CONSTELLATION_IDENTIFIERS, validateConstellationCatalogV3B } from '../../src/science/constellations/constellationCatalogV3B';
import { constellationLearningGroup } from '../../src/science/constellations/constellationLearningGroups';
import { COURSE_50_CONSTELLATION_CANONICAL_GEOMETRY } from '../../src/presentation/firstConstellationLinePresentation';
import { parseConstellationStudyLaunch } from '../../src/presentation/constellationStudy';

const figure = (identifier: string) => CONSTELLATION_CATALOG_V3B_FIGURES.find((value) => value.identifier === identifier)!;
const components = (identifier: string): number => {
  const value = figure(identifier);
  const adjacency = new Map<string, Set<string>>(value.starCatalogIdentifiers.map((star) => [star, new Set<string>()]));
  for (const segment of value.segments) { adjacency.get(segment.startCatalogIdentifier)?.add(segment.endCatalogIdentifier); adjacency.get(segment.endCatalogIdentifier)?.add(segment.startCatalogIdentifier); }
  const seen = new Set<string>(); let count = 0;
  for (const star of value.starCatalogIdentifiers) if (!seen.has(star) && (adjacency.get(star)?.size ?? 0) > 0) { count += 1; const queue: string[] = [star]; seen.add(star); while (queue.length) for (const next of adjacency.get(queue.shift()!) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); } }
  return count;
};

describe('V3B course-50 difficult constellation catalog', () => {
  it('preserves the accepted catalogs and adds exactly the requested ten identifiers', () => {
    expect(CONSTELLATION_CATALOG_V3B_FIGURES).toHaveLength(50);
    expect(COURSE_50_CONSTELLATION_IDENTIFIERS).toHaveLength(50);
    expect(COURSE_V3B_ADDITION_IDENTIFIERS).toEqual(['HYA', 'ERI', 'CET', 'VUL', 'LAC', 'EQU', 'SCT', 'SER', 'LUP', 'CRU']);
    expect(CONSTELLATION_CATALOG_V3B_FIGURES.slice(0, 29)).toEqual(CONSTELLATION_CATALOG_V2_FIGURES);
    expect(CONSTELLATION_CATALOG_V3B_FIGURES.slice(0, 40)).toEqual(CONSTELLATION_CATALOG_V3A_FIGURES);
  });
  it('uses finite, unique, fully resolved NASA BSC5P records and local segments', () => {
    expect(CONSTELLATION_CATALOG_V3B_DATASET_METADATA).toMatchObject({ version: 'COSMIC_CONSTELLATION_CATALOG_V3B_COURSE_50', constellationCount: 50, starCoordinateSource: 'NASA_HEASARC_BSC5P', license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN', catalogFrame: 'EQJ_J2000', catalogEpoch: 'J2000.0' });
    expect(validateConstellationCatalogV3B()).toEqual({ valid: true, errors: [] });
    expect(new Set(CONSTELLATION_CATALOG_V3B_STARS.map((star) => star.catalogIdentifier)).size).toBe(CONSTELLATION_CATALOG_V3B_STARS.length);
    for (const star of CONSTELLATION_CATALOG_V3B_STARS) { expect(star.catalogIdentifier).toMatch(/^BSC5P-HR-\d+$/); expect(Number.isFinite(star.rightAscensionHours)).toBe(true); expect(Number.isFinite(star.declinationDegrees)).toBe(true); expect(star.sourceReference).toContain('NASA HEASARC BSC5P HR'); }
  });
  it('retains the difficult topology and separation rules', () => {
    expect(figure('HYA').segments).toHaveLength(figure('HYA').starCatalogIdentifiers.length - 1);
    expect(figure('ERI').segments).toHaveLength(figure('ERI').starCatalogIdentifiers.length - 1);
    expect(components('HYA')).toBe(1);
    expect(components('ERI')).toBe(1);
    expect(components('SER')).toBe(2);
    expect(figure('SER').segments.some((segment) => (segment.startCatalogIdentifier === 'BSC5P-HR-5842' && segment.endCatalogIdentifier === 'BSC5P-HR-6446') || (segment.startCatalogIdentifier === 'BSC5P-HR-6446' && segment.endCatalogIdentifier === 'BSC5P-HR-5842'))).toBe(false);
    expect(figure('CRU').starCatalogIdentifiers).toContain('BSC5P-HR-4730');
    for (const identifier of ['VUL', 'LAC', 'EQU', 'SCT', 'LUP', 'CET']) for (const segment of figure(identifier).segments) expect(segment.startCatalogIdentifier).not.toBe(segment.endCatalogIdentifier);
  });
  it('keeps all geometry minor-arc sampled and exposes exact Course-50 query/group behavior', () => {
    expect(COURSE_50_CONSTELLATION_CANONICAL_GEOMETRY.vertexCount).toBe(1608);
    for (const value of COURSE_50_CONSTELLATION_CANONICAL_GEOMETRY.figures) for (const segment of value.segments) { expect(segment.minorArc).toBe(true); expect(segment.maximumAdjacentAngularSeparationDegrees).toBeLessThanOrEqual(1.5); }
    expect(constellationLearningGroup('v3b-difficult-figures')?.constellationIdentifiers).toEqual(COURSE_V3B_ADDITION_IDENTIFIERS);
    expect(constellationLearningGroup('all-course-50')?.constellationIdentifiers).toEqual(COURSE_50_CONSTELLATION_IDENTIFIERS);
    expect(parseConstellationStudyLaunch('?constellationStudy=course-50&constellationGroup=v3b-difficult-figures&showConstellations=1')).toMatchObject({ mode: 'course-50', masterVisible: true, selectedGroup: 'v3b-difficult-figures' });
    expect(parseConstellationStudyLaunch('?constellationStudy=course-v3b&constellationGroup=v3b-difficult-figures').enabledConstellations).toEqual(parseConstellationStudyLaunch('?constellationStudy=course-50&constellationGroup=v3b-difficult-figures').enabledConstellations);
  });
});
