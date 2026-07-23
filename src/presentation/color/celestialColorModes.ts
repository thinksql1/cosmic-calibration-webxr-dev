import {
  constellationBaseSwatch,
  constellationHighlightSwatch,
  DEFAULT_CONSTELLATION_BASE_COLOR,
  DEFAULT_CONSTELLATION_HIGHLIGHT_COLOR,
  DEFAULT_LUNAR_PALETTE,
  lunarPaletteDefinition,
  type ConstellationBaseColorId,
  type ConstellationHighlightColorId,
  type CuratedLunarPaletteId,
} from './celestialColorCatalog';

export const CONSTELLATION_COLOR_MODES = Object.freeze(['unified', 'highlight', 'group-palette'] as const);
export type ConstellationColorMode = (typeof CONSTELLATION_COLOR_MODES)[number];
export const CONSTELLATION_COLOR_STRENGTHS = Object.freeze(['subtle', 'standard', 'vivid'] as const);
export type ConstellationColorStrength = (typeof CONSTELLATION_COLOR_STRENGTHS)[number];
export const LUNAR_PALETTES = Object.freeze(['lunar-purple', 'moonlit-water', 'silver-moon', 'deep-ocean', 'arctic-moon', 'mystic-rose'] as const);
/** `legacy-purple` remains a programmatic/query alias for the visible Lunar Purple choice. */
export type LunarPalette = CuratedLunarPaletteId | 'legacy-purple';

export interface CelestialAppearancePreferences {
  readonly schemaVersion: 1;
  readonly constellationBaseColor: ConstellationBaseColorId;
  readonly constellationHighlightColor: ConstellationHighlightColorId;
  readonly constellationMode: ConstellationColorMode;
  readonly constellationStrength: ConstellationColorStrength;
  readonly lunarPalette: LunarPalette;
}
export type CelestialColorSettings = CelestialAppearancePreferences;

export const DEFAULT_CELESTIAL_COLOR_SETTINGS: CelestialColorSettings = Object.freeze({
  schemaVersion: 1,
  constellationBaseColor: DEFAULT_CONSTELLATION_BASE_COLOR,
  constellationHighlightColor: DEFAULT_CONSTELLATION_HIGHLIGHT_COLOR,
  constellationMode: 'unified',
  constellationStrength: 'subtle',
  lunarPalette: DEFAULT_LUNAR_PALETTE,
});
function parse<T extends string>(value: string | null, choices: readonly T[], fallback: T): T { return value !== null && choices.includes(value as T) ? value as T : fallback; }
function validBase(value: string | null, fallback: ConstellationBaseColorId): ConstellationBaseColorId { return constellationBaseSwatch(value ?? '')?.id ?? fallback; }
function validHighlight(value: string | null, fallback: ConstellationHighlightColorId): ConstellationHighlightColorId { return constellationHighlightSwatch(value ?? '')?.id ?? fallback; }
function validLunar(value: string | null, fallback: LunarPalette): LunarPalette { return lunarPaletteDefinition(value ?? '')?.id ?? fallback; }
export function validateCelestialAppearancePreferences(value: unknown): CelestialAppearancePreferences | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<CelestialAppearancePreferences>;
  if (candidate.schemaVersion !== 1) return undefined;
  if (!constellationBaseSwatch(candidate.constellationBaseColor ?? '')) return undefined;
  if (!constellationHighlightSwatch(candidate.constellationHighlightColor ?? '')) return undefined;
  if (!CONSTELLATION_COLOR_MODES.includes(candidate.constellationMode as ConstellationColorMode)) return undefined;
  if (!CONSTELLATION_COLOR_STRENGTHS.includes(candidate.constellationStrength as ConstellationColorStrength)) return undefined;
  if (!lunarPaletteDefinition(candidate.lunarPalette ?? '')) return undefined;
  return Object.freeze(candidate as CelestialAppearancePreferences);
}
/** Valid query values override the supplied session preference; invalid values leave it intact. */
export function parseCelestialColorSettings(search: string, preferences: CelestialAppearancePreferences = DEFAULT_CELESTIAL_COLOR_SETTINGS): CelestialColorSettings {
  const parameters = new URLSearchParams(search);
  return Object.freeze({
    schemaVersion: 1,
    constellationBaseColor: validBase(parameters.has('constellationBase') ? parameters.get('constellationBase') : null, preferences.constellationBaseColor),
    constellationHighlightColor: validHighlight(parameters.has('constellationHighlight') ? parameters.get('constellationHighlight') : null, preferences.constellationHighlightColor),
    constellationMode: parse(parameters.get('constellationColor'), CONSTELLATION_COLOR_MODES, preferences.constellationMode),
    constellationStrength: parse(parameters.get('constellationColorStrength'), CONSTELLATION_COLOR_STRENGTHS, preferences.constellationStrength),
    lunarPalette: validLunar(parameters.has('lunarPalette') ? parameters.get('lunarPalette') : null, preferences.lunarPalette),
  });
}
