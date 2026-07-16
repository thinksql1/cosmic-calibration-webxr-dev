import { describe, expect, it } from 'vitest';
import { createObserver } from '../../../src/science/astronomy/observer';
import { createSimulationInstant } from '../../../src/science/astronomy/time';
import type { MeanPoleResult } from '../../../src/science/astronomy/types';
import { createObserverHorizontalEarthAxis } from '../../../src/science/frames/observerHorizontalEarthAxis';
import { createScientificProviderRegistry } from '../../../src/science/providers/scientificProviderRegistry';

function meanPole(utcIso = '2025-06-21T16:00:00Z'): MeanPoleResult {
  return createScientificProviderRegistry().meanPole.getMeanPole({
    instant: createSimulationInstant(utcIso, 'frozen-test'),
    sourceFrame: 'GCRS',
    modelReferenceEpoch: 'J2000.0',
    outputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
  });
}

function axis(latitudeDeg: number, longitudeDegEast = 0, utcIso?: string) {
  return createObserverHorizontalEarthAxis(
    meanPole(utcIso),
    createObserver({ latitudeDeg, longitudeDegEast, elevationMeters: 0 }),
  );
}

describe('validated P03 mean axis to observer-horizontal ENU', () => {
  it.each([
    ['equator', 0, [0, 1, 0]],
    ['mid northern latitude', 45, [0, Math.SQRT1_2, Math.SQRT1_2]],
    ['mid southern latitude', -34, [0, 0.8290375725550417, -0.5591929034707469]],
    ['high northern latitude', 70, [0, 0.3420201433256688, 0.9396926207859083]],
    ['high southern latitude', -70, [0, 0.3420201433256688, -0.9396926207859083]],
  ] as const)('matches the independent geodetic-axis case at the %s', (_name, latitude, expected) => {
    const result = axis(latitude, 123.4);
    expect(result.north.direction.east).toBeCloseTo(expected[0], 14);
    expect(result.north.direction.north).toBeCloseTo(expected[1], 14);
    expect(result.north.direction.up).toBeCloseTo(expected[2], 14);
    expect(result.north.altitudeDeg).toBeCloseTo(latitude, 12);
    expect(Math.hypot(
      result.north.direction.east,
      result.north.direction.north,
      result.north.direction.up,
    )).toBeCloseTo(1, 14);
  });

  it('keeps NCP and SCP exact antipodes from one axis', () => {
    const result = axis(42);
    expect(result.south.direction.east).toBe(-result.north.direction.east);
    expect(result.south.direction.north).toBe(-result.north.direction.north);
    expect(result.south.direction.up).toBe(-result.north.direction.up);
    expect(result.north).toMatchObject({ azimuthDeg: 0, horizonRelation: 'above' });
    expect(result.south).toMatchObject({ azimuthDeg: 180, horizonRelation: 'below' });
  });

  it('swaps the above-horizon pole across hemispheres', () => {
    const north = axis(42);
    const south = axis(-42);
    expect(north.north.horizonRelation).toBe('above');
    expect(north.south.horizonRelation).toBe('below');
    expect(south.north.horizonRelation).toBe('below');
    expect(south.south.horizonRelation).toBe('above');
  });

  it('places both poles on opposite horizons at the equator', () => {
    const result = axis(0);
    expect(result.north).toMatchObject({ altitudeDeg: 0, azimuthDeg: 0, horizonRelation: 'on' });
    expect(result.south).toMatchObject({ altitudeDeg: -0, azimuthDeg: 180, horizonRelation: 'on' });
  });

  it('reports undefined azimuth when a pole is at zenith or nadir', () => {
    const result = axis(90);
    expect(result.north.azimuthDeg).toBeNull();
    expect(result.south.azimuthDeg).toBeNull();
    expect(result.north.altitudeDeg).toBeCloseTo(90, 12);
    expect(result.south.altitudeDeg).toBeCloseTo(-90, 12);
  });

  it('uses the full WGS84 rotation while proving longitude cancels for Earth-fixed +Z', () => {
    const west = axis(38.5, -170);
    const east = axis(38.5, 170);
    expect(west.north.direction).toEqual(east.north.direction);
    expect(west.observer.longitudeDegEast).toBe(-170);
    expect(east.observer.longitudeDegEast).toBe(170);
  });

  it('preserves time-dependent P03 provenance without inventing local axis motion', () => {
    const j2000Pole = meanPole('2000-01-01T11:58:56.152Z');
    const presentPole = meanPole('2025-06-21T16:00:00Z');
    const j2000 = createObserverHorizontalEarthAxis(
      j2000Pole,
      createObserver({ latitudeDeg: 42, longitudeDegEast: 0, elevationMeters: 0 }),
    );
    const present = axis(42, 0, '2025-06-21T16:00:00Z');
    const future = axis(42, 0, '2050-01-01T00:00:00Z');
    expect(j2000.north.direction).toEqual(present.north.direction);
    expect(present.north.direction).toEqual(future.north.direction);
    expect(j2000.provenance.simulationInstant.utcIso).not.toBe(present.provenance.simulationInstant.utcIso);
    expect(j2000Pole.north).not.toEqual(presentPole.north);
    expect(j2000.meanDateAlignmentResidual).toBeLessThanOrEqual(1e-12);
    expect(present.meanDateAlignmentResidual).toBeLessThanOrEqual(1e-12);
    expect(future.meanDateAlignmentResidual).toBeLessThanOrEqual(1e-12);
  });

  it('rejects a matrix/vector pair that does not prove the mean-date +Z axis', () => {
    const source = meanPole();
    const corrupted = {
      ...source,
      biasPrecessionMatrix: {
        transform: 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE' as const,
        rows: Object.freeze([
          Object.freeze([1, 0, 0]),
          Object.freeze([0, 1, 0]),
          Object.freeze([0, 0, 1]),
        ]) as MeanPoleResult['biasPrecessionMatrix']['rows'],
      },
    } as MeanPoleResult;
    expect(() => createObserverHorizontalEarthAxis(
      corrupted,
      createObserver({ latitudeDeg: 42, longitudeDegEast: 0, elevationMeters: 0 }),
    )).toThrow('coherent mean-date +Z axis');
  });

  it('returns explicit frame, horizon, and rotation-invariance contracts', () => {
    expect(axis(42)).toMatchObject({
      kind: 'OBSERVER_HORIZONTAL_EARTH_AXIS',
      model: 'IAU_P03_PRECESSION_ONLY',
      poleKind: 'MEAN',
      sourceFrame: 'GCRS',
      meanDateFrame: 'P03_MEAN_EQUATOR_OF_DATE',
      earthFixedFrame: 'WGS84_EARTH_FIXED_MEAN_AXIS',
      outputFrame: 'HORIZONTAL_ENU',
      horizontalModel: 'WGS84_GEODETIC_GEOMETRIC_AIRLESS',
      earthRotationTreatment: 'MEAN_AXIS_INVARIANT_UNDER_EARTH_ROTATION',
      provenance: {
        calibratedYawApplication: 'presentation-parent-only',
      },
    });
  });
});
