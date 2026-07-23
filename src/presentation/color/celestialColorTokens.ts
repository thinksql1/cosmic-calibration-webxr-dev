export type CelestialColorTokenId =
  | 'constellation-unified'
  | 'constellation-context'
  | 'group-introduction'
  | 'group-circumpolar'
  | 'group-winter'
  | 'group-spring'
  | 'group-summer'
  | 'group-autumn'
  | 'group-zodiac'
  | 'moon-daily-path'
  | 'lunar-transit-visible'
  | 'lunar-transit-hidden'
  | 'lunar-phase-notch'
  | 'lunar-current-transit'
  | 'lunar-next-phase'
  | 'moon-phase-label';

export interface CelestialColorToken {
  readonly id: CelestialColorTokenId;
  readonly hex: number;
  readonly cssHex: `#${string}`;
  readonly opacity: number;
  readonly semanticRole: string;
}

const token = (id: CelestialColorTokenId, cssHex: `#${string}`, opacity: number, semanticRole: string): CelestialColorToken => Object.freeze({
  id, hex: Number.parseInt(cssHex.slice(1), 16), cssHex, opacity, semanticRole,
});

/** Presentation metadata only. These values never enter astronomy or geometry calculations. */
export const CELESTIAL_COLOR_TOKENS = Object.freeze({
  constellationUnified: token('constellation-unified', '#D9B7FF', 0.42, 'subdued celestial-lavender structure'),
  constellationContext: token('constellation-context', '#77758A', 0.26, 'dim lavender-gray instructional context'),
  introduction: token('group-introduction', '#CDBB83', 0.52, 'soft moon-gold introduction anchors'),
  circumpolar: token('group-circumpolar', '#8BAFC7', 0.52, 'ice-blue circumpolar orientation'),
  winter: token('group-winter', '#AEBFD8', 0.52, 'pale blue-white winter sky'),
  spring: token('group-spring', '#99B69D', 0.52, 'soft sage spring sky'),
  summer: token('group-summer', '#C5A36D', 0.52, 'muted amber summer sky'),
  autumn: token('group-autumn', '#B88A9C', 0.52, 'muted rose autumn sky'),
  zodiac: token('group-zodiac', '#9B83C6', 0.52, 'restrained violet zodiac study'),
  moonDailyPath: token('moon-daily-path', '#7898D8', 1, 'moonlit periwinkle daily motion'),
  lunarTransitVisible: token('lunar-transit-visible', '#7667C7', 0.56, 'blue-violet visible lunation transit'),
  lunarTransitHidden: token('lunar-transit-hidden', '#354B83', 0.24, 'deep-water indigo Earth-hidden lunation transit'),
  lunarPhaseNotch: token('lunar-phase-notch', '#D5DDF2', 0.82, 'silver moonlight phase event notch'),
  lunarCurrentTransit: token('lunar-current-transit', '#72D3D8', 0.94, 'restrained luminous aqua current transit'),
  lunarNextPhase: token('lunar-next-phase', '#A7DDE5', 0.72, 'pale aqua-silver reserved next-phase accent'),
  moonPhaseLabel: token('moon-phase-label', '#DCE6F6', 0.96, 'pale silver-blue phase label'),
});

export const LEGACY_LUNAR_COLOR_TOKENS = Object.freeze({
  moonDailyPath: token('moon-daily-path', '#B9D6E8', 1, 'accepted legacy Moon Daily Path'),
  lunarTransitVisible: token('lunar-transit-visible', '#CDB8FF', 0.56, 'accepted legacy visible transit purple'),
  lunarTransitHidden: token('lunar-transit-hidden', '#9383BA', 0.24, 'accepted legacy hidden transit purple'),
  lunarPhaseNotch: token('lunar-phase-notch', '#F0E6FF', 0.82, 'accepted legacy transit notch silver'),
  lunarCurrentTransit: token('lunar-current-transit', '#FFE39A', 0.94, 'accepted legacy current transit marker'),
  lunarNextPhase: token('lunar-next-phase', '#FFE39A', 0.72, 'accepted legacy reserved next-phase accent'),
  moonPhaseLabel: token('moon-phase-label', '#FFFFFF', 0.96, 'accepted legacy phase label'),
});
