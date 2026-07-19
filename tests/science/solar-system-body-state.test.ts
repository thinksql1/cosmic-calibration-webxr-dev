import { describe, expect, it } from 'vitest';
import { getApparentTopocentricBody } from '../../src/science/astronomy/astronomyEngineAdapter';
import { createObserver } from '../../src/science/astronomy/observer';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { SUPPORTED_SOLAR_SYSTEM_BODIES } from '../../src/science/astronomy/types';
import { SolarSystemBodyStateService } from '../../src/science/bodies/solarSystemBodyState';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function readySnapshot(
  latitudeDeg = 42,
  instantUtc = '2025-06-21T16:00:00.000Z',
  correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION' = 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -83, elevationMeters: 250, source: 'body fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true },
  });
  const configuration = new ScientificConfigurationStore();
  if (correctionProfile === 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION') {
    configuration.replace({
      precisionTier: 'TIER_1',
      bodyCorrectionProfile: correctionProfile,
      meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
      refractionPolicy: 'normal',
      enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'],
    });
  }
  const input: ScientificSnapshotInput = {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant(instantUtc, 'frozen-test')).current,
    calibration: calibration.current,
    configuration: configuration.current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  };
  const result = buildScientificSnapshot(input);
  if (result.kind !== 'ready') throw new Error('Expected ready fixture snapshot.');
  return result.snapshot;
}

describe('actual solar-system body state', () => {
  it('supports exactly the bounded Sun, Moon, and major-planet list with typed immutable provenance', () => {
    expect(SUPPORTED_SOLAR_SYSTEM_BODIES).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    ]);
    const service = new SolarSystemBodyStateService(createScientificProviderRegistry());
    const result = service.capture(readySnapshot());
    expect(result.bodies.map((body) => body.body)).toEqual(SUPPORTED_SOLAR_SYSTEM_BODIES);
    expect(Object.isFrozen(result)).toBe(true);
    for (const body of result.bodies) {
      expect(body.validity).toBe('VALID');
      expect(body.equatorial.frame).toBe('EQD_TRUE');
      expect(body.horizontal.frame).toBe('HORIZONTAL_ENU');
      expect(body.horizontal.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(body.horizontal.azimuthDeg).toBeLessThanOrEqual(360);
      expect(Number.isFinite(body.horizontal.altitudeDeg)).toBe(true);
      expect(Math.hypot(body.horizontal.direction.east, body.horizontal.direction.north, body.horizontal.direction.up)).toBeCloseTo(1, 13);
      expect(body.horizontal.provenance.correctionProfile.id).toBe('AE_APPARENT_TOPOCENTRIC_AIRLESS');
    }
  });

  it('is deterministic for frozen observer/time inputs, caches those inputs, and changes with observer or instant', () => {
    const service = new SolarSystemBodyStateService(createScientificProviderRegistry());
    const fixture = readySnapshot(42, '2025-06-21T16:00:00.000Z');
    const first = service.capture(fixture);
    expect(service.capture(fixture)).toBe(first);
    expect(service.cacheSize).toBe(1);
    const later = service.capture(readySnapshot(42, '2025-12-21T16:00:00.000Z'));
    const south = service.capture(readySnapshot(-42, '2025-06-21T16:00:00.000Z'));
    const refracted = service.capture(readySnapshot(42, '2025-06-21T16:00:00.000Z', 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'));
    expect(later.bodies.find(({ body }) => body === 'Sun')!.horizontal.direction)
      .not.toEqual(first.bodies.find(({ body }) => body === 'Sun')!.horizontal.direction);
    expect(south.bodies.find(({ body }) => body === 'Moon')!.horizontal.direction)
      .not.toEqual(first.bodies.find(({ body }) => body === 'Moon')!.horizontal.direction);
    expect(refracted.cacheKey).not.toBe(first.cacheKey);
    expect(refracted.correctionProfile).toBe('AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION');
    const realtimeSnapshot = Object.freeze({
      ...fixture,
      clock: Object.freeze({ ...fixture.clock, mode: 'realtime' as const, paused: false }),
    });
    expect(service.capture(realtimeSnapshot)).not.toBe(service.capture(realtimeSnapshot));
  });

  it('preserves below-horizon and celestial-equator truth without clamping or projecting', () => {
    const observer = createObserver({ latitudeDeg: -33.8688, longitudeDegEast: 151.2093, elevationMeters: 58 });
    const instant = createSimulationInstant('2025-10-15T10:00:00.000Z', 'frozen-test');
    const moon = getApparentTopocentricBody('Moon', instant, observer, 'AE_APPARENT_TOPOCENTRIC_AIRLESS');
    expect(moon.horizontal.altitudeDeg).toBeLessThan(0);
    expect(moon.aboveHorizon).toBe(false);
    expect(moon.horizontal.direction.up).toBeLessThan(0);
    expect(moon.celestialEquatorRelation).toBe(
      moon.equatorial.declinationDeg > 0 ? 'NORTH' : moon.equatorial.declinationDeg < 0 ? 'SOUTH' : 'ON',
    );
  });
});
