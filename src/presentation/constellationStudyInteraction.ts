import type { Course50ConstellationIdentifier } from '../science/constellations/constellationCatalogV3B';
import {
  constellationLearningGroup,
  type ConstellationLearningGroupId,
} from '../science/constellations/constellationLearningGroups';
import type { CelestialAppearancePreferences } from './color/celestialColorModes';

/**
 * Applies the explicit study intent of choosing a learning group.  This is
 * deliberately presentation state only: it does not write persistence or
 * touch catalogue/geometry data.
 */
export interface ManualConstellationGroupSelection {
  readonly group: ConstellationLearningGroupId;
  readonly selected: readonly Course50ConstellationIdentifier[];
  readonly masterVisible: true;
  readonly appearance: CelestialAppearancePreferences;
}

export function manualConstellationGroupSelection(
  groupId: string,
  activeIdentifiers: readonly Course50ConstellationIdentifier[],
  appearance: CelestialAppearancePreferences,
): ManualConstellationGroupSelection | undefined {
  const group = constellationLearningGroup(groupId);
  if (!group || !group.constellationIdentifiers.every((identifier) => activeIdentifiers.includes(identifier))) {
    return undefined;
  }
  return Object.freeze({
    group: group.id,
    selected: Object.freeze([...group.constellationIdentifiers]),
    masterVisible: true,
    appearance: Object.freeze({ ...appearance, constellationMode: 'highlight' }),
  });
}
