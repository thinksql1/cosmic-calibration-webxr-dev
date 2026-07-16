export interface ScientificRevisions {
  readonly observer: number;
  readonly time: number;
  readonly geographicCalibration: number;
  readonly configuration: number;
}

export const INITIAL_SCIENTIFIC_REVISIONS: ScientificRevisions = Object.freeze({
  observer: 0,
  time: 0,
  geographicCalibration: 0,
  configuration: 0,
});
