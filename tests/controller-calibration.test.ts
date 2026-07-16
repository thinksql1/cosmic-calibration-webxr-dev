import * as THREE from 'three';
import type { XRTargetRaySpace } from 'three/src/renderers/webxr/WebXRController.js';
import { describe, expect, it } from 'vitest';
import { NorthCalibrationController } from '../src/calibration/state';
import { NorthCalibrationControllerManager } from '../src/xr/controllerCalibration';

function fakeInputSource(handedness: XRHandedness): XRInputSource {
  return {
    handedness,
    targetRayMode: 'tracked-pointer',
    targetRaySpace: {} as XRSpace,
    profiles: [],
    gamepad: undefined,
    gripSpace: undefined,
    hand: undefined,
  } as XRInputSource;
}

function createHarness() {
  const scene = new THREE.Scene();
  const controllers = [0, 1].map(
    () => new THREE.Group() as unknown as XRTargetRaySpace,
  );
  const calibration = new NorthCalibrationController();
  let now = 1_000;
  const manager = new NorthCalibrationControllerManager(
    scene,
    (index) => controllers[index]!,
    calibration,
    () => now,
  );

  return {
    scene,
    controllers,
    calibration,
    manager,
    setNow(value: number) {
      now = value;
    },
  };
}

describe('NorthCalibrationControllerManager', () => {
  it('supports either controller, shows rays only while calibrating, and captures target-ray -Z', () => {
    const harness = createHarness();
    harness.manager.activate();
    const right = fakeInputSource('right');
    harness.controllers[1]!.dispatchEvent({ type: 'connected', data: right });

    const ray = harness.controllers[1]!.getObjectByName('north-calibration-target-ray');
    expect(ray?.visible).toBe(false);

    harness.manager.beginCalibration();
    expect(ray?.visible).toBe(true);

    harness.controllers[1]!.rotation.y = -Math.PI / 2;
    harness.controllers[1]!.updateMatrixWorld(true);
    harness.setNow(1_400);
    harness.controllers[1]!.dispatchEvent({ type: 'select', data: right });

    expect(harness.calibration.current).toMatchObject({
      kind: 'calibrated',
      calibration: {
        yawRadians: -Math.PI / 2,
        controllerHandedness: 'right',
        simulated: false,
      },
    });
    expect(ray?.visible).toBe(false);
  });

  it('ignores the select that initiated calibration and ignores duplicate capture after success', () => {
    const harness = createHarness();
    harness.manager.activate();
    const left = fakeInputSource('left');
    harness.controllers[0]!.dispatchEvent({ type: 'connected', data: left });
    harness.manager.beginCalibration();

    harness.controllers[0]!.dispatchEvent({ type: 'select', data: left });
    expect(harness.calibration.current.kind).toBe('calibrating');

    harness.setNow(1_400);
    harness.controllers[0]!.dispatchEvent({ type: 'select', data: left });
    const captured = harness.calibration.current;
    harness.setNow(2_000);
    harness.controllers[0]!.rotation.y = Math.PI / 2;
    harness.controllers[0]!.dispatchEvent({ type: 'select', data: left });
    expect(harness.calibration.current).toEqual(captured);
  });

  it('surfaces controller disconnect during calibration and cleans up session listeners', () => {
    const harness = createHarness();
    harness.manager.activate();
    const left = fakeInputSource('left');
    harness.controllers[0]!.dispatchEvent({ type: 'connected', data: left });
    harness.manager.beginCalibration();
    harness.controllers[0]!.dispatchEvent({ type: 'disconnected', data: left });
    expect(harness.calibration.current.kind).toBe('controller-unavailable');

    harness.manager.deactivate();
    expect(harness.scene.children).toHaveLength(0);
    harness.controllers[0]!.dispatchEvent({ type: 'connected', data: left });
    expect(harness.manager.hasUsableController()).toBe(false);
  });

  it('rejects a nearly vertical controller ray through the shared calibration logic', () => {
    const harness = createHarness();
    harness.manager.activate();
    const source = fakeInputSource('right');
    harness.controllers[0]!.dispatchEvent({ type: 'connected', data: source });
    harness.manager.beginCalibration();
    harness.controllers[0]!.rotation.x = Math.PI / 2;
    harness.controllers[0]!.updateMatrixWorld(true);
    harness.setNow(1_400);
    harness.controllers[0]!.dispatchEvent({ type: 'select', data: source });
    expect(harness.calibration.current.kind).toBe('invalid-direction');
  });
});
