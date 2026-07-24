import { guidedObservationPreset, type GuidedObservationPresetId } from './guidedObservationPresets';

export interface GuidedObservationUiStatus {
  readonly activePreset: GuidedObservationPresetId | undefined;
  readonly canRestore: boolean;
}

export interface GuidedObservationUiActions {
  apply(id: GuidedObservationPresetId): boolean;
  restore(): boolean;
  status(): GuidedObservationUiStatus;
}

export interface GuidedObservationUiButton {
  disabled: boolean;
  setAttribute(name: string, value: string): void;
  addEventListener(type: 'click', listener: () => void): void;
}

export interface GuidedObservationUiElements {
  readonly presetButtons: Readonly<Record<GuidedObservationPresetId, GuidedObservationUiButton>>;
  readonly restoreButton: GuidedObservationUiButton;
  readonly statusElement: { textContent: string | null };
}

export const GUIDED_OBSERVATION_UI_PRESET_IDS = Object.freeze([
  'local-orientation',
  'introduction-anchors',
  'north-star-and-circumpolar',
] as const satisfies readonly GuidedObservationPresetId[]);

export function guidedObservationStatusText(status: GuidedObservationUiStatus): string {
  if (status.activePreset) {
    return `Active: ${guidedObservationPreset(status.activePreset)?.name ?? status.activePreset}`;
  }
  return `Active: ${status.canRestore ? 'Modified' : 'None'}`;
}

export function updateGuidedObservationUiStatus(
  elements: GuidedObservationUiElements,
  status: GuidedObservationUiStatus,
): void {
  elements.statusElement.textContent = guidedObservationStatusText(status);
  elements.restoreButton.disabled = !status.canRestore;
  for (const id of GUIDED_OBSERVATION_UI_PRESET_IDS) {
    elements.presetButtons[id].setAttribute('aria-pressed', String(status.activePreset === id));
  }
}

export function bindGuidedObservationUi(
  elements: GuidedObservationUiElements,
  actions: GuidedObservationUiActions,
): void {
  for (const id of GUIDED_OBSERVATION_UI_PRESET_IDS) {
    elements.presetButtons[id].addEventListener('click', () => {
      actions.apply(id);
      updateGuidedObservationUiStatus(elements, actions.status());
    });
  }
  elements.restoreButton.addEventListener('click', () => {
    actions.restore();
    updateGuidedObservationUiStatus(elements, actions.status());
  });
  updateGuidedObservationUiStatus(elements, actions.status());
}
