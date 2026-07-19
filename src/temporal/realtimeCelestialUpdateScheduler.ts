import type { SimulationClock } from '../science/state/simulationClock';

export const MINIMUM_REALTIME_CELESTIAL_REFRESH_MILLISECONDS = 60_000;

export interface RealtimeCelestialUpdateResult {
  readonly clockAdvanced: boolean;
  readonly shouldRefreshScientificState: boolean;
}

/**
 * Presentation-owned cadence controller. It owns no astronomy and advances the
 * one central simulation clock only through explicit monotonic elapsed input.
 */
export class RealtimeCelestialUpdateScheduler {
  private previousMonotonicMilliseconds: number | undefined;
  private accumulatedSinceScientificRefreshMilliseconds = 0;

  reset(monotonicMilliseconds?: number): void {
    this.previousMonotonicMilliseconds = monotonicMilliseconds;
    this.accumulatedSinceScientificRefreshMilliseconds = 0;
  }

  advance(
    monotonicMilliseconds: number,
    clock: SimulationClock,
  ): RealtimeCelestialUpdateResult {
    if (!Number.isFinite(monotonicMilliseconds)) {
      throw new Error('Realtime scheduler requires a finite monotonic timestamp.');
    }
    const previous = this.previousMonotonicMilliseconds;
    this.previousMonotonicMilliseconds = monotonicMilliseconds;
    if (previous === undefined) {
      return Object.freeze({ clockAdvanced: false, shouldRefreshScientificState: false });
    }
    const elapsed = Math.max(0, monotonicMilliseconds - previous);
    const before = clock.current;
    const after = clock.tick(elapsed);
    const clockAdvanced = after !== before;
    if (!clockAdvanced) {
      this.accumulatedSinceScientificRefreshMilliseconds = 0;
      return Object.freeze({ clockAdvanced: false, shouldRefreshScientificState: false });
    }
    this.accumulatedSinceScientificRefreshMilliseconds += elapsed;
    const rateMagnitude = Math.max(1, Math.abs(after.timeRate));
    const cadence = Math.max(1_000, MINIMUM_REALTIME_CELESTIAL_REFRESH_MILLISECONDS / rateMagnitude);
    if (this.accumulatedSinceScientificRefreshMilliseconds < cadence) {
      return Object.freeze({ clockAdvanced: true, shouldRefreshScientificState: false });
    }
    this.accumulatedSinceScientificRefreshMilliseconds = 0;
    return Object.freeze({ clockAdvanced: true, shouldRefreshScientificState: true });
  }
}
