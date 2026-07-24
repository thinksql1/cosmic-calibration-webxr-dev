import { describe, expect, it } from 'vitest';
import {
  bindGuidedObservationUi,
  GUIDED_OBSERVATION_UI_PRESET_IDS,
  updateGuidedObservationUiStatus,
  type GuidedObservationUiActions,
  type GuidedObservationUiButton,
  type GuidedObservationUiElements,
  type GuidedObservationUiStatus,
} from '../../src/presentation/guidedObservationUi';
import type { GuidedObservationPresetId } from '../../src/presentation/guidedObservationPresets';

class FakeButton implements GuidedObservationUiButton {
  disabled = false;
  readonly attributes = new Map<string, string>();
  private readonly listeners: (() => void)[] = [];

  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  addEventListener(type: 'click', listener: () => void): void {
    if (type === 'click') this.listeners.push(listener);
  }
  click(): void { this.listeners.forEach((listener) => listener()); }
  get listenerCount(): number { return this.listeners.length; }
}

function uiHarness() {
  const buttons = Object.freeze({
    'local-orientation': new FakeButton(),
    'introduction-anchors': new FakeButton(),
    'north-star-and-circumpolar': new FakeButton(),
  });
  const restoreButton = new FakeButton();
  const statusElement = { textContent: null as string | null };
  let status: GuidedObservationUiStatus = Object.freeze({ activePreset: undefined, canRestore: false });
  const applications: GuidedObservationPresetId[] = [];
  let restores = 0;
  const actions: GuidedObservationUiActions = {
    apply: (id) => {
      applications.push(id);
      status = Object.freeze({ activePreset: id, canRestore: true });
      return true;
    },
    restore: () => {
      restores += 1;
      status = Object.freeze({ activePreset: undefined, canRestore: false });
      return true;
    },
    status: () => status,
  };
  return {
    buttons, restoreButton, statusElement, actions,
    applications: () => applications,
    restores: () => restores,
    setStatus: (next: GuidedObservationUiStatus) => { status = next; },
  };
}

describe('guided observation UI', () => {
  it('initializes the three preset actions, inactive Restore, and no active preset', () => {
    const ui = uiHarness();
    bindGuidedObservationUi(Object.freeze({
      presetButtons: ui.buttons, restoreButton: ui.restoreButton, statusElement: ui.statusElement,
    }), ui.actions);

    expect(GUIDED_OBSERVATION_UI_PRESET_IDS).toEqual([
      'local-orientation', 'introduction-anchors', 'north-star-and-circumpolar',
    ]);
    expect(ui.statusElement.textContent).toBe('Active: None');
    expect(ui.restoreButton.disabled).toBe(true);
    for (const id of GUIDED_OBSERVATION_UI_PRESET_IDS) {
      expect(ui.buttons[id].attributes.get('aria-pressed')).toBe('false');
      expect(ui.buttons[id].listenerCount).toBe(1);
    }
    expect(ui.restoreButton.listenerCount).toBe(1);
  });

  it('applies exactly the clicked preset, updates active state, and does not accumulate listeners', () => {
    const ui = uiHarness();
    const elements: GuidedObservationUiElements = Object.freeze({ presetButtons: ui.buttons, restoreButton: ui.restoreButton, statusElement: ui.statusElement });
    bindGuidedObservationUi(elements, ui.actions);
    ui.buttons['introduction-anchors'].click();
    expect(ui.applications()).toEqual(['introduction-anchors']);
    expect(ui.statusElement.textContent).toBe('Active: Introduction Anchors');
    expect(ui.restoreButton.disabled).toBe(false);
    expect(ui.buttons['introduction-anchors'].attributes.get('aria-pressed')).toBe('true');
    expect(ui.buttons['local-orientation'].attributes.get('aria-pressed')).toBe('false');

    ui.buttons['north-star-and-circumpolar'].click();
    expect(ui.applications()).toEqual(['introduction-anchors', 'north-star-and-circumpolar']);
    expect(ui.statusElement.textContent).toBe('Active: North Star and Circumpolar');
    expect(ui.buttons['introduction-anchors'].attributes.get('aria-pressed')).toBe('false');
    expect(ui.buttons['north-star-and-circumpolar'].attributes.get('aria-pressed')).toBe('true');
    updateGuidedObservationUiStatus(elements, ui.actions.status());
    expect(ui.buttons['north-star-and-circumpolar'].listenerCount).toBe(1);
  });

  it('shows Modified after external controlled-input invalidation while keeping Restore available', () => {
    const ui = uiHarness();
    const elements: GuidedObservationUiElements = Object.freeze({ presetButtons: ui.buttons, restoreButton: ui.restoreButton, statusElement: ui.statusElement });
    bindGuidedObservationUi(elements, ui.actions);
    ui.buttons['local-orientation'].click();
    ui.setStatus(Object.freeze({ activePreset: undefined, canRestore: true }));
    updateGuidedObservationUiStatus(elements, ui.actions.status());

    expect(ui.statusElement.textContent).toBe('Active: Modified');
    expect(ui.restoreButton.disabled).toBe(false);
    for (const id of GUIDED_OBSERVATION_UI_PRESET_IDS) expect(ui.buttons[id].attributes.get('aria-pressed')).toBe('false');
  });

  it('restores through the supplied action and returns safely to the inactive status', () => {
    const ui = uiHarness();
    const elements: GuidedObservationUiElements = Object.freeze({ presetButtons: ui.buttons, restoreButton: ui.restoreButton, statusElement: ui.statusElement });
    bindGuidedObservationUi(elements, ui.actions);
    ui.buttons['local-orientation'].click();
    ui.restoreButton.click();
    ui.restoreButton.click();

    expect(ui.restores()).toBe(2);
    expect(ui.statusElement.textContent).toBe('Active: None');
    expect(ui.restoreButton.disabled).toBe(true);
    for (const id of GUIDED_OBSERVATION_UI_PRESET_IDS) expect(ui.buttons[id].attributes.get('aria-pressed')).toBe('false');
  });
});
