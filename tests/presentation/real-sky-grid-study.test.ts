import { describe, expect, it } from 'vitest';
import { parseSkyFrameStudyLaunch } from '../../src/presentation/realSkyGridStudy';

describe('real-sky grid study query contract', () => {
  it.each(['canonical', 'real-sky', 'overlay'] as const)('selects %s deterministically', (mode) => {
    expect(parseSkyFrameStudyLaunch(`?skyFrameStudy=${mode}`)).toMatchObject({ mode, explicitlyRequested: true });
  });

  it('preserves canonical behavior for absent or invalid modes', () => {
    expect(parseSkyFrameStudyLaunch('')).toEqual({ mode: 'canonical', explicitlyRequested: false });
    expect(parseSkyFrameStudyLaunch('?skyFrameStudy=invalid')).toEqual({ mode: 'canonical', explicitlyRequested: true });
  });

  it('accepts only a finite deterministic UTC override', () => {
    expect(parseSkyFrameStudyLaunch('?skyFrameStudy=real-sky&skyTime=2026-03-20T00:00:00Z').frozenUtc)
      .toBe('2026-03-20T00:00:00.000Z');
    expect(parseSkyFrameStudyLaunch('?skyTime=not-a-time').frozenUtc).toBeUndefined();
  });
});
