import { describe, expect, it, vi } from 'vitest';
import {
  APPLICATION_NORTH,
  bearingDegreesToDirection,
  calculateSignedYaw,
  cardinalDirectionsForYaw,
  normalizeYaw,
  projectToHorizontal,
} from '../src/calibration/math';
import {
  NorthCalibrationController,
  type NorthCalibrationState,
} from '../src/calibration/state';
import { applyCalibrationToGeographicGroup } from '../src/scene/createGeographicReference';

const degrees = (radians: number): number => (radians * 180) / Math.PI;

describe('north-calibration horizontal projection', () => {
  it('keeps application north unchanged', () => {
    expect(projectToHorizontal({ x: 0, y: 0, z: -1 })).toMatchObject({
      valid: true,
      direction: APPLICATION_NORTH,
    });
  });

  it('keeps a normalized +X east-like direction unchanged', () => {
    expect(projectToHorizontal({ x: 1, y: 0, z: 0 })).toMatchObject({
      valid: true,
      direction: { x: 1, y: 0, z: 0 },
    });
  });

  it('removes Y and normalizes the horizontal components', () => {
    const result = projectToHorizontal({ x: 3, y: 12, z: 4 });
    expect(result).toMatchObject({ valid: true });
    if (!result.valid) throw new Error('Expected a valid projection.');
    expect(result.direction.x).toBeCloseTo(0.6);
    expect(result.direction.y).toBe(0);
    expect(result.direction.z).toBeCloseTo(0.8);
  });

  it.each([
    { name: 'zero', vector: { x: 0, y: 0, z: 0 } },
    { name: 'vertical', vector: { x: 0, y: 1, z: 0 } },
    { name: 'near-vertical', vector: { x: 0.1, y: 0.99, z: 0.1 } },
  ])('rejects a $name direction', ({ vector }) => {
    expect(projectToHorizontal(vector)).toMatchObject({
      valid: false,
      reason: 'horizontal-magnitude-too-small',
    });
  });

  it('rejects non-finite values', () => {
    expect(projectToHorizontal({ x: Number.NaN, y: 0, z: -1 })).toEqual({
      valid: false,
      reason: 'non-finite',
    });
  });

  it('does not mutate the caller-owned vector', () => {
    const input = { x: 3, y: 7, z: 4 };
    projectToHorizontal(input);
    expect(input).toEqual({ x: 3, y: 7, z: 4 });
  });
});

describe('north-calibration signed yaw convention', () => {
  it.each([
    ['application north (-Z) is 0 degrees', { x: 0, y: 0 as const, z: -1 }, 0],
    ['captured east (+X) is -90 degrees', { x: 1, y: 0 as const, z: 0 }, -90],
    ['captured south (+Z) normalizes to -180 degrees', { x: 0, y: 0 as const, z: 1 }, -180],
    ['captured west (-X) is +90 degrees', { x: -1, y: 0 as const, z: 0 }, 90],
    [
      'captured northeast (+X,-Z) is -45 degrees',
      { x: Math.SQRT1_2, y: 0 as const, z: -Math.SQRT1_2 },
      -45,
    ],
  ])('%s', (_name, direction, expectedDegrees) => {
    expect(degrees(calculateSignedYaw(direction))).toBeCloseTo(expectedDegrees);
  });

  it('normalizes angles to [-pi, pi)', () => {
    expect(normalizeYaw(Math.PI)).toBeCloseTo(-Math.PI);
    expect(normalizeYaw(Math.PI * 3)).toBeCloseTo(-Math.PI);
    expect(normalizeYaw(-Math.PI - 0.01)).toBeCloseTo(Math.PI - 0.01);
  });

  it('uses clockwise bearing presets while retaining the same signed-yaw rule', () => {
    expect(bearingDegreesToDirection(90)).toMatchObject({ x: 1, y: 0 });
    expect(degrees(calculateSignedYaw(bearingDegreesToDirection(270)))).toBeCloseTo(90);
  });
});

