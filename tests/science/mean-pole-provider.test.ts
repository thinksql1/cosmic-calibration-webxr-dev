import { describe, expect, it } from 'vitest';
import { angularSeparationDeg } from '../../src/science/astronomy/frameTransforms';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
  P03MeanPoleProvider,
  computeP03BiasPrecessionMatrix,
} from '../../src/science/astronomy/meanPoleProvider';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import { createScientificProviderRegistry } from '../../src/science/providers/scientificProviderRegistry';
import type {
  MeanPoleRequest,
  SimulationInstant,
  TerrestrialTime,
  TerrestrialTimeProvider,
} from '../../src/science/astronomy/types';
import { P03_POLE_FIXTURES } from './fixtures';

function meanPoleRequest(instantUtc: string): MeanPoleRequest {
  return Object.freeze({
    instant: createSimulationInstant(instantUtc, 'frozen-test'),
    sourceFrame: 'GCRS',
    modelReferenceEpoch: 'J2000.0',
    outputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
  });
}

function fixedTime(julianDateTt: number): TerrestrialTime {
  return Object.freeze({
    inputScale: 'UTC',
    outputScale: 'TT',
    julianDateTt,
    julianCenturiesSinceJ2000: (julianDateTt - 2_451_545) / 36_525,
    deltaTSeconds: 0,
    ut1Policy: 'UTC_APPROXIMATES_UT1',
    deltaTModel: 'ASTRONOMY_ENGINE_ESPENAK_MEEUS',
    providerVersion: 'fixture',
  });
}

function providerFor(julianDateTt: number): P03MeanPoleProvider {
  const timeProvider: TerrestrialTimeProvider = {
    toTerrestrialTime: () => fixedTime(julianDateTt),
  };
  return new P03MeanPoleProvider(timeProvider);
}

const OFFICIAL_SOFA_MATRIX = [
  [
    0.9999995505176007047,
    0.0008695404617348208,
    0.0003779735201865589,
  ],
  [
    -0.0008695404723772031,
    0.9999996219496027161,
    -0.000000136175249708027,
  ],
  [
    -0.00037797349570340895,
    -0.0000001924880847894457,
    0.9999999285679971958,
  ],
] as const;

