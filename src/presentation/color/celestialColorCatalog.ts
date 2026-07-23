import { type CelestialColorToken } from './celestialColorTokens';

export type ConstellationBaseColorId =
  | 'celestial-lavender' | 'starlight-white' | 'ice-blue' | 'soft-cyan'
  | 'sage' | 'soft-amber' | 'muted-rose' | 'deep-violet';
export type ConstellationHighlightColorId =
  | 'observation-orange' | 'solar-gold' | 'ice-blue' | 'luminous-aqua'
  | 'spring-green' | 'muted-rose' | 'instructional-violet' | 'starlight-white';
export type CuratedLunarPaletteId =
  | 'lunar-purple' | 'moonlit-water' | 'silver-moon' | 'deep-ocean' | 'arctic-moon' | 'mystic-rose';

export interface CuratedColorSwatch<Id extends string> {
  readonly id: Id;
  readonly displayName: string;
  readonly token: CelestialColorToken;
}
export interface CuratedLunarPalette {
  readonly id: CuratedLunarPaletteId;
  readonly displayName: string;
  readonly dailyPath: CelestialColorToken;
  readonly transitVisible: CelestialColorToken;
  readonly transitHidden: CelestialColorToken;
  readonly transitNotch: CelestialColorToken;
  readonly currentTransit: CelestialColorToken;
  readonly nextPhase: CelestialColorToken;
  readonly phaseLabel: CelestialColorToken;
}

function token(id: string, cssHex: `#${string}`, opacity: number, semanticRole: string): CelestialColorToken {
  return Object.freeze({ id, cssHex, hex: Number.parseInt(cssHex.slice(1), 16), opacity, semanticRole });
}
function swatch<Id extends string>(id: Id, displayName: string, cssHex: `#${string}`): CuratedColorSwatch<Id> {
  return Object.freeze({ id, displayName, token: token(`constellation-base-${id}`, cssHex, 0.42, `curated ${displayName} constellation base`) });
}

export const CONSTELLATION_BASE_SWATCHES = Object.freeze([
  swatch('celestial-lavender', 'Celestial Lavender', '#D9B7FF'),
  swatch('starlight-white', 'Starlight White', '#D7D8E2'),
  swatch('ice-blue', 'Ice Blue', '#91B7D2'),
  swatch('soft-cyan', 'Soft Cyan', '#79B8BC'),
  swatch('sage', 'Sage', '#91AA94'),
  swatch('soft-amber', 'Soft Amber', '#B89A68'),
  swatch('muted-rose', 'Muted Rose', '#B58A9A'),
  swatch('deep-violet', 'Deep Violet', '#78659E'),
] as const);
export const CONSTELLATION_HIGHLIGHT_SWATCHES = Object.freeze([
  swatch('observation-orange', 'Observation Orange', '#C99255'),
  swatch('solar-gold', 'Solar Gold', '#C7A761'),
  swatch('ice-blue', 'Ice Blue', '#8DAFC8'),
  swatch('luminous-aqua', 'Luminous Aqua', '#72BEC1'),
  swatch('spring-green', 'Spring Green', '#8BAB82'),
  swatch('muted-rose', 'Muted Rose', '#B98294'),
  swatch('instructional-violet', 'Instructional Violet', '#9A83C5'),
  swatch('starlight-white', 'Starlight White', '#D9DAE4'),
] as const);

export const DEFAULT_CONSTELLATION_BASE_COLOR: ConstellationBaseColorId = 'celestial-lavender';
export const DEFAULT_CONSTELLATION_HIGHLIGHT_COLOR: ConstellationHighlightColorId = 'observation-orange';
export function constellationBaseSwatch(id: string): CuratedColorSwatch<ConstellationBaseColorId> | undefined {
  return CONSTELLATION_BASE_SWATCHES.find((value) => value.id === id) as CuratedColorSwatch<ConstellationBaseColorId> | undefined;
}
export function constellationHighlightSwatch(id: string): CuratedColorSwatch<ConstellationHighlightColorId> | undefined {
  return CONSTELLATION_HIGHLIGHT_SWATCHES.find((value) => value.id === id) as CuratedColorSwatch<ConstellationHighlightColorId> | undefined;
}

function palette(id: CuratedLunarPaletteId, displayName: string, daily: `#${string}`, visible: `#${string}`, hidden: `#${string}`, notch: `#${string}`, marker: `#${string}`): CuratedLunarPalette {
  return Object.freeze({
    id, displayName,
    dailyPath: token(`${id}-daily`, daily, 1, `${displayName} Moon Daily Path`),
    transitVisible: token(`${id}-transit-visible`, visible, 0.56, `${displayName} visible Lunar Phase Transit`),
    transitHidden: token(`${id}-transit-hidden`, hidden, 0.30, `${displayName} Earth-hidden Lunar Phase Transit`),
    transitNotch: token(`${id}-notch`, notch, 0.84, `${displayName} silver phase notch`),
    currentTransit: token(`${id}-current`, marker, 0.95, `${displayName} current transit marker`),
    nextPhase: token(`${id}-next`, marker, 0.74, `${displayName} reserved next-phase accent`),
    phaseLabel: token(`${id}-label`, notch, 0.96, `${displayName} phase label`),
  });
}

export const LUNAR_PALETTE_CATALOG = Object.freeze([
  // Exact accepted purple values recovered from the previous material tokens.
  palette('lunar-purple', 'Lunar Purple', '#B9D6E8', '#CDB8FF', '#9383BA', '#F0E6FF', '#FFE39A'),
  palette('moonlit-water', 'Moonlit Water', '#9EAEF0', '#927ADB', '#59659B', '#D7E0F3', '#79D8DC'),
  palette('silver-moon', 'Silver Moon', '#BBC7DC', '#AAB6D1', '#66738F', '#E3E6EF', '#C8E4E6'),
  palette('deep-ocean', 'Deep Ocean', '#74AEC1', '#5D98AE', '#3F647A', '#D1E2E7', '#75D0C7'),
  palette('arctic-moon', 'Arctic Moon', '#A5C7E7', '#8BAED7', '#536E9C', '#E0E9F4', '#8CE0DF'),
  palette('mystic-rose', 'Mystic Rose', '#C28DBB', '#A879AD', '#71527D', '#E6D7E5', '#B9CBE8'),
] as const);
export const DEFAULT_LUNAR_PALETTE: CuratedLunarPaletteId = 'lunar-purple';
export function lunarPaletteDefinition(id: string): CuratedLunarPalette | undefined {
  const normalized = id === 'legacy-purple' ? 'lunar-purple' : id;
  return LUNAR_PALETTE_CATALOG.find((value) => value.id === normalized);
}

/** Deterministic neutralized context from the selected base; no user-controlled context color. */
export function deriveConstellationContext(base: CelestialColorToken): CelestialColorToken {
  const r = (base.hex >> 16) & 0xff; const g = (base.hex >> 8) & 0xff; const b = base.hex & 0xff;
  const neutral = Math.round((r + g + b) / 3);
  const blend = (channel: number) => Math.round(channel * 0.42 + neutral * 0.58);
  const hex = (blend(r) << 16) | (blend(g) << 8) | blend(b);
  return token(`${base.id}-context`, `#${hex.toString(16).padStart(6, '0')}` as `#${string}`, 0.30, `derived neutral context from ${base.id}`);
}
