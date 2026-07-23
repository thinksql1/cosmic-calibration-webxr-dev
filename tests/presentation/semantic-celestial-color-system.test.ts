import { describe, expect, it } from 'vitest';
import { parseCelestialColorSettings } from '../../src/presentation/color/celestialColorModes';
import { CELESTIAL_COLOR_TOKENS } from '../../src/presentation/color/celestialColorTokens';
import { colorDistance, relativeLuminance, validateCelestialColorTokens } from '../../src/presentation/color/colorValidation';
import { CONSTELLATION_PRIMARY_COLOR_GROUP, resolveConstellationColor } from '../../src/presentation/color/constellationColorPolicy';
import { lunarSemanticPalette } from '../../src/presentation/color/lunarColorPolicy';

describe('semantic celestial color system', () => {
  it('validates finite unique semantic tokens and safe query fallbacks', () => {
    expect(validateCelestialColorTokens()).toEqual([]);
    expect(parseCelestialColorSettings('?constellationColor=group-palette&constellationColorStrength=standard&lunarPalette=legacy-purple')).toEqual({
      constellationMode: 'group-palette', constellationStrength: 'standard', lunarPalette: 'legacy-purple',
    });
    expect(parseCelestialColorSettings('?constellationColor=invalid&constellationColorStrength=bad&lunarPalette=nope')).toEqual({
      constellationMode: 'unified', constellationStrength: 'subtle', lunarPalette: 'moonlit-water',
    });
  });

  it('preserves unified lavender and applies selected/context emphasis without changing membership', () => {
    expect(resolveConstellationColor('ORI', 'unified', 'subtle', 'winter').token).toBe(CELESTIAL_COLOR_TOKENS.constellationUnified);
    const selected = resolveConstellationColor('ORI', 'highlight', 'standard', 'winter');
    const context = resolveConstellationColor('UMA', 'highlight', 'standard', 'winter');
    expect(selected.role).toBe('selected-group');
    expect(context.role).toBe('context');
    expect(selected.opacity).toBeGreaterThan(context.opacity);
    expect(relativeLuminance(selected.token)).not.toBe(relativeLuminance(context.token));
  });

  it('assigns one deterministic experimental primary group to every catalog figure', () => {
    expect(Object.keys(CONSTELLATION_PRIMARY_COLOR_GROUP)).toHaveLength(29);
    expect(resolveConstellationColor('LIB', 'group-palette', 'subtle', 'all-expanded').colorSource).toBe('zodiac');
    expect(resolveConstellationColor('ORI', 'group-palette', 'subtle', 'introduction-anchors').colorSource).toBe('winter');
    expect(resolveConstellationColor('TAU', 'group-palette', 'subtle', 'zodiac').colorSource).toBe('zodiac');
  });

  it('keeps moonlit water semantically distinct while retaining a legacy comparison palette', () => {
    const water = lunarSemanticPalette('moonlit-water');
    const legacy = lunarSemanticPalette('legacy-purple');
    expect(water.dailyPath.hex).toBe(0x7898d8);
    expect(water.transitVisible.hex).toBe(0x7667c7);
    expect(water.transitHidden.hex).toBe(0x354b83);
    expect(water.transitNotch.hex).toBe(0xd5ddf2);
    expect(water.currentTransit.hex).toBe(0x72d3d8);
    expect(colorDistance(water.transitVisible, CELESTIAL_COLOR_TOKENS.constellationUnified)).toBeGreaterThan(30);
    expect(relativeLuminance(water.transitVisible)).toBeGreaterThan(relativeLuminance(water.transitHidden));
    expect(legacy.transitVisible.hex).toBe(0xcdb8ff);
  });
});