describe('P03 bias-precession matrix', () => {
  it('reproduces the official IAU SOFA pmat06 published fixture and order', () => {
    const result = computeP03BiasPrecessionMatrix(2_450_124.4999);

    expect(result.transform).toBe('GCRS_TO_P03_MEAN_EQUATOR_OF_DATE');
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        expect(result.rows[row]![column]).toBeCloseTo(
          OFFICIAL_SOFA_MATRIX[row]![column]!,
          12,
        );
      }
    }
  });

  it('keeps the mean-equator axes perpendicular to the shared pole axis', () => {
    const matrix = computeP03BiasPrecessionMatrix(2_460_848.167531584).rows;
    const dot = (left: readonly number[], right: readonly number[]) =>
      left[0]! * right[0]! + left[1]! * right[1]! + left[2]! * right[2]!;
    const determinant =
      matrix[0][0] *
        (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
      matrix[0][1] *
        (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
      matrix[0][2] *
        (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    expect(dot(matrix[0], matrix[2])).toBeCloseTo(0, 14);
    expect(dot(matrix[1], matrix[2])).toBeCloseTo(0, 14);
    expect(dot(matrix[0], matrix[1])).toBeCloseTo(0, 14);
    for (const row of matrix) {
      expect(Math.hypot(...row)).toBeCloseTo(1, 14);
    }
    expect(determinant).toBeCloseTo(1, 14);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a non-finite TT Julian date %s',
    (julianDateTt) => {
      expect(() => computeP03BiasPrecessionMatrix(julianDateTt)).toThrowError(
        expect.objectContaining({ code: 'INVALID_INSTANT' }),
      );
    },
  );
});

describe('P03 precession-only mean-pole provider', () => {
  it.each(P03_POLE_FIXTURES)(
    '$id matches the independently frozen GCRS pole vector',
    (fixture) => {
      const result = providerFor(fixture.julianDateTt).getMeanPole(
        meanPoleRequest(fixture.instantUtc),
      );

      expect(Math.abs(result.north.x - fixture.northGcrs[0])).toBeLessThanOrEqual(
        fixture.componentTolerance,
      );
      expect(Math.abs(result.north.y - fixture.northGcrs[1])).toBeLessThanOrEqual(
        fixture.componentTolerance,
      );
      expect(Math.abs(result.north.z - fixture.northGcrs[2])).toBeLessThanOrEqual(
        fixture.componentTolerance,
      );
    },
  );

  it('returns normalized, finite, exactly antipodal north and south', () => {
    const result = providerFor(2_460_848.167531584).getMeanPole(
      meanPoleRequest('2025-06-21T16:00:00Z'),
    );

    expect([result.north.x, result.north.y, result.north.z].every(Number.isFinite)).toBe(true);
    expect(Math.hypot(result.north.x, result.north.y, result.north.z)).toBeCloseTo(1, 15);
    expect(result.south.x).toBe(-result.north.x);
    expect(result.south.y).toBe(-result.north.y);
    expect(result.south.z).toBe(-result.north.z);
    expect(Math.hypot(result.south.x, result.south.y, result.south.z)).toBeCloseTo(1, 15);
    expect(
      angularSeparationDeg(
        [result.north.x, result.north.y, result.north.z],
        [result.south.x, result.south.y, result.south.z],
      ),
    ).toBeCloseTo(180, 12);
  });

  it('uses the same authoritative provider identity in the registry and result provenance', () => {
    const result = providerFor(2_460_848.167531584).getMeanPole(
      meanPoleRequest('2025-06-21T16:00:00Z'),
    );
    const registry = createScientificProviderRegistry();
    expect(registry.meanPole).toMatchObject({
      provider: P03_MEAN_POLE_PROVIDER,
      version: P03_MEAN_POLE_PROVIDER_VERSION,
    });
    expect(result.provenance).toMatchObject({
      provider: registry.meanPole.provider,
      providerVersion: registry.meanPole.version,
    });
  });

  it('cannot be confused with a true pole or nutation-inclusive result', () => {
    const result = providerFor(2_460_848.167531584).getMeanPole(
      meanPoleRequest('2025-06-21T16:00:00Z'),
    );

    expect(result.poleKind).toBe('MEAN');
    expect(result.model).toBe('IAU_P03_PRECESSION_ONLY');
    expect(result.vectorFrame).toBe('GCRS');
    expect(result.meanEquatorFrame).toBe('P03_MEAN_EQUATOR_OF_DATE');
    expect(result.provenance).toMatchObject({
      matrixSourceFrame: 'GCRS',
      matrixOutputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
      poleVectorFrame: 'GCRS',
    });
    expect(result.correctionProfile).toMatchObject({
      precession: 'IAU_P03',
      nutation: 'excluded',
      polarMotion: 'excluded',
    });
  });

  it('is deterministic and continuous for nearby TT instants', () => {
    const request = meanPoleRequest('2025-06-21T16:00:00Z');
    const start = providerFor(2_460_848.167531584).getMeanPole(request);
    const repeat = providerFor(2_460_848.167531584).getMeanPole(request);
    const nextDay = providerFor(2_460_849.167531584).getMeanPole(
      meanPoleRequest('2025-06-22T16:00:00Z'),
    );
    const separation = angularSeparationDeg(
      [start.north.x, start.north.y, start.north.z],
      [nextDay.north.x, nextDay.north.y, nextDay.north.z],
    );

    expect(start).toEqual(repeat);
    expect(separation).toBeGreaterThan(0);
    expect(separation).toBeLessThan(0.001);
  });

  it.each([2_451_545 - 36_525.0001, 2_451_545 + 36_525.0001])(
    'rejects TT JD %s outside the bounded validated domain',
    (julianDateTt) => {
      expect(() =>
        providerFor(julianDateTt).getMeanPole(
          meanPoleRequest('2000-01-01T12:00:00Z'),
        ),
      ).toThrowError(
        expect.objectContaining({
          code: 'MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN',
        }),
      );
    },
  );

  it('uses the injected time-scale result rather than reading a system clock', () => {
    let captured: SimulationInstant | undefined;
    const timeProvider: TerrestrialTimeProvider = {
      toTerrestrialTime(instant) {
        captured = instant;
        return fixedTime(2_451_545);
      },
    };
    const instant = createSimulationInstant(
      '2000-01-01T11:58:56.152Z',
      'frozen-test',
    );

    new P03MeanPoleProvider(timeProvider).getMeanPole({
      instant,
      sourceFrame: 'GCRS',
      modelReferenceEpoch: 'J2000.0',
      outputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
    });

    expect(captured).toBe(instant);
  });

  it('rejects a non-finite injected TT value', () => {
    const timeProvider: TerrestrialTimeProvider = {
      toTerrestrialTime: () => ({
        ...fixedTime(2_451_545),
        julianDateTt: Number.NaN,
      }),
    };

    expect(() =>
      new P03MeanPoleProvider(timeProvider).getMeanPole(
        meanPoleRequest('2000-01-01T12:00:00Z'),
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INSTANT' }));
  });

  it('rejects inconsistent injected TT Julian-date and century fields', () => {
    const timeProvider: TerrestrialTimeProvider = {
      toTerrestrialTime: () => ({
        ...fixedTime(2_451_545),
        julianCenturiesSinceJ2000: 0.5,
      }),
    };

    expect(() =>
      new P03MeanPoleProvider(timeProvider).getMeanPole(
        meanPoleRequest('2000-01-01T12:00:00Z'),
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INSTANT' }));
  });

  it('rejects runtime requests that misdeclare any frame or epoch field', () => {
    const base = meanPoleRequest('2000-01-01T12:00:00Z');
    const invalidRequests = [
      { ...base, sourceFrame: 'EQD_TRUE' },
      { ...base, modelReferenceEpoch: 'B1950.0' },
      { ...base, outputFrame: 'EQD_TRUE' },
    ] as unknown as MeanPoleRequest[];

    for (const request of invalidRequests) {
      expect(() => providerFor(2_451_545).getMeanPole(request)).toThrowError(
        expect.objectContaining({ code: 'UNSUPPORTED_FRAME_CONTRACT' }),
      );
    }
  });
});
