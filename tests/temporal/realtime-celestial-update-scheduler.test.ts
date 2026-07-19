import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { SimulationClock } from '../../src/science/state/simulationClock';
import {
  MINIMUM_REALTIME_CELESTIAL_REFRESH_MILLISECONDS,
  RealtimeCelestialUpdateScheduler,
} from '../../src/temporal/realtimeCelestialUpdateScheduler';

describe('real-time celestial update scheduler', () => {
  it('advances only the supplied central running clock and refreshes at the minute boundary', () => {
    const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test'));
    clock.startRealtime();
    const scheduler = new RealtimeCelestialUpdateScheduler();
    expect(scheduler.advance(0, clock)).toEqual({ clockAdvanced: false, shouldRefreshScientificState: false });
    expect(scheduler.advance(MINIMUM_REALTIME_CELESTIAL_REFRESH_MILLISECONDS - 1, clock).shouldRefreshScientificState).toBe(false);
    const update = scheduler.advance(MINIMUM_REALTIME_CELESTIAL_REFRESH_MILLISECONDS, clock);
    expect(update).toEqual({ clockAdvanced: true, shouldRefreshScientificState: true });
    expect(clock.current.instant.utcIso).toBe('2025-06-21T16:01:00.000Z');
  });

  it('does not advance paused or frozen clocks and resets its scientific cadence', () => {
    const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test'));
    const scheduler = new RealtimeCelestialUpdateScheduler();
    scheduler.advance(0, clock);
    expect(scheduler.advance(120_000, clock)).toEqual({ clockAdvanced: false, shouldRefreshScientificState: false });
    const instant = clock.current.instant.utcIso;
    clock.startRealtime();
    scheduler.reset(120_000);
    clock.pause();
    expect(scheduler.advance(240_000, clock)).toEqual({ clockAdvanced: false, shouldRefreshScientificState: false });
    expect(clock.current.instant.utcIso).toBe(instant);
  });

  it('scales cadence for existing accelerated rates without adding another clock', () => {
    const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test'));
    clock.startRealtime();
    clock.setRate(60);
    const scheduler = new RealtimeCelestialUpdateScheduler();
    scheduler.advance(0, clock);
    expect(scheduler.advance(999, clock).shouldRefreshScientificState).toBe(false);
    expect(scheduler.advance(1_000, clock).shouldRefreshScientificState).toBe(true);
    expect(clock.current.instant.utcIso).toBe('2025-06-21T16:01:00.000Z');
  });
});
