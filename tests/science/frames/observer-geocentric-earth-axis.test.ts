import { describe, expect, it } from 'vitest';
import { createSimulationInstant } from '../../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../../src/science/providers/scientificProviderRegistry';
import { GeographicCalibrationStateAdapter } from '../../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../../src/science/state/simulationClock';
import { buildScientificSnapshot } from '../../../src/science/snapshot/scientificSnapshotBuilder';
import {
  WGS84_INVERSE_FLATTENING,
  WGS84_SEMI_MAJOR_AXIS_METERS,
} from '../../../src/science/frames/observerGeocentricEarthAxis';

function snapshot(
  latitudeDeg: number,
  longitudeDegEast = 0,
  elevationMeters = 0,
  verticalDatum: 'MEAN_SEA_LEVEL' | 'WGS84_ELLIPSOID' = 'WGS84_ELLIPSOID',
) {
  const observer = new ObserverStateStore();
  observer.set({
    latitudeDeg,
    longitudeDegEast,
    elevationMeters,
    horizontalDatum: 'WGS84',
    verticalDatum,
    source: 'geocentric fixture',
  });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: {
      acceptedRevision: 1,
      yawRadians: 0,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: 1,
      simulated: true,
    },
  }, 'desktop-simulation');
  const result = buildScientificSnapshot({
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant('2025-06-21T16:00:00Z', 'frozen-test')).current,
    calibration: calibration.current,
    configuration: new ScientificConfigurationStore().current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  });
  if (result.kind !== 'ready') throw new Error('Expected ready geocentric fixture.');
  return result.snapshot;
}

describe('observer geocentric Earth-axis placement', () => {
  it('places the WGS84 Earth core directly below an equatorial observer', () => {
    const placement = snapshot(0).observerGeocentricEarthAxis;
    expect(placement.observerSurfaceOrigin).toEqual({
      frame: 'HORIZONTAL_ENU',
      units: 'meters',
      east: 0,
      north: 0,
      up: 0,
    });
    expect(placement.earthCore.east).toBeCloseTo(0, 8);
    expect(placement.earthCore.north).toBeCloseTo(0, 8);
    expect(placement.earthCore.up).toBeCloseTo(-WGS84_SEMI_MAJOR_AXIS_METERS, 6);
    expect(placement.observerToCoreDistanceMeters).toBeCloseTo(WGS84_SEMI_MAJOR_AXIS_METERS, 6);
    expect(placement.observerToAxisDistanceMeters).toBeCloseTo(WGS84_SEMI_MAJOR_AXIS_METERS, 6);
  });

  it('uses the WGS84 polar radius and places a pole observer on the rotation axis', () => {
    const placement = snapshot(90).observerGeocentricEarthAxis;
    const flattening = 1 / WGS84_INVERSE_FLATTENING;
    const polarRadius = WGS84_SEMI_MAJOR_AXIS_METERS * (1 - flattening);
    expect(placement.earthCore.up).toBeCloseTo(-polarRadius, 5);
    expect(placement.observerToCoreDistanceMeters).toBeCloseTo(polarRadius, 5);
    expect(placement.observerToAxisDistanceMeters).toBeLessThan(1e-8);
  });

  it('keeps geocentric placement longitude-invariant in the local ENU frame', () => {
    const zero = snapshot(42, 0).observerGeocentricEarthAxis;
    const east = snapshot(42, 123).observerGeocentricEarthAxis;
    expect(east.earthCore.east).toBeCloseTo(zero.earthCore.east, 8);
    expect(east.earthCore.north).toBeCloseTo(zero.earthCore.north, 8);
    expect(east.earthCore.up).toBeCloseTo(zero.earthCore.up, 8);
    expect(east.observerToAxisDistanceMeters).toBeCloseTo(zero.observerToAxisDistanceMeters, 7);
  });

  it('keeps the off-axis surface observer distinct from the actual modeled core and axis', () => {
    const placement = snapshot(42).observerGeocentricEarthAxis;
    expect(placement.earthCore).not.toEqual(placement.observerSurfaceOrigin);
    expect(placement.observerToCoreDistanceMeters).toBeGreaterThan(6_300_000);
    expect(placement.observerToAxisDistanceMeters).toBeGreaterThan(4_000_000);
    expect(placement.presentationTopology).toBe('GEOCENTRIC_LINE_WITH_PROJECTIVE_POLES_AT_INFINITY');
  });

  it('derives the south pole as an exact antipode of the owned north direction', () => {
    const placement = snapshot(-34).observerGeocentricEarthAxis;
    expect(placement.southDirection.east).toBe(-placement.northDirection.east);
    expect(placement.southDirection.north).toBe(-placement.northDirection.north);
    expect(placement.southDirection.up).toBe(-placement.northDirection.up);
    expect(Object.isFrozen(placement.northDirection)).toBe(true);
    expect(Object.isFrozen(placement.southDirection)).toBe(true);
    expect(Object.isFrozen(placement.earthCore)).toBe(true);
  });

  it('makes the MSL-to-ellipsoid Tier 1 approximation explicit', () => {
    const placement = snapshot(42, 0, 250, 'MEAN_SEA_LEVEL').observerGeocentricEarthAxis;
    expect(placement.elevationTreatment).toBe(
      'MEAN_SEA_LEVEL_NUMERICALLY_APPROXIMATED_AS_ELLIPSOID_HEIGHT_TIER_1',
    );
  });
});
