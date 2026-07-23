export const SKY_FRAME_STUDY_MODES = Object.freeze(['canonical', 'real-sky', 'overlay'] as const);
export type SkyFrameStudyMode = (typeof SKY_FRAME_STUDY_MODES)[number];

export interface SkyFrameStudyLaunch {
  readonly mode: SkyFrameStudyMode;
  readonly explicitlyRequested: boolean;
  readonly frozenUtc?: string;
}

export function parseSkyFrameStudyLaunch(search: string): SkyFrameStudyLaunch {
  const parameters = new URLSearchParams(search);
  const rawMode = parameters.get('skyFrameStudy');
  const mode = SKY_FRAME_STUDY_MODES.includes(rawMode as SkyFrameStudyMode)
    ? rawMode as SkyFrameStudyMode
    : 'canonical';
  const rawTime = parameters.get('skyTime');
  const parsedTime = rawTime === null ? Number.NaN : Date.parse(rawTime);
  return Object.freeze({
    mode,
    explicitlyRequested: rawMode !== null,
    ...(Number.isFinite(parsedTime)
      ? { frozenUtc: new Date(parsedTime).toISOString() }
      : {}),
  });
}
