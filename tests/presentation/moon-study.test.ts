import { describe, expect, it } from 'vitest';
import { parseMoonStudyLaunch } from '../../src/presentation/moonStudy';

describe('query-gated Moon study', () => {
  it('keeps the ordinary URL off and resolves each bounded mode deterministically', () => {
    expect(parseMoonStudyLaunch('')).toMatchObject({ enabled: false, mode: 'off' });
    expect(parseMoonStudyLaunch('?moonStudy=daily-path')).toMatchObject({ showMoonPath: true, showMoonPhaseDial: false });
    expect(parseMoonStudyLaunch('?moonStudy=phase-dial')).toMatchObject({ showMoonPhaseDial: true, showMoonPhaseNotches: true });
    expect(parseMoonStudyLaunch('?moonStudy=current-appearance')).toMatchObject({ showCurrentMoonAppearance: true });
    expect(parseMoonStudyLaunch('?moonStudy=combined')).toMatchObject({
      showMoonPath: true,
      showMoonPhaseDial: true,
      showMoonPhaseLabels: true,
      showMoonPhaseImages: true,
      showCurrentMoonAppearance: true,
    });
    expect(parseMoonStudyLaunch('?moonStudy=invalid')).toMatchObject({ enabled: false, mode: 'off' });
  });

  it('allows direct bounded controls without turning an invalid study into a broad mode', () => {
    expect(parseMoonStudyLaunch('?moonStudy=combined&showMoonPhaseLabels=0')).toMatchObject({
      enabled: true,
      showMoonPhaseLabels: false,
    });
    expect(parseMoonStudyLaunch('?showMoonPath=1')).toMatchObject({
      enabled: true,
      explicitlyRequested: true,
      showMoonPath: true,
      showMoonPhaseDial: false,
    });
  });
});
