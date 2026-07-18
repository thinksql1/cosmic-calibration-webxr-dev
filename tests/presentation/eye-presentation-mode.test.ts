import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EYE_PRESENTATION_MODE,
  EYE_PRESENTATION_MODES,
  eyeModeIncludesView,
  parseEyePresentationMode,
  parseXrEyeIdentity,
} from '../../src/presentation/eyePresentationMode';

describe('eye-presentation contract', () => {
  it('supports exactly both, left, and right with both as the default', () => {
    expect(EYE_PRESENTATION_MODES).toEqual(['both', 'left', 'right']);
    expect(DEFAULT_EYE_PRESENTATION_MODE).toBe('both');
    EYE_PRESENTATION_MODES.forEach((mode) => expect(parseEyePresentationMode(mode)).toBe(mode));
  });

  it.each([undefined, null, '', 'mono', 'LEFT', 1])('rejects invalid mode %s', (value) => {
    expect(() => parseEyePresentationMode(value)).toThrow('both, left, or right');
  });

  it('selects the requested physical eye without changing both-eye semantics', () => {
    expect(eyeModeIncludesView('both', 'left')).toBe(true);
    expect(eyeModeIncludesView('both', 'right')).toBe(true);
    expect(eyeModeIncludesView('left', 'left')).toBe(true);
    expect(eyeModeIncludesView('left', 'right')).toBe(false);
    expect(eyeModeIncludesView('right', 'left')).toBe(false);
    expect(eyeModeIncludesView('right', 'right')).toBe(true);
  });

  it('treats XR eye none as an explicit monoscopic fallback for every mode', () => {
    EYE_PRESENTATION_MODES.forEach((mode) => expect(eyeModeIncludesView(mode, 'none')).toBe(true));
    expect(parseXrEyeIdentity('none')).toBe('none');
  });
});
