export const MOON_STUDY_MODES = Object.freeze([
  'off',
  'daily-path',
  'phase-dial',
  'current-appearance',
  'combined',
] as const);
export type MoonStudyMode = (typeof MOON_STUDY_MODES)[number];

export interface MoonStudyLaunch {
  readonly enabled: boolean;
  readonly explicitlyRequested: boolean;
  readonly mode: MoonStudyMode;
  readonly showMoonPath: boolean;
  readonly showMoonPhaseDial: boolean;
  readonly showMoonPhaseNotches: boolean;
  readonly showMoonPhaseLabels: boolean;
  readonly showMoonPhaseImages: boolean;
  readonly showCurrentMoonAppearance: boolean;
  readonly showCurrentPhaseIndicator: boolean;
}

function direct(parameters: URLSearchParams, name: string, fallback: boolean): boolean {
  const value = parameters.get(name);
  if (value === null) return fallback;
  return value === '1' || value === 'true';
}

export function parseMoonStudyLaunch(search: string): MoonStudyLaunch {
  const parameters = new URLSearchParams(search);
  const raw = parameters.get('moonStudy');
  const mode: MoonStudyMode = MOON_STUDY_MODES.includes(raw as MoonStudyMode)
    ? raw as MoonStudyMode
    : 'off';
  const combined = mode === 'combined';
  const dial = mode === 'phase-dial' || combined;
  const directParameterNames = [
    'showMoonPath',
    'showMoonPhaseDial',
    'showMoonPhaseNotches',
    'showMoonPhaseLabels',
    'showMoonPhaseImages',
    'showCurrentMoonAppearance',
    'showCurrentPhaseIndicator',
  ] as const;
  const directRequested = directParameterNames.some((name) => parameters.has(name));
  const directEnabled = directParameterNames.some((name) => direct(parameters, name, false));
  const enabled = mode !== 'off' || directEnabled;
  return Object.freeze({
    enabled,
    explicitlyRequested: raw !== null || directRequested,
    mode,
    showMoonPath: direct(parameters, 'showMoonPath', mode === 'daily-path' || combined),
    showMoonPhaseDial: direct(parameters, 'showMoonPhaseDial', dial),
    showMoonPhaseNotches: direct(parameters, 'showMoonPhaseNotches', dial),
    showMoonPhaseLabels: direct(parameters, 'showMoonPhaseLabels', combined),
    showMoonPhaseImages: direct(parameters, 'showMoonPhaseImages', combined),
    showCurrentMoonAppearance: direct(
      parameters,
      'showCurrentMoonAppearance',
      mode === 'current-appearance' || combined,
    ),
    showCurrentPhaseIndicator: direct(parameters, 'showCurrentPhaseIndicator', dial),
  });
}
