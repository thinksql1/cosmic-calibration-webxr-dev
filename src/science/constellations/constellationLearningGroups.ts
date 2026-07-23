import { EXPANDED_CONSTELLATION_IDENTIFIERS } from './constellationCatalogV2';
import { COURSE_40_CONSTELLATION_IDENTIFIERS } from './constellationCatalogV3A';
import { COURSE_50_CONSTELLATION_IDENTIFIERS, type Course50ConstellationIdentifier } from './constellationCatalogV3B';

export const CONSTELLATION_LEARNING_GROUP_IDS = Object.freeze([
  'introduction-anchors', 'circumpolar', 'winter', 'spring', 'summer', 'autumn', 'zodiac', 'all-expanded', 'added-only', 'clear',
  'north-star-and-circumpolar', 'winter-extended', 'spring-extended', 'summer-compact-figures', 'autumn-extended', 'complete-zodiac', 'orion-neighborhood', 'v3a-additions-only', 'all-course-40', 'v3b-difficult-figures', 'all-course-50',
] as const);
export type ConstellationLearningGroupId = (typeof CONSTELLATION_LEARNING_GROUP_IDS)[number];
export interface ConstellationLearningGroup { readonly id: ConstellationLearningGroupId; readonly displayName: string; readonly constellationIdentifiers: readonly Course50ConstellationIdentifier[]; }

const group = (id: ConstellationLearningGroupId, displayName: string, constellationIdentifiers: readonly Course50ConstellationIdentifier[]): ConstellationLearningGroup => Object.freeze({ id, displayName, constellationIdentifiers: Object.freeze([...constellationIdentifiers]) });

export const CONSTELLATION_LEARNING_GROUPS = Object.freeze([
  group('introduction-anchors', 'Introduction Anchors', ['ORI', 'UMA', 'CAS']),
  group('circumpolar', 'Circumpolar', ['UMA', 'CAS', 'CEP', 'DRA']),
  group('winter', 'Winter Sky', ['ORI', 'TAU', 'AUR', 'GEM', 'CMA', 'CMI', 'PER']),
  group('spring', 'Spring Sky', ['LEO', 'VIR', 'BOO', 'CRB', 'UMA']),
  group('summer', 'Summer Sky', ['CYG', 'LYR', 'AQL', 'HER', 'SCO', 'SGR', 'OPH']),
  group('autumn', 'Autumn Sky', ['AND', 'PEG', 'PER', 'ARI', 'PSC', 'CAP', 'AQR']),
  group('zodiac', 'Zodiac', ['ARI', 'TAU', 'GEM', 'LEO', 'VIR', 'LIB', 'SCO', 'SGR', 'CAP', 'AQR', 'PSC']),
  group('all-expanded', 'All Expanded Constellations', EXPANDED_CONSTELLATION_IDENTIFIERS),
  group('added-only', 'Added Constellations Only', EXPANDED_CONSTELLATION_IDENTIFIERS.filter((identifier) => !['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO'].includes(identifier))),
  group('clear', 'Clear Constellations', []),
  group('north-star-and-circumpolar', 'North Star and Circumpolar', ['UMI', 'UMA', 'CAS', 'CEP', 'DRA']),
  group('winter-extended', 'Winter Extended', ['ORI', 'TAU', 'AUR', 'GEM', 'CMA', 'CMI', 'PER', 'MON', 'LEP']),
  group('spring-extended', 'Spring Extended', ['LEO', 'VIR', 'BOO', 'CRB', 'UMA', 'CNC', 'CVN', 'COM', 'CRV', 'CRT']),
  group('summer-compact-figures', 'Summer Compact Figures', ['CYG', 'LYR', 'AQL', 'DEL', 'SGE']),
  group('autumn-extended', 'Autumn Extended', ['AND', 'PEG', 'PER', 'ARI', 'PSC', 'CAP', 'AQR', 'TRI']),
  group('complete-zodiac', 'Complete Zodiac', ['ARI', 'TAU', 'GEM', 'CNC', 'LEO', 'VIR', 'LIB', 'SCO', 'SGR', 'CAP', 'AQR', 'PSC']),
  group('orion-neighborhood', 'Orion Neighborhood', ['ORI', 'TAU', 'GEM', 'CMA', 'CMI', 'MON', 'LEP']),
  group('v3a-additions-only', 'V3A Additions Only', ['UMI', 'CNC', 'CVN', 'COM', 'CRV', 'CRT', 'MON', 'LEP', 'DEL', 'SGE', 'TRI']),
  group('all-course-40', 'All Course 40', COURSE_40_CONSTELLATION_IDENTIFIERS),
  group('v3b-difficult-figures', 'V3B Difficult Figures', ['HYA', 'ERI', 'CET', 'VUL', 'LAC', 'EQU', 'SCT', 'SER', 'LUP', 'CRU']),
  group('all-course-50', 'All Course 50', COURSE_50_CONSTELLATION_IDENTIFIERS),
]);

export function constellationLearningGroup(id: string | null | undefined): ConstellationLearningGroup | undefined {
  return CONSTELLATION_LEARNING_GROUPS.find((value) => value.id === id);
}

export function validateConstellationLearningGroups(): readonly string[] {
  const valid = new Set<string>(COURSE_50_CONSTELLATION_IDENTIFIERS);
  const errors: string[] = [];
  for (const value of CONSTELLATION_LEARNING_GROUPS) for (const identifier of value.constellationIdentifiers) if (!valid.has(identifier)) errors.push(`${value.id}: invalid identifier ${identifier}`);
  return Object.freeze(errors);
}
