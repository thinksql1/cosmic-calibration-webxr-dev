import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { SolarSystemBodyStateService, VISIBLE_SOLAR_SYSTEM_BODIES } from '../../src/science/bodies/solarSystemBodyState';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
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

  it('advances all supported production body directions through one shared deterministic one-hour refresh', () => {
    const clock = new SimulationClock(createSimulationInstant('2025-06-21T16:00:00.000Z', 'frozen-test'));
    clock.startRealtime();
    const observer = new ObserverStateStore();
    observer.set({
      latitudeDeg: 42,
      longitudeDegEast: -83,
      elevationMeters: 250,
      source: 'one-hour all-body regression',
    });
    const calibration = new GeographicCalibrationStateAdapter();
    calibration.update({
      kind: 'calibrated',
      calibration: {
        yawRadians: 0,
        capturedDirection: { x: 0, y: 0, z: -1 },
        timestamp: 1,
        simulated: true,
      },
    });
    const configuration = new ScientificConfigurationStore();
    const providers = createScientificProviderRegistry();
    const bodyService = new SolarSystemBodyStateService(providers);
    let creationSequence = 0;
    const capture = () => {
      const input: ScientificSnapshotInput = {
        observer: observer.current,
        clock: clock.current,
        calibration: calibration.current,
        configuration: configuration.current,
        providers,
        creationSequence: ++creationSequence,
      };
      const result = buildScientificSnapshot(input);
      if (result.kind !== 'ready') throw new Error('Expected ready all-body scheduler fixture.');
      return bodyService.capture(result.snapshot);
    };

    const scheduler = new RealtimeCelestialUpdateScheduler();
    expect(scheduler.advance(0, clock).shouldRefreshScientificState).toBe(false);
    const initialClock = clock.current;
    const initial = capture();
    const refresh = scheduler.advance(3_600_000, clock);
    expect(refresh).toEqual({ clockAdvanced: true, shouldRefreshScientificState: true });
    const refreshed = capture();

    expect(clock.current.instant.unixMilliseconds - initialClock.instant.unixMilliseconds).toBe(3_600_000);
    expect(clock.current.revision).toBeGreaterThan(initialClock.revision);
    expect(initial.bodies.map(({ body }) => body)).toEqual(VISIBLE_SOLAR_SYSTEM_BODIES);
    expect(refreshed.bodies.map(({ body }) => body)).toEqual(VISIBLE_SOLAR_SYSTEM_BODIES);
    expect(bodyService.cacheSize).toBe(0);

    for (const body of VISIBLE_SOLAR_SYSTEM_BODIES) {
      const before = initial.bodies.find((result) => result.body === body)!;
      const after = refreshed.bodies.find((result) => result.body === body)!;
      const left = before.horizontal.direction;
      const right = after.horizontal.direction;
      const dot = Math.max(-1, Math.min(1,
        left.east * right.east + left.north * right.north + left.up * right.up,
      ));
      expect(
        Math.acos(dot),
        `${body} must move after the shared one-hour production refresh`,
      ).toBeGreaterThan(1e-8);
      expect(after.horizontal.provenance.simulationInstant.utcIso).toBe(clock.current.instant.utcIso);
      expect(after.horizontal.provenance.observer).toEqual(observer.current.kind === 'ready'
        ? observer.current.observer
        : undefined);
      expect(after.horizontal.provenance.correctionProfile.id).toBe('AE_APPARENT_TOPOCENTRIC_AIRLESS');
      expect(after.horizontal.provenance.outputFrame).toBe('HORIZONTAL_ENU');
    }
  });
});
