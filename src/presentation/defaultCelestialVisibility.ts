export interface CelestialVisibilityDefaults {
  readonly axis: boolean;
  readonly northPoleMarker: boolean;
  readonly southPoleMarker: boolean;
  readonly poleLabels: boolean;
  readonly earthCore: boolean;
}

/** Fresh-session presentation defaults only. Diagnostics and valid query settings resolve above these values. */
export const DEFAULT_CELESTIAL_VISIBILITY: CelestialVisibilityDefaults = Object.freeze({
  axis: false,
  northPoleMarker: false,
  southPoleMarker: false,
  poleLabels: false,
  earthCore: false,
});

export type VisibilityPreferenceSource = 'default' | 'query' | 'diagnostic';
export interface ResolvedCelestialVisibility {
  readonly values: CelestialVisibilityDefaults;
  readonly source: Readonly<Record<keyof CelestialVisibilityDefaults, VisibilityPreferenceSource>>;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
}

/** Query aliases are deliberate diagnostic entry points; malformed values leave the default intact. */
export function resolveCelestialVisibility(search: string): ResolvedCelestialVisibility {
  const parameters = new URLSearchParams(search);
  const aliases: Readonly<Record<keyof CelestialVisibilityDefaults, readonly string[]>> = Object.freeze({
    axis: Object.freeze(['axis', 'showAxis']),
    northPoleMarker: Object.freeze(['northPoleMarker', 'showNorthPoleMarker', 'poleMarkers']),
    southPoleMarker: Object.freeze(['southPoleMarker', 'showSouthPoleMarker', 'poleMarkers']),
    poleLabels: Object.freeze(['poleLabels', 'showPoleLabels']),
    earthCore: Object.freeze(['earthCore', 'showEarthCore']),
  });
  const values = { ...DEFAULT_CELESTIAL_VISIBILITY };
  const source: Record<keyof CelestialVisibilityDefaults, VisibilityPreferenceSource> = {
    axis: 'default', northPoleMarker: 'default', southPoleMarker: 'default', poleLabels: 'default', earthCore: 'default',
  };
  for (const key of Object.keys(aliases) as (keyof CelestialVisibilityDefaults)[]) {
    for (const alias of aliases[key]) {
      const parsed = parseBoolean(parameters.get(alias));
      if (parsed === undefined) continue;
      values[key] = parsed;
      source[key] = 'query';
      break;
    }
  }
  return Object.freeze({ values: Object.freeze(values), source: Object.freeze(source) });
}
