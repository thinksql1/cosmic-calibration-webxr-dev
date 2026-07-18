import { describe, expect, it } from 'vitest';
import type { NorthCalibrationState } from '../../src/calibration/state';
import {
  createLocalHorizonPresentationModel,
  LOCAL_HORIZON_PRESENTATION_RADIUS_METERS,
  LOCAL_HORIZON_SAMPLE_COUNT,
} from '../../src/presentation/localHorizonPresentationModel';

function calibrated(
  acceptedRevision = 1,
  yawRadians = 0,
): NorthCalibrationState {
  return {
    kind: 'calibrated',
    calibration: {
      acceptedRevision,
      yawRadians,
      capturedDirection: { x: 0, y: 0, z: -1 },
      timestamp: acceptedRevision,
      simulated: true,
    },
  };
}

describe('local astronomical-horizon presentation model', () => {
  it('requires geographic calibration but no P03 or Earth-core state', () => {
    expect(createLocalHorizonPresentationModel({ kind: 'uncalibrated' })).toEqual({
      kind: 'not-ready',
      reason: 'CALIBRATION_REQUIRED',
    });
    const ready = createLocalHorizonPresentationModel(calibrated());
    expect(ready.kind).toBe('ready');
    if (ready.kind !== 'ready') return;
    expect(ready).not.toHaveProperty('earthCore');
    expect(ready).not.toHaveProperty('pole');
    expect(ready.frame).toBe('HORIZONTAL_ENU');
  });

  it('creates 96 deterministic finite samples in the local horizontal plane', () => {
    const first = createLocalHorizonPresentationModel(calibrated());
    const second = createLocalHorizonPresentationModel(calibrated());
    expect(first).toEqual(second);
    if (first.kind !== 'ready') return;
    expect(first.sampleCount).toBe(LOCAL_HORIZON_SAMPLE_COUNT);
    expect(first.samples).toHaveLength(LOCAL_HORIZON_SAMPLE_COUNT);
    first.samples.forEach((sample) => {
      expect(sample.directionEnu.up).toBe(0);
      expect(sample.positionApplicationMeters.y).toBe(0);
      expect(Math.hypot(
        sample.positionApplicationMeters.x,
        sample.positionApplicationMeters.z,
      )).toBeCloseTo(LOCAL_HORIZON_PRESENTATION_RADIUS_METERS, 10);
      expect(Object.values(sample.positionApplicationMeters).every(Number.isFinite)).toBe(true);
    });
  });

  it('places east, north, west, and south at exact quarter-circle samples', () => {
    const model = createLocalHorizonPresentationModel(calibrated());
    if (model.kind !== 'ready') return;
    const [east, north, west, south] = [0, 24, 48, 72].map((index) => model.samples[index]);
    expect(east.directionEnu).toMatchObject({ east: 1, north: 0, up: 0 });
    expect(north.directionEnu).toMatchObject({ east: 0, north: 1, up: 0 });
    expect(west.directionEnu).toMatchObject({ east: -1, north: 0, up: 0 });
    expect(south.directionEnu).toMatchObject({ east: 0, north: -1, up: 0 });
    expect(east.directionApplication).toMatchObject({ x: 1, y: 0, z: 0 });
    expect(north.directionApplication).toMatchObject({ x: 0, y: 0, z: -1 });
  });

  it('keeps opposite cardinals antipodal and adjacent cardinals perpendicular', () => {
    const model = createLocalHorizonPresentationModel(calibrated());
    if (model.kind !== 'ready') return;
    const position = (index: number) => model.samples[index].positionApplicationMeters;
    const dot = (a: ReturnType<typeof position>, b: ReturnType<typeof position>) =>
      a.x * b.x + a.y * b.y + a.z * b.z;
    for (const component of ['x', 'y', 'z'] as const) {
      expect(position(48)[component]).toBeCloseTo(-position(0)[component], 12);
      expect(position(72)[component]).toBeCloseTo(-position(24)[component], 12);
    }
    expect(dot(position(0), position(24))).toBe(0);
  });

  it('closes by LineLoop policy without duplicating its first sample', () => {
    const model = createLocalHorizonPresentationModel(calibrated());
    if (model.kind !== 'ready') return;
    expect(model.samples[0].directionEnu).not.toEqual(model.samples.at(-1)?.directionEnu);
    const angularStep = (Math.PI * 2) / model.sampleCount;
    const last = model.samples.at(-1)!;
    const dotWithFirst =
      last.directionEnu.east * model.samples[0].directionEnu.east +
      last.directionEnu.north * model.samples[0].directionEnu.north;
    expect(Math.acos(dotWithFirst)).toBeCloseTo(angularStep, 12);
  });

  it('retains new accepted-event identity for same-yaw recalibration', () => {
    const first = createLocalHorizonPresentationModel(calibrated(1, Math.PI / 3));
    const second = createLocalHorizonPresentationModel(calibrated(2, Math.PI / 3));
    if (first.kind !== 'ready' || second.kind !== 'ready') return;
    expect(first.samples).toEqual(second.samples);
    expect(first.acceptedCalibrationRevision).toBe(1);
    expect(second.acceptedCalibrationRevision).toBe(2);
  });

  it('declares the observer-origin WGS84-up Tier 1 approximation and symbolic radius', () => {
    const model = createLocalHorizonPresentationModel(calibrated());
    if (model.kind !== 'ready') return;
    expect(model.center).toBe('OBSERVER_LOCAL_TANGENT_ORIGIN');
    expect(model.verticalModel).toBe('WGS84_GEODETIC_UP_TIER_1_APPROXIMATION');
    expect(model.presentationRadiusMeters).toBe(24);
    expect(model.visible).toBe(false);
  });

  it.each([0, 9.99, 100.01, Infinity, Number.NaN])('rejects unsafe radius %s', (radius) => {
    expect(() => createLocalHorizonPresentationModel(calibrated(), {
      showHorizon: true,
      presentationRadiusMeters: radius,
    })).toThrow('10–100 meter');
  });
});
