import { describe, expect, it } from 'vitest';
import { parseConstellationStudyLaunch } from '../../src/presentation/constellationStudy';

describe('first constellation query gate', () => {
  it('keeps the ordinary development URL unchanged', () => {
    expect(parseConstellationStudyLaunch('')).toMatchObject({ enabled: false, explicitlyRequested: false, masterVisible: false, showEndpointMarkers: false, frame: 'real-sky' });
  });
  it('enables the study while preserving the recommended master-off default', () => {
    const launch = parseConstellationStudyLaunch('?constellationStudy=first-set');
    expect(launch).toMatchObject({ enabled: true, explicitlyRequested: true, masterVisible: false });
    expect([...launch.enabledConstellations]).toEqual(['ORI', 'UMA', 'CAS', 'CYG', 'TAU', 'LEO', 'SCO']);
  });
  it('parses explicit visibility, identifiers, endpoints, and canonical diagnostics deterministically', () => {
    const launch = parseConstellationStudyLaunch('?constellationStudy=first-set&showConstellations=1&constellations=ori,cyg,bad&constellationEndpoints=1&constellationFrame=canonical');
    expect(launch).toMatchObject({ enabled: true, masterVisible: true, showEndpointMarkers: true, frame: 'canonical-eqj' });
    expect([...launch.enabledConstellations]).toEqual(['ORI', 'CYG']);
  });
  it('does not enable an invalid mode', () => {
    expect(parseConstellationStudyLaunch('?constellationStudy=unknown&showConstellations=1')).toMatchObject({ enabled: false, explicitlyRequested: true, masterVisible: false });
  });
  it('uses the bounded expanded study with an introduction-anchor selection by default', () => {
    const launch = parseConstellationStudyLaunch('?constellationStudy=expanded');
    expect(launch).toMatchObject({ enabled: true, mode: 'expanded', masterVisible: false, selectedGroup: 'introduction-anchors' });
    expect([...launch.enabledConstellations]).toEqual(['ORI', 'UMA', 'CAS']);
  });
  it('accepts the course-set alias and deterministic selected group', () => {
    const launch = parseConstellationStudyLaunch('?constellationStudy=course-set&constellationGroup=zodiac&showConstellations=1');
    expect(launch).toMatchObject({ enabled: true, mode: 'expanded', selectedGroup: 'zodiac', masterVisible: true });
    expect([...launch.enabledConstellations]).toContain('LIB');
  });
});
