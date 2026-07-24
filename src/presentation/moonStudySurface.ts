import type { MoonStudyLaunch } from './moonStudy';

/**
 * A constellation course is an instructional control surface, so it exposes
 * the already-existing lunar study controls without changing their defaults.
 */
export function resolveMoonStudySurface(
  moonStudy: MoonStudyLaunch,
  constellationStudyEnabled: boolean,
  diagnosticsEnabled: boolean,
): Readonly<{ enabled: boolean; controlsVisible: boolean }> {
  return Object.freeze({
    enabled: moonStudy.enabled || constellationStudyEnabled,
    controlsVisible: diagnosticsEnabled || moonStudy.explicitlyRequested || constellationStudyEnabled,
  });
}
