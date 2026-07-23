import { FIRST_CONSTELLATION_IDENTIFIERS, type FirstConstellationIdentifier } from '../science/constellations/firstConstellationCatalog';

export const FIRST_CONSTELLATION_STUDY_MODE = 'first-set' as const;

export interface ConstellationStudyLaunch {
  readonly enabled: boolean;
  readonly explicitlyRequested: boolean;
  readonly masterVisible: boolean;
  readonly enabledConstellations: ReadonlySet<FirstConstellationIdentifier>;
  readonly showEndpointMarkers: boolean;
  readonly frame: 'real-sky' | 'canonical-eqj';
}

export function parseConstellationStudyLaunch(search: string): ConstellationStudyLaunch {
  const parameters = new URLSearchParams(search);
  const rawMode = parameters.get('constellationStudy');
  const enabled = rawMode === FIRST_CONSTELLATION_STUDY_MODE;
  const requestedIdentifiers = (parameters.get('constellations') ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is FirstConstellationIdentifier => FIRST_CONSTELLATION_IDENTIFIERS.includes(value as FirstConstellationIdentifier));
  const explicitMaster = parameters.get('showConstellations');
  return Object.freeze({
    enabled,
    explicitlyRequested: rawMode !== null,
    masterVisible: enabled && (explicitMaster === '1' || explicitMaster === 'true'),
    enabledConstellations: new Set(requestedIdentifiers.length > 0 ? requestedIdentifiers : FIRST_CONSTELLATION_IDENTIFIERS),
    showEndpointMarkers: enabled && parameters.get('constellationEndpoints') === '1',
    frame: parameters.get('constellationFrame') === 'canonical' ? 'canonical-eqj' : 'real-sky',
  });
}