describe('north-calibration cardinal directions', () => {
  it('maps north to the captured direction with opposite south and perpendicular east/west', () => {
    const yaw = calculateSignedYaw({ x: 1, y: 0, z: 0 });
    const directions = cardinalDirectionsForYaw(yaw);
    expect(directions.north.x).toBeCloseTo(1);
    expect(directions.north.z).toBeCloseTo(0);
    expect(directions.south.x).toBeCloseTo(-1);
    expect(directions.south.z).toBeCloseTo(0);
    expect(directions.east.x * directions.north.x + directions.east.z * directions.north.z).toBeCloseTo(0);
    expect(directions.west.x).toBeCloseTo(-directions.east.x);
    expect(directions.west.z).toBeCloseTo(-directions.east.z);
  });

  it('applies yaw and visibility only to the supplied geographic-group target', () => {
    const group = { rotation: { y: 0 }, visible: false };
    const unrelated = { rotation: { y: 0.42 }, visible: true };
    const state: NorthCalibrationState = {
      kind: 'calibrated',
      calibration: {
        yawRadians: -Math.PI / 2,
        capturedDirection: { x: 1, y: 0, z: 0 },
        timestamp: 1,
        simulated: true,
      },
    };

    applyCalibrationToGeographicGroup(group, state);

    expect(group).toEqual({ rotation: { y: -Math.PI / 2 }, visible: true });
    expect(unrelated).toEqual({ rotation: { y: 0.42 }, visible: true });
  });
});

describe('NorthCalibrationController', () => {
  it('moves from uncalibrated to calibrating to physical calibrated', () => {
    const controller = new NorthCalibrationController();
    controller.begin(true);
    expect(controller.current.kind).toBe('calibrating');

    expect(
      controller.capture(
        { x: 1, y: 0, z: 0 },
        {
          simulated: false,
          timestamp: 10,
          controllerHandedness: 'right',
          sourceIdentifier: 'right-controller-0',
        },
      ),
    ).toBe(true);
    expect(controller.current).toMatchObject({
      kind: 'calibrated',
      calibration: {
        simulated: false,
        controllerHandedness: 'right',
        sourceIdentifier: 'right-controller-0',
      },
    });
  });

  it('keeps invalid capture recoverable and retains no partial result', () => {
    const controller = new NorthCalibrationController();
    controller.begin(true);
    expect(controller.capture({ x: 0, y: 1, z: 0 }, { simulated: false })).toBe(false);
    expect(controller.current).toMatchObject({ kind: 'invalid-direction' });

    expect(controller.capture({ x: 0, y: 0, z: -1 }, { simulated: false })).toBe(true);
    expect(controller.current.kind).toBe('calibrated');
  });

  it('reports controller unavailability and resumes when one connects', () => {
    const controller = new NorthCalibrationController();
    controller.begin(false);
    expect(controller.current.kind).toBe('controller-unavailable');
    controller.noteControllerAvailable();
    expect(controller.current.kind).toBe('calibrating');
  });

  it('recalibration replaces the prior result and cancel restores it', () => {
    const controller = new NorthCalibrationController();
    controller.simulateBearing(90, 1);
    const first = controller.current;
    expect(first.kind).toBe('calibrated');

    controller.begin(true);
    controller.cancel();
    expect(controller.current).toEqual(first);

    controller.begin(true);
    controller.capture({ x: -1, y: 0, z: 0 }, { simulated: false, timestamp: 2 });
    expect(controller.current).toMatchObject({
      kind: 'calibrated',
      calibration: { yawRadians: Math.PI / 2, simulated: false, timestamp: 2 },
    });
  });

  it('reset returns to uncalibrated and capture outside calibration is ignored', () => {
    const listener = vi.fn();
    const controller = new NorthCalibrationController();
    controller.subscribe(listener);
    expect(controller.capture({ x: 1, y: 0, z: 0 }, { simulated: false })).toBe(false);
    controller.simulateBearing(180, 1);
    controller.reset();
    expect(controller.current).toEqual({ kind: 'uncalibrated' });
    expect(listener).toHaveBeenCalled();
  });

  it('marks desktop simulation as simulated', () => {
    const controller = new NorthCalibrationController();
    expect(controller.simulateBearing(45, 123)).toBe(true);
    expect(controller.current).toMatchObject({
      kind: 'calibrated',
      calibration: { simulated: true, timestamp: 123 },
    });
  });
});
