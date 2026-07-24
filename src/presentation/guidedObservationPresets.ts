import type { Course40ConstellationIdentifier } from '../science/constellations/constellationCatalogV3A';
import type { ConstellationLearningGroupId } from '../science/constellations/constellationLearningGroups';
import type { ConstellationColorMode, ConstellationColorStrength } from './color/celestialColorModes';
import type { ConstellationBaseColorId, ConstellationHighlightColorId } from './color/celestialColorCatalog';

export type GuidedObservationPresetId = 'local-orientation' | 'introduction-anchors' | 'north-star-and-circumpolar';
export interface GuidedObservationState { readonly horizon: boolean; readonly constellations: boolean; readonly group?: ConstellationLearningGroupId; readonly selected: readonly Course40ConstellationIdentifier[]; readonly colorMode: ConstellationColorMode; readonly base: ConstellationBaseColorId; readonly highlight: ConstellationHighlightColorId; readonly strength: ConstellationColorStrength; readonly axis?: boolean; readonly poleMarkers?: boolean; readonly poleLabels?: boolean; readonly earthCore?: boolean; }
export interface GuidedObservationPreset { readonly id: GuidedObservationPresetId; readonly name: string; readonly description: string; readonly objective?: string; readonly order: number; readonly controlled: Readonly<Partial<GuidedObservationState>>; }
const preset = (value: GuidedObservationPreset): GuidedObservationPreset => Object.freeze({ ...value, controlled: Object.freeze({ ...value.controlled }) });
export const GUIDED_OBSERVATION_PRESETS = Object.freeze([
  preset({ id: 'local-orientation', name: 'Local Orientation', description: 'Show the existing local horizon aid without constellation lines.', objective: 'Establish local orientation before sky detail.', order: 1, controlled: { horizon: true, constellations: false, group: 'clear', selected: [], colorMode: 'unified', axis: false, poleMarkers: false, poleLabels: false, earthCore: false } }),
  preset({ id: 'introduction-anchors', name: 'Introduction Anchors', description: 'Observe Orion, Ursa Major, and Cassiopeia.', objective: 'Recognize the primary constellation anchors.', order: 2, controlled: { constellations: true, group: 'introduction-anchors', selected: ['ORI', 'UMA', 'CAS'], colorMode: 'highlight', base: 'celestial-lavender', highlight: 'observation-orange', strength: 'subtle' } }),
  preset({ id: 'north-star-and-circumpolar', name: 'North Star and Circumpolar', description: 'Observe Ursa Minor, Ursa Major, Cassiopeia, Cepheus, and Draco.', objective: 'Use Polaris and nearby circumpolar anchors.', order: 3, controlled: { constellations: true, group: 'north-star-and-circumpolar', selected: ['UMI', 'UMA', 'CAS', 'CEP', 'DRA'], colorMode: 'highlight', base: 'celestial-lavender', highlight: 'observation-orange', strength: 'subtle', axis: false, poleMarkers: false, poleLabels: false, earthCore: false } }),
] as const);
export function guidedObservationPreset(id: string): GuidedObservationPreset | undefined { return GUIDED_OBSERVATION_PRESETS.find((candidate) => candidate.id === id); }
export interface GuidedObservationSession { readonly original?: GuidedObservationState; readonly active?: GuidedObservationPresetId; }
export function applyGuidedObservationPreset(session: GuidedObservationSession, id: string, current: GuidedObservationState) { const value = guidedObservationPreset(id); if (!value) return Object.freeze({ applied: false, session, state: current }); return Object.freeze({ applied: true, session: Object.freeze({ original: session.original ?? current, active: value.id }), state: Object.freeze({ ...current, ...value.controlled }) }); }
export function restoreGuidedObservationPreset(session: GuidedObservationSession, current: GuidedObservationState) { return session.original ? Object.freeze({ restored: true, session: Object.freeze({}), state: session.original }) : Object.freeze({ restored: false, session, state: current }); }

export interface GuidedObservationControlAdapter { read(): GuidedObservationState; write(state: GuidedObservationState): void; refresh(): void; }
export class GuidedObservationController {
  private session: GuidedObservationSession = Object.freeze({});
  constructor(private readonly adapter: GuidedObservationControlAdapter) {}
  get activePreset(): GuidedObservationPresetId | undefined { return this.session.active; }
  get canRestore(): boolean { return this.session.original !== undefined; }
  clearActivePresetPreservingSnapshot(): void { if (this.session.active) this.session = Object.freeze({ original: this.session.original }); }
  apply(id: string): boolean { const result = applyGuidedObservationPreset(this.session, id, this.adapter.read()); if (!result.applied) return false; this.session = result.session; this.adapter.write(result.state); this.adapter.refresh(); return true; }
  restore(): boolean { const result = restoreGuidedObservationPreset(this.session, this.adapter.read()); if (!result.restored) return false; this.session = result.session; this.adapter.write(result.state); this.adapter.refresh(); return true; }
}
