import { describe, expect, it } from 'vitest';
import { DEFAULT_CELESTIAL_COLOR_SETTINGS, parseCelestialColorSettings, validateCelestialAppearancePreferences } from '../../src/presentation/color/celestialColorModes';
import { CONSTELLATION_BASE_SWATCHES, CONSTELLATION_HIGHLIGHT_SWATCHES, LUNAR_PALETTE_CATALOG } from '../../src/presentation/color/celestialColorCatalog';
import { DEFAULT_CELESTIAL_VISIBILITY, resolveCelestialVisibility } from '../../src/presentation/defaultCelestialVisibility';
import { CELESTIAL_APPEARANCE_STORAGE_KEY, readAppearancePreferences, writeAppearancePreferences } from '../../src/presentation/color/celestialAppearancePersistence';
import { CELESTIAL_COLOR_TOKENS } from '../../src/presentation/color/celestialColorTokens';
import { colorDistance, relativeLuminance, validateCelestialColorTokens } from '../../src/presentation/color/colorValidation';
import { CONSTELLATION_PRIMARY_COLOR_GROUP, resolveConstellationColor } from '../../src/presentation/color/constellationColorPolicy';
import { lunarSemanticPalette } from '../../src/presentation/color/lunarColorPolicy';

describe('semantic celestial color system', () => {
  it('validates finite unique semantic tokens and safe query fallbacks', () => {
    expect(validateCelestialColorTokens()).toEqual([]);
    expect(parseCelestialColorSettings('?constellationColor=group-palette&constellationColorStrength=standard&lunarPalette=legacy-purple')).toMatchObject({
      constellationMode: 'group-palette', constellationStrength: 'standard', lunarPalette: 'lunar-purple',
    });
    expect(parseCelestialColorSettings('?constellationColor=invalid&constellationColorStrength=bad&lunarPalette=nope')).toEqual(DEFAULT_CELESTIAL_COLOR_SETTINGS);
  });

  it('preserves unified lavender and applies selected/context emphasis without changing membership', () => {
    expect(resolveConstellationColor('ORI', 'unified', 'subtle', 'winter').token.hex).toBe(CELESTIAL_COLOR_TOKENS.constellationUnified.hex);
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
    expect(water.dailyPath.hex).toBe(0x9eaef0);
    expect(water.transitVisible.hex).toBe(0x927adb);
    expect(water.transitHidden.hex).toBe(0x59659b);
    expect(water.transitNotch.hex).toBe(0xd7e0f3);
    expect(water.currentTransit.hex).toBe(0x79d8dc);
    expect(colorDistance(water.transitVisible, CELESTIAL_COLOR_TOKENS.constellationUnified)).toBeGreaterThan(30);
    expect(relativeLuminance(water.transitVisible)).toBeGreaterThan(relativeLuminance(water.transitHidden));
    expect(legacy.transitVisible.hex).toBe(0xcdb8ff);
  });

  it('has curated preferences, clean defaults, and schema-safe persistence', () => {
    expect(DEFAULT_CELESTIAL_VISIBILITY).toEqual({ axis: false, northPoleMarker: false, southPoleMarker: false, poleLabels: false, earthCore: false });
    expect(resolveCelestialVisibility('?axis=1&poleMarkers=1&earthCore=1').values).toMatchObject({ axis: true, northPoleMarker: true, southPoleMarker: true, earthCore: true });
    expect(new Set(CONSTELLATION_BASE_SWATCHES.map((value) => value.id)).size).toBe(CONSTELLATION_BASE_SWATCHES.length);
    expect(new Set(CONSTELLATION_HIGHLIGHT_SWATCHES.map((value) => value.id)).size).toBe(CONSTELLATION_HIGHLIGHT_SWATCHES.length);
    expect(LUNAR_PALETTE_CATALOG).toHaveLength(6);
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    expect(writeAppearancePreferences(storage, DEFAULT_CELESTIAL_COLOR_SETTINGS)).toBe(true);
    expect(values.has(CELESTIAL_APPEARANCE_STORAGE_KEY)).toBe(true);
    expect(readAppearancePreferences(storage, validateCelestialAppearancePreferences)).toMatchObject({ status: 'valid', preferences: DEFAULT_CELESTIAL_COLOR_SETTINGS });
    values.set(CELESTIAL_APPEARANCE_STORAGE_KEY, '{bad');
    expect(readAppearancePreferences(storage, validateCelestialAppearancePreferences).status).toBe('invalid');
  });

  it('lets a valid query override persisted preference for the current load without mutating it', () => {
    const persisted = Object.freeze({ ...DEFAULT_CELESTIAL_COLOR_SETTINGS, constellationBaseColor: 'sage' as const, lunarPalette: 'deep-ocean' as const });
    const resolved = parseCelestialColorSettings('?constellationBase=ice-blue&lunarPalette=lunar-purple', persisted);
    expect(resolved.constellationBaseColor).toBe('ice-blue');
    expect(resolved.lunarPalette).toBe('lunar-purple');
    expect(persisted.constellationBaseColor).toBe('sage');
    expect(parseCelestialColorSettings('?constellationBase=nope&lunarPalette=nope', persisted)).toMatchObject(persisted);
  });
});
