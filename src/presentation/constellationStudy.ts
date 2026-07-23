import {
  EXPANDED_CONSTELLATION_IDENTIFIERS,
} from '../science/constellations/constellationCatalogV2';
import { COURSE_40_CONSTELLATION_IDENTIFIERS, type Course40ConstellationIdentifier } from '../science/constellations/constellationCatalogV3A';
import { FIRST_CONSTELLATION_IDENTIFIERS } from '../science/constellations/firstConstellationCatalog';
import {
  constellationLearningGroup,
  type ConstellationLearningGroupId,
} from '../science/constellations/constellationLearningGroups';

export const FIRST_CONSTELLATION_STUDY_MODE = 'first-set' as const;
export const EXPANDED_CONSTELLATION_STUDY_MODE = 'expanded' as const;
export const COURSE_40_CONSTELLATION_STUDY_MODE = 'course-40' as const;
export type ConstellationStudyMode = typeof FIRST_CONSTELLATION_STUDY_MODE | typeof EXPANDED_CONSTELLATION_STUDY_MODE | typeof COURSE_40_CONSTELLATION_STUDY_MODE;

export interface ConstellationStudyLaunch {
  readonly enabled: boolean;
  readonly explicitlyRequested: boolean;
  readonly mode: ConstellationStudyMode | 'off';
  readonly masterVisible: boolean;
  readonly enabledConstellations: ReadonlySet<Course40ConstellationIdentifier>;
  readonly selectedGroup: ConstellationLearningGroupId | undefined;
  readonly showEndpointMarkers: boolean;
  readonly frame: 'real-sky' | 'canonical-eqj';
}

function parseMode(raw: string | null): ConstellationStudyMode | 'off' {
  if (raw === FIRST_CONSTELLATION_STUDY_MODE) return FIRST_CONSTELLATION_STUDY_MODE;
  if (raw === EXPANDED_CONSTELLATION_STUDY_MODE || raw === 'course-set') return EXPANDED_CONSTELLATION_STUDY_MODE;
  if (raw === COURSE_40_CONSTELLATION_STUDY_MODE || raw === 'course-v3a') return COURSE_40_CONSTELLATION_STUDY_MODE;
  return 'off';
}

export function parseConstellationStudyLaunch(search: string): ConstellationStudyLaunch {
  const parameters = new URLSearchParams(search);
  const mode = parseMode(parameters.get('constellationStudy'));
  const enabled = mode !== 'off';
  const group = mode === EXPANDED_CONSTELLATION_STUDY_MODE || mode === COURSE_40_CONSTELLATION_STUDY_MODE
    ? constellationLearningGroup(parameters.get('constellationGroup') ?? 'introduction-anchors')
    : undefined;
  const validIdentifiers: readonly Course40ConstellationIdentifier[] = mode === FIRST_CONSTELLATION_STUDY_MODE
    ? FIRST_CONSTELLATION_IDENTIFIERS
    : mode === COURSE_40_CONSTELLATION_STUDY_MODE ? COURSE_40_CONSTELLATION_IDENTIFIERS : EXPANDED_CONSTELLATION_IDENTIFIERS;
  const requestedIdentifiers = (parameters.get('constellations') ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is Course40ConstellationIdentifier => validIdentifiers.includes(value as Course40ConstellationIdentifier));
  const fallback = mode === FIRST_CONSTELLATION_STUDY_MODE
    ? FIRST_CONSTELLATION_IDENTIFIERS
    : group?.constellationIdentifiers ?? [];
  const explicitMaster = parameters.get('showConstellations');
  return Object.freeze({
    enabled,
    explicitlyRequested: parameters.has('constellationStudy'),
    mode,
    masterVisible: enabled && (explicitMaster === '1' || explicitMaster === 'true'),
    enabledConstellations: new Set(requestedIdentifiers.length > 0 ? requestedIdentifiers : fallback),
    selectedGroup: group?.id,
    showEndpointMarkers: enabled && parameters.get('constellationEndpoints') === '1',
    frame: parameters.get('constellationFrame') === 'canonical' ? 'canonical-eqj' : 'real-sky',
  });
}
