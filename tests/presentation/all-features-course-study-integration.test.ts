import { describe, expect, it } from 'vitest';
import markup from '../../index.html?raw';
import { parseConstellationStudyLaunch } from '../../src/presentation/constellationStudy';
import { manualConstellationGroupSelection } from '../../src/presentation/constellationStudyInteraction';
import { DEFAULT_CELESTIAL_COLOR_SETTINGS } from '../../src/presentation/color/celestialColorModes';
import { resolveConstellationColor } from '../../src/presentation/color/constellationColorPolicy';
import { parseMoonStudyLaunch } from '../../src/presentation/moonStudy';
import { resolveMoonStudySurface } from '../../src/presentation/moonStudySurface';

describe('all-features course-study integration', () => {
  it('makes a manual Course-40 learning group render-eligible and visibly highlighted', () => {
    const launch = parseConstellationStudyLaunch('?constellationStudy=course-40');
    const interaction = manualConstellationGroupSelection(
      'introduction-anchors',
      [...launch.enabledConstellations, 'UMI', 'CNC', 'CVN', 'COM', 'CRV', 'CRT', 'MON', 'LEP', 'DEL', 'SGE', 'TRI'],
      DEFAULT_CELESTIAL_COLOR_SETTINGS,
    );
    expect(interaction).toMatchObject({
      masterVisible: true,
      group: 'introduction-anchors',
      selected: ['ORI', 'UMA', 'CAS'],
      appearance: { constellationMode: 'highlight' },
    });
    const selected = resolveConstellationColor(
      'ORI',
      interaction!.appearance.constellationMode,
      interaction!.appearance.constellationStrength,
      interaction!.group,
      interaction!.appearance.constellationBaseColor,
      interaction!.appearance.constellationHighlightColor,
    );
    const context = resolveConstellationColor(
      'CYG',
      interaction!.appearance.constellationMode,
      interaction!.appearance.constellationStrength,
      interaction!.group,
      interaction!.appearance.constellationBaseColor,
      interaction!.appearance.constellationHighlightColor,
    );
    expect(selected).toMatchObject({ role: 'selected-group', colorSource: 'introduction-anchors:observation-orange' });
    expect(selected.token.cssHex).toBe('#C99255');
    expect(selected.token.cssHex).not.toBe(context.token.cssHex);
    expect(context).toMatchObject({ role: 'context', colorSource: 'derived-context:celestial-lavender' });
  });

  it('keeps all existing lunar controls available in a constellation course without enabling them by default', () => {
    const surface = resolveMoonStudySurface(parseMoonStudyLaunch('?constellationStudy=course-40'), true, false);
    expect(surface).toEqual({ enabled: true, controlsVisible: true });
    expect(parseMoonStudyLaunch('?constellationStudy=course-40')).toMatchObject({
      showMoonPath: false,
      showLunarPhaseTransitPath: false,
      showLunarPhaseNotches: false,
      showCurrentLunarTransit: false,
      showMoonPhaseDial: false,
      showCurrentMoonAppearance: false,
    });
    expect(resolveMoonStudySurface(parseMoonStudyLaunch(''), false, false)).toEqual({ enabled: false, controlsVisible: false });
  });

  it('keeps the complete Course-40 control surface in the shipped markup', () => {
    for (const id of [
      'guided-observation-controls',
      'constellation-study-controls',
      'moon-study-controls',
      'show-moon-path',
      'show-lunar-phase-transit-path',
      'show-lunar-phase-notches',
      'show-current-lunar-transit',
      'show-moon-phase-dial',
      'show-current-moon-appearance',
      'lunar-path-palette',
    ]) expect(markup).toContain(`id="${id}"`);
  });
});
