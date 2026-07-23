import { EXPANDED_CONSTELLATION_IDENTIFIERS, type ExpandedConstellationIdentifier } from './constellationCatalogV2';

export const CONSTELLATION_LEARNING_GROUP_IDS = Object.freeze([
  'introduction-anchors', 'circumpolar', 'winter', 'spring', 'summer', 'autumn', 'zodiac', 'all-expanded', 'added-only', 'clear',
] as const);
export type ConstellationLearningGroupId = (typeof CONSTELLATION_LEARNING_GROUP_IDS)[number];
export interface ConstellationLearningGroup { readonly id: ConstellationLearningGroupId; readonly displayName: string; readonly constellationIdentifiers: readonly ExpandedConstellationIdentifier[]; }

const group = (id: ConstellationLearningGroupId, displayName: string, constellationIdentifiers: readonly ExpandedConstellationIdentifier[]): ConstellationLearningGroup => Object.freeze({ id, displayName, constellationIdentifiers: Object.freeze([...constellationIdentifiers]) });

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
]);

export function constellationLearningGroup(id: string | null | undefined): ConstellationLearningGroup | undefined {
  return CONSTELLATION_LEARNING_GROUPS.find((value) => value.id === id);
}

export function validateConstellationLearningGroups(): readonly string[] {
  const valid = new Set<string>(EXPANDED_CONSTELLATION_IDENTIFIERS);
  const errors: string[] = [];
  for (const value of CONSTELLATION_LEARNING_GROUPS) for (const identifier of value.constellationIdentifiers) if (!valid.has(identifier)) errors.push(`${value.id}: invalid identifier ${identifier}`);
  return Object.freeze(errors);
}
