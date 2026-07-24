import { describe, expect, it } from 'vitest';
import { GUIDED_OBSERVATION_PRESETS, applyGuidedObservationPreset, restoreGuidedObservationPreset, type GuidedObservationState } from '../../src/presentation/guidedObservationPresets';
const state: GuidedObservationState = { horizon: false, constellations: false, selected: [], colorMode: 'unified', base: 'celestial-lavender', highlight: 'observation-orange', strength: 'subtle' };
describe('guided observation presets', () => {
  it('registers exactly the three required unique definitions', () => expect(GUIDED_OBSERVATION_PRESETS.map((preset) => preset.id)).toEqual(['local-orientation', 'introduction-anchors', 'north-star-and-circumpolar']));
  it('is idempotent, retains the first snapshot, and restores safely', () => { const first = applyGuidedObservationPreset({}, 'introduction-anchors', state); const repeat = applyGuidedObservationPreset(first.session, 'introduction-anchors', first.state); const switched = applyGuidedObservationPreset(repeat.session, 'north-star-and-circumpolar', repeat.state); expect(switched.session.original).toBe(state); expect(switched.state.selected).toEqual(['UMI', 'UMA', 'CAS', 'CEP', 'DRA']); const restored = restoreGuidedObservationPreset(switched.session, switched.state); expect(restored.state).toBe(state); expect(restoreGuidedObservationPreset(restored.session, restored.state).restored).toBe(false); });
  it('safely rejects unknown preset identifiers', () => expect(applyGuidedObservationPreset({}, 'unknown', state)).toMatchObject({ applied: false, state }));
});
