export const CONSTELLATION_COLOR_MODES = Object.freeze(['unified', 'highlight', 'group-palette'] as const);
export type ConstellationColorMode = (typeof CONSTELLATION_COLOR_MODES)[number];
export const CONSTELLATION_COLOR_STRENGTHS = Object.freeze(['subtle', 'standard', 'vivid'] as const);
export type ConstellationColorStrength = (typeof CONSTELLATION_COLOR_STRENGTHS)[number];
export const LUNAR_PALETTES = Object.freeze(['moonlit-water', 'legacy-purple'] as const);
export type LunarPalette = (typeof LUNAR_PALETTES)[number];

export interface CelestialColorSettings {
  readonly constellationMode: ConstellationColorMode;
  readonly constellationStrength: ConstellationColorStrength;
  readonly lunarPalette: LunarPalette;
}

export const DEFAULT_CELESTIAL_COLOR_SETTINGS: CelestialColorSettings = Object.freeze({ constellationMode: 'unified', constellationStrength: 'subtle', lunarPalette: 'moonlit-water' });
function parse<T extends string>(value: string | null, choices: readonly T[], fallback: T): T { return value !== null && choices.includes(value as T) ? value as T : fallback; }
export function parseCelestialColorSettings(search: string): CelestialColorSettings {
  const parameters = new URLSearchParams(search);
  return Object.freeze({
    constellationMode: parse(parameters.get('constellationColor'), CONSTELLATION_COLOR_MODES, DEFAULT_CELESTIAL_COLOR_SETTINGS.constellationMode),
    constellationStrength: parse(parameters.get('constellationColorStrength'), CONSTELLATION_COLOR_STRENGTHS, DEFAULT_CELESTIAL_COLOR_SETTINGS.constellationStrength),
    lunarPalette: parse(parameters.get('lunarPalette'), LUNAR_PALETTES, DEFAULT_CELESTIAL_COLOR_SETTINGS.lunarPalette),
  });
}
