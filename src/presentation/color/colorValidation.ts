import { CELESTIAL_COLOR_TOKENS, LEGACY_LUNAR_COLOR_TOKENS, type CelestialColorToken } from './celestialColorTokens';
import { CONSTELLATION_BASE_SWATCHES, CONSTELLATION_HIGHLIGHT_SWATCHES, LUNAR_PALETTE_CATALOG } from './celestialColorCatalog';
export function relativeLuminance(token: CelestialColorToken): number { const channel = (shift: number) => ((token.hex >> shift) & 0xff) / 255; const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; return 0.2126 * linear(channel(16)) + 0.7152 * linear(channel(8)) + 0.0722 * linear(channel(0)); }
export function colorDistance(a: CelestialColorToken, b: CelestialColorToken): number { const component = (value: CelestialColorToken, shift: number) => (value.hex >> shift) & 0xff; return Math.hypot(component(a, 16) - component(b, 16), component(a, 8) - component(b, 8), component(a, 0) - component(b, 0)); }
export function validateCelestialColorTokens(): readonly string[] { const all = [...Object.values(CELESTIAL_COLOR_TOKENS), ...Object.values(LEGACY_LUNAR_COLOR_TOKENS)]; const errors: string[] = []; for (const token of all) { if (!Number.isInteger(token.hex) || token.hex < 0 || token.hex > 0xffffff) errors.push(`${token.id}: invalid hex`); if (!Number.isFinite(token.opacity) || token.opacity < 0 || token.opacity > 1) errors.push(`${token.id}: invalid opacity`); } if (new Set(Object.values(CELESTIAL_COLOR_TOKENS).map((token) => token.id)).size !== Object.keys(CELESTIAL_COLOR_TOKENS).length) errors.push('duplicate semantic token identifier'); return Object.freeze(errors); }
export function validateCuratedAppearanceCatalog(): readonly string[] {
  const errors: string[] = [];
  const swatches = [...CONSTELLATION_BASE_SWATCHES, ...CONSTELLATION_HIGHLIGHT_SWATCHES];
  for (const swatch of swatches) {
    if (!swatch.displayName.trim()) errors.push(`${swatch.id}: empty display name`);
    if (!Number.isInteger(swatch.token.hex) || swatch.token.hex < 0 || swatch.token.hex > 0xffffff) errors.push(`${swatch.id}: invalid color`);
    if (relativeLuminance(swatch.token) < 0.04) errors.push(`${swatch.id}: below curated visibility floor`);
  }
  for (const palette of LUNAR_PALETTE_CATALOG) {
    const roles = [palette.dailyPath, palette.transitVisible, palette.transitHidden, palette.transitNotch, palette.currentTransit];
    if (roles.some((token) => !Number.isFinite(token.opacity) || token.opacity <= 0 || token.opacity > 1)) errors.push(`${palette.id}: invalid opacity`);
    if (relativeLuminance(palette.transitHidden) >= relativeLuminance(palette.transitVisible)) errors.push(`${palette.id}: hidden segment is not dimmer than visible`);
    if (colorDistance(palette.transitVisible, palette.currentTransit) < 24) errors.push(`${palette.id}: current marker lacks path separation`);
  }
  return Object.freeze(errors);
}
