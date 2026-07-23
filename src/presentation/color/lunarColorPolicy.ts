import { CELESTIAL_COLOR_TOKENS, LEGACY_LUNAR_COLOR_TOKENS, type CelestialColorToken } from './celestialColorTokens';
import type { LunarPalette } from './celestialColorModes';
export interface LunarSemanticPalette { readonly dailyPath: CelestialColorToken; readonly transitVisible: CelestialColorToken; readonly transitHidden: CelestialColorToken; readonly transitNotch: CelestialColorToken; readonly currentTransit: CelestialColorToken; readonly nextPhase: CelestialColorToken; readonly phaseLabel: CelestialColorToken; }
export function lunarSemanticPalette(palette: LunarPalette): LunarSemanticPalette {
  const values = palette === 'legacy-purple' ? LEGACY_LUNAR_COLOR_TOKENS : CELESTIAL_COLOR_TOKENS;
  return Object.freeze({ dailyPath: values.moonDailyPath, transitVisible: values.lunarTransitVisible, transitHidden: values.lunarTransitHidden, transitNotch: values.lunarPhaseNotch, currentTransit: values.lunarCurrentTransit, nextPhase: values.lunarNextPhase, phaseLabel: values.moonPhaseLabel });
}
