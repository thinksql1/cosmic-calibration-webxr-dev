import { describe, expect, it } from 'vitest';

const applicationSources = import.meta.glob('../../src/**/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const scienceSources = Object.fromEntries(
  Object.entries(applicationSources).filter(([path]) =>
    path.includes('/science/'),
  ),
);

const presentationSources = import.meta.glob(
  '../../src/presentation/mapEnuToApplicationBasis.ts',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>;

describe('scientific dependency and frame boundaries', () => {
  it('contains raw Astronomy Engine imports in the adapter only', () => {
    const importers = Object.entries(applicationSources)
      .filter(([, source]) =>
        /from\s+['"]astronomy-engine['"]/.test(source),
      )
      .map(([path]) => path);

    expect(importers).toEqual([
      '../../src/science/astronomy/astronomyEngineAdapter.ts',
    ]);
  });

  it('contains no Three.js coupling in the scientific layer', () => {
    for (const source of Object.values(scienceSources)) {
      expect(source).not.toMatch(/from\s+['"]three(?:\/[^'"]*)?['"]/);
    }
  });

  it('contains no implicit system-clock read in scientific functions', () => {
    for (const source of Object.values(scienceSources)) {
      expect(source).not.toContain('Date.now(');
      expect(source).not.toContain('new Date()');
    }
  });

  it('contains no live network client in the scientific layer', () => {
    for (const source of Object.values(scienceSources)) {
      expect(source).not.toMatch(
        /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/,
      );
    }
  });

  it('does not couple science to browser/XR storage, timers, or controller APIs', () => {
    for (const source of Object.values(scienceSources)) {
      expect(source).not.toMatch(/\b(?:navigator|XRSession|XRReferenceSpace|localStorage|indexedDB|setInterval|setTimeout)\b/);
    }
  });

  it('keeps the browser UI outside direct Astronomy Engine imports', () => {
    const presentationAndUiSources = Object.entries(applicationSources).filter(
      ([path]) => !path.includes('/science/'),
    );
    for (const [, source] of presentationAndUiSources) {
      expect(source).not.toMatch(/from\s+['"]astronomy-engine['"]/);
    }
  });

  it('keeps the application presentation mapping outside science and Three.js-free', () => {
    const [source] = Object.values(presentationSources);
    expect(source).toContain('east -> +X, up -> +Y, north -> -Z');
    expect(source).not.toMatch(/from\s+['"]three(?:\/[^'"]*)?['"]/);
  });
});
