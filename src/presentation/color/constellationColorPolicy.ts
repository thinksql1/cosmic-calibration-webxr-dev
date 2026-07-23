import type { Course40ConstellationIdentifier } from '../../science/constellations/constellationCatalogV3A';
import { constellationLearningGroup, type ConstellationLearningGroupId } from '../../science/constellations/constellationLearningGroups';
import { CELESTIAL_COLOR_TOKENS, type CelestialColorToken } from './celestialColorTokens';
import { constellationBaseSwatch, constellationHighlightSwatch, deriveConstellationContext, type ConstellationBaseColorId, type ConstellationHighlightColorId } from './celestialColorCatalog';
import type { ConstellationColorMode, ConstellationColorStrength } from './celestialColorModes';

export type ConstellationPrimaryColorGroup = 'circumpolar' | 'winter' | 'spring' | 'summer' | 'autumn' | 'zodiac';
/** Stable palette ownership. Introduction Anchors is deliberately a selection preset, not a permanent hue. */
export const CONSTELLATION_PRIMARY_COLOR_GROUP: Readonly<Record<Course40ConstellationIdentifier, ConstellationPrimaryColorGroup>> = Object.freeze({
  ORI: 'winter', UMA: 'circumpolar', CAS: 'circumpolar', CYG: 'summer', TAU: 'winter', LEO: 'spring', SCO: 'summer',
  CEP: 'circumpolar', DRA: 'circumpolar', AUR: 'winter', GEM: 'winter', CMA: 'winter', CMI: 'winter',
  VIR: 'spring', BOO: 'spring', CRB: 'spring', LYR: 'summer', AQL: 'summer', HER: 'summer', SGR: 'summer', OPH: 'summer',
  AND: 'autumn', PEG: 'autumn', PER: 'winter', ARI: 'zodiac', PSC: 'zodiac', CAP: 'zodiac', AQR: 'zodiac', LIB: 'zodiac',
  UMI: 'circumpolar', CNC: 'zodiac', CVN: 'spring', COM: 'spring', CRV: 'spring', CRT: 'spring', MON: 'winter', LEP: 'winter', DEL: 'summer', SGE: 'summer', TRI: 'autumn',
});
const groupToken: Readonly<Record<ConstellationPrimaryColorGroup | 'introduction-anchors', CelestialColorToken>> = Object.freeze({
  'introduction-anchors': CELESTIAL_COLOR_TOKENS.introduction, circumpolar: CELESTIAL_COLOR_TOKENS.circumpolar,
  winter: CELESTIAL_COLOR_TOKENS.winter, spring: CELESTIAL_COLOR_TOKENS.spring, summer: CELESTIAL_COLOR_TOKENS.summer,
  autumn: CELESTIAL_COLOR_TOKENS.autumn, zodiac: CELESTIAL_COLOR_TOKENS.zodiac,
});
const strengthOpacity = Object.freeze({ subtle: Object.freeze({ selected: 0.52, context: 0.30, palette: 0.48 }), standard: Object.freeze({ selected: 0.62, context: 0.20, palette: 0.56 }), vivid: Object.freeze({ selected: 0.72, context: 0.14, palette: 0.66 }) });
export interface ResolvedConstellationColor { readonly token: CelestialColorToken; readonly opacity: number; readonly role: 'unified' | 'selected-group' | 'context' | 'primary-group'; readonly colorSource: string; }
export function resolveConstellationColor(identifier: Course40ConstellationIdentifier, mode: ConstellationColorMode, strength: ConstellationColorStrength, selectedGroupId: ConstellationLearningGroupId | undefined, baseColorId: ConstellationBaseColorId = 'celestial-lavender', highlightColorId: ConstellationHighlightColorId = 'observation-orange'): ResolvedConstellationColor {
  const base = constellationBaseSwatch(baseColorId)?.token ?? CELESTIAL_COLOR_TOKENS.constellationUnified;
  const highlight = constellationHighlightSwatch(highlightColorId)?.token ?? CELESTIAL_COLOR_TOKENS.introduction;
  if (mode === 'unified') return Object.freeze({ token: base, opacity: base.opacity, role: 'unified', colorSource: baseColorId });
  const selectedGroup = selectedGroupId ? constellationLearningGroup(selectedGroupId) : undefined;
  const focusedGroup = selectedGroup && !['all-expanded', 'added-only', 'all-course-40', 'v3a-additions-only', 'clear'].includes(selectedGroup.id) ? selectedGroup : undefined;
  if (mode === 'highlight') {
    if (!focusedGroup) return Object.freeze({ token: base, opacity: base.opacity, role: 'unified', colorSource: 'highlight-without-single-focus' });
    if (focusedGroup.constellationIdentifiers.includes(identifier)) {
      return Object.freeze({ token: highlight, opacity: strengthOpacity[strength].selected, role: 'selected-group', colorSource: `${focusedGroup.id}:${highlightColorId}` });
    }
    return Object.freeze({ token: deriveConstellationContext(base), opacity: strengthOpacity[strength].context, role: 'context', colorSource: `derived-context:${baseColorId}` });
  }
  const primary = (focusedGroup?.id === 'zodiac' || focusedGroup?.id === 'complete-zodiac') && focusedGroup.constellationIdentifiers.includes(identifier) ? 'zodiac' : CONSTELLATION_PRIMARY_COLOR_GROUP[identifier];
  return Object.freeze({ token: groupToken[primary], opacity: strengthOpacity[strength].palette, role: 'primary-group', colorSource: primary });
}
