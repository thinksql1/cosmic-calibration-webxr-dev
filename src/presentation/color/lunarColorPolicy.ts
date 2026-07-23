import { type CelestialColorToken } from './celestialColorTokens';
import { lunarPaletteDefinition } from './celestialColorCatalog';
import type { LunarPalette } from './celestialColorModes';
export interface LunarSemanticPalette { readonly dailyPath: CelestialColorToken; readonly transitVisible: CelestialColorToken; readonly transitHidden: CelestialColorToken; readonly transitNotch: CelestialColorToken; readonly currentTransit: CelestialColorToken; readonly nextPhase: CelestialColorToken; readonly phaseLabel: CelestialColorToken; }
export function lunarSemanticPalette(palette: LunarPalette): LunarSemanticPalette {
  const values = lunarPaletteDefinition(palette);
  if (!values) throw new Error(`Unknown curated lunar palette: ${palette}`);
  return Object.freeze({ dailyPath: values.dailyPath, transitVisible: values.transitVisible, transitHidden: values.transitHidden, transitNotch: values.transitNotch, currentTransit: values.currentTransit, nextPhase: values.nextPhase, phaseLabel: values.phaseLabel });
}
