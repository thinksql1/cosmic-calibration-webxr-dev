export const EYE_PRESENTATION_MODES = Object.freeze([
  'both',
  'left',
  'right',
] as const);

export type EyePresentationMode = (typeof EYE_PRESENTATION_MODES)[number];
export type XrEyeIdentity = 'left' | 'right' | 'none';

export const DEFAULT_EYE_PRESENTATION_MODE: EyePresentationMode = 'both';

export function parseEyePresentationMode(value: unknown): EyePresentationMode {
  if (value === 'both' || value === 'left' || value === 'right') return value;
  throw new Error('Eye presentation mode must be both, left, or right.');
}

export function parseXrEyeIdentity(value: unknown): XrEyeIdentity {
  if (value === 'left' || value === 'right' || value === 'none') return value;
  throw new Error('XR view eye identity must be left, right, or none.');
}

/**
 * Eye selection is presentation-only. Monoscopic XR views use `none` and are
 * deliberately shown for every mode, matching the desktop fallback policy.
 */
export function eyeModeIncludesView(
  mode: EyePresentationMode,
  eye: XrEyeIdentity,
): boolean {
  parseEyePresentationMode(mode);
  parseXrEyeIdentity(eye);
  return eye === 'none' || mode === 'both' || mode === eye;
}
