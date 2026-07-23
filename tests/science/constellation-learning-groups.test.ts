import { describe, expect, it } from 'vitest';
import { CONSTELLATION_LEARNING_GROUPS, constellationLearningGroup, validateConstellationLearningGroups } from '../../src/science/constellations/constellationLearningGroups';

describe('constellation learning groups', () => {
  it('keeps the requested introduction and zodiac sets declarative and valid', () => {
    expect(constellationLearningGroup('introduction-anchors')?.constellationIdentifiers).toEqual(['ORI', 'UMA', 'CAS']);
    expect(constellationLearningGroup('zodiac')?.constellationIdentifiers).toContain('LIB');
    expect(CONSTELLATION_LEARNING_GROUPS.find((value) => value.id === 'all-expanded')?.constellationIdentifiers).toHaveLength(29);
    expect(validateConstellationLearningGroups()).toEqual([]);
  });
});
