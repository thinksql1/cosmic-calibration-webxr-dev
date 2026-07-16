import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverState } from '../state/observerState';
import {
  validateSimulationClockState,
  type SimulationClockState,
} from '../state/simulationClock';
import type { ScientificConfiguration } from '../state/scientificConfiguration';
import type { ScientificSnapshotBuildResult } from './scientificSnapshot';
import { ScientificSnapshotCache } from './scientificSnapshotCache';
import { buildScientificSnapshot } from './scientificSnapshotBuilder';
import { createScientificSnapshotKey, isCacheableTime } from './scientificSnapshotKey';

export interface ScientificFoundationState {
  readonly observer: ObserverState;
  readonly clock: SimulationClockState;
  readonly calibration: GeographicCalibrationState;
  readonly configuration: ScientificConfiguration;
}

/**
 * The sole orchestration entry point for future non-visual consumers. Its
 * input is explicit state, so it owns neither UI events nor ambient time.
 */
export class ScientificSnapshotService {
  private sequence = 0;

  constructor(
    private readonly providers: ScientificProviderRegistry,
    private readonly cache = new ScientificSnapshotCache(),
  ) {}

  capture(state: ScientificFoundationState): ScientificSnapshotBuildResult {
    const rawInput = { ...state, providers: this.providers, creationSequence: ++this.sequence };
    let clock: SimulationClockState;
    try {
      clock = validateSimulationClockState(state.clock);
    } catch {
      return buildScientificSnapshot(rawInput);
    }
    const input = { ...rawInput, clock };
    return this.cache.getOrBuild(
      createScientificSnapshotKey(input),
      isCacheableTime(clock),
      () => buildScientificSnapshot(input),
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheDiagnostics() {
    return this.cache.diagnostics;
  }
}
