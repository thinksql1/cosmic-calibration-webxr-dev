import * as THREE from 'three';
import type { XRTargetRaySpace } from 'three/src/renderers/webxr/WebXRController.js';
import { describe, expect, it, vi } from 'vitest';
import { NorthCalibrationController } from '../src/calibration/state';
import {
  DomOverlaySelectGuard,
  NorthCalibrationControllerManager,
} from '../src/xr/controllerCalibration';

type InputEventType =
  | 'selectstart'
  | 'select'
  | 'selectend'
  | 'squeezestart'
  | 'squeeze'
  | 'squeezeend';

type InputListener = (event: XRInputSourceEvent) => void;

class FakeSession {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: InputEventType, inputSource: XRInputSource, frame: XRFrame): void {
    const event = { type, inputSource, frame } as XRInputSourceEvent;
    this.listeners.get(type)?.forEach((listener) => {
      if (typeof listener === 'function') (listener as InputListener)(event);
      else listener.handleEvent(event as unknown as Event);
    });
  }

  emitEnd(): void {
    const event = { type: 'end' } as Event;
    this.listeners.get('end')?.forEach((listener) => {
      if (typeof listener === 'function') (listener as EventListener)(event);
      else listener.handleEvent(event);
    });
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0);
  }
}

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

function poseFromQuaternion(quaternion: THREE.Quaternion): XRPose {
  return {
    transform: {
      orientation: {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w,
      },
      position: { x: 0, y: 1.2, z: 0, w: 1 },
      matrix: new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 1.2, 0, 1,
      ]),
    },
  } as unknown as XRPose;
}

function validFrame(yaw = 0): XRFrame {
  const quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    yaw,
  );
  return {
    getPose: vi.fn().mockReturnValue(poseFromQuaternion(quaternion)),
  } as unknown as XRFrame;
}

function missingPoseFrame(): XRFrame {
  return { getPose: vi.fn().mockReturnValue(null) } as unknown as XRFrame;
}

function nonFinitePoseFrame(): XRFrame {
  const pose = poseFromQuaternion(new THREE.Quaternion());
  (pose.transform.orientation as { x: number }).x = Number.NaN;
  return { getPose: vi.fn().mockReturnValue(pose) } as unknown as XRFrame;
}

function createHarness() {
  const scene = new THREE.Scene();
  const controllers = [0, 1].map(
    () => new THREE.Group() as unknown as XRTargetRaySpace,
  );
  controllers.forEach((controller) => {
    controller.visible = true;
  });
  const sources = [fakeInputSource('left'), fakeInputSource('right')];
  const calibration = new NorthCalibrationController();
  const session = new FakeSession();
  const referenceSpace = {} as XRReferenceSpace;
  let now = 1_000;
  const manager = new NorthCalibrationControllerManager(
    scene,
    (index) => controllers[index]!,
    () => referenceSpace,
    calibration,
    () => now,
  );
  manager.activate();
  manager.bindSession(session as unknown as XRSession);

  function connect(index: number): void {
    controllers[index]!.dispatchEvent({ type: 'connected', data: sources[index]! });
  }

  function disconnect(index: number): void {
    controllers[index]!.dispatchEvent({ type: 'disconnected', data: sources[index]! });
  }

  function primary(
    index: number,
    frame: XRFrame = validFrame(),
    duration = 80,
  ): void {
    session.emit('selectstart', sources[index]!, frame);
    now += duration;
    session.emit('select', sources[index]!, frame);
    session.emit('selectend', sources[index]!, frame);
    now += 20;
  }

  function squeeze(index: number, duration = 80): void {
    const frame = validFrame();
    session.emit('squeezestart', sources[index]!, frame);
    now += duration;
    session.emit('squeeze', sources[index]!, frame);
    session.emit('squeezeend', sources[index]!, frame);
    now += 20;
  }

  return {
    scene,
    controllers,
    sources,
    calibration,
    session,
    referenceSpace,
    manager,
    connect,
    disconnect,
    primary,
    squeeze,
    setNow(value: number) {
      now = value;
    },
  };
}

describe('controller-only north calibration', () => {
  it('uses the first completed primary action only to enter and arm calibration', () => {
    const harness = createHarness();
    harness.connect(0);
    const feedback = harness.controllers[0]!.getObjectByName(
      'north-calibration-controller-feedback',
    );

    harness.session.emit('selectstart', harness.sources[0]!, validFrame());
    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('awaiting-release');
    expect(feedback?.userData.message).toContain('Release trigger');

    harness.session.emit('select', harness.sources[0]!, validFrame());
    expect(harness.calibration.current.kind).toBe('calibrating');
    harness.session.emit('selectend', harness.sources[0]!, validFrame());

    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('ready');
    expect(feedback?.visible).toBe(true);
    expect(feedback?.userData.message).toContain('Trigger: capture');
  });

  it('captures valid current-frame north on a later press and ignores duplicate select', () => {
    const harness = createHarness();
    harness.connect(1);
    harness.primary(1);
    const interactionKinds: string[] = [];
    const unsubscribe = harness.manager.subscribeInteraction(({ kind }) => {
      interactionKinds.push(kind);
    });

    const eastFrame = validFrame(-Math.PI / 2);
    harness.session.emit('selectstart', harness.sources[1]!, eastFrame);
    harness.session.emit('select', harness.sources[1]!, eastFrame);
    const captured = harness.calibration.current;
    harness.session.emit('select', harness.sources[1]!, validFrame(Math.PI / 2));
    harness.session.emit('selectend', harness.sources[1]!, eastFrame);

    expect(captured).toMatchObject({
      kind: 'calibrated',
      calibration: {
        yawRadians: -Math.PI / 2,
        controllerHandedness: 'right',
        simulated: false,
      },
    });
    expect(harness.calibration.current).toEqual(captured);
    expect(harness.manager.currentInteraction.kind).toBe('calibrated-success');
    expect(interactionKinds).toContain('capture-processing');
    unsubscribe();
  });

  it('does not let a second controller bypass the first controller release gate', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.connect(1);
    const secondFrame = validFrame(-Math.PI / 2);

    harness.session.emit('selectstart', harness.sources[0]!, validFrame());
    harness.session.emit('selectstart', harness.sources[1]!, secondFrame);
    harness.session.emit('select', harness.sources[1]!, secondFrame);
    harness.session.emit('selectend', harness.sources[1]!, secondFrame);

    expect(harness.manager.currentInteraction.kind).toBe('awaiting-release');
    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(secondFrame.getPose).not.toHaveBeenCalled();

    harness.session.emit('select', harness.sources[0]!, validFrame());
    harness.session.emit('selectend', harness.sources[0]!, validFrame());
    expect(harness.manager.currentInteraction.kind).toBe('ready');
    harness.primary(1, secondFrame);
    expect(harness.calibration.current.kind).toBe('calibrated');
  });

  it('invalidates a cancelled controller press before another controller begins', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.connect(1);
    const firstFrame = validFrame();
    const secondFrame = validFrame();

    harness.session.emit('selectstart', harness.sources[0]!, firstFrame);
    harness.squeeze(1);
    expect(harness.calibration.current.kind).toBe('uncalibrated');

    harness.session.emit('selectstart', harness.sources[1]!, secondFrame);
    harness.session.emit('select', harness.sources[0]!, firstFrame);
    harness.session.emit('selectend', harness.sources[0]!, firstFrame);
    expect(harness.manager.currentInteraction.kind).toBe('awaiting-release');
    expect(harness.calibration.current.kind).toBe('calibrating');

    harness.session.emit('select', harness.sources[1]!, secondFrame);
    harness.session.emit('selectend', harness.sources[1]!, secondFrame);
    expect(harness.manager.currentInteraction.kind).toBe('ready');
  });

  it('prevents a stale long press from resetting a newer controller attempt', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.connect(1);
    harness.primary(0);
    harness.primary(0);
    expect(harness.calibration.current.kind).toBe('calibrated');

    harness.setNow(10_000);
    const staleFrame = validFrame();
    harness.session.emit('selectstart', harness.sources[0]!, staleFrame);
    harness.setNow(11_300);
    harness.squeeze(1);
    expect(harness.calibration.current.kind).toBe('calibrated');

    const newAttemptFrame = validFrame();
    harness.session.emit('selectstart', harness.sources[1]!, newAttemptFrame);
    harness.setNow(11_420);
    harness.session.emit('select', harness.sources[0]!, staleFrame);
    harness.session.emit('selectend', harness.sources[0]!, staleFrame);

    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('awaiting-release');
    harness.setNow(11_480);
    harness.session.emit('select', harness.sources[1]!, newAttemptFrame);
    harness.session.emit('selectend', harness.sources[1]!, newAttemptFrame);
    expect(harness.manager.currentInteraction.kind).toBe('ready');
  });

  it('invalidates a stale squeeze before a newer controller attempt', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.connect(1);
    harness.primary(0);
    expect(harness.manager.currentInteraction.kind).toBe('ready');

    const squeezeFrame = validFrame();
    harness.session.emit('squeezestart', harness.sources[0]!, squeezeFrame);
    harness.primary(1, validFrame(), 1_300);
    expect(harness.calibration.current.kind).toBe('uncalibrated');

    const newAttemptFrame = validFrame();
    harness.session.emit('selectstart', harness.sources[1]!, newAttemptFrame);
    harness.session.emit('squeeze', harness.sources[0]!, squeezeFrame);
    harness.session.emit('squeezeend', harness.sources[0]!, squeezeFrame);

    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('awaiting-release');
  });

  it('does not reinterpret a pre-capture squeeze after another controller succeeds', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.connect(1);
    harness.primary(0);

    harness.setNow(2_000);
    const squeezeFrame = validFrame();
    harness.session.emit('squeezestart', harness.sources[1]!, squeezeFrame);
    harness.primary(0, validFrame(-Math.PI / 2));
    const captured = harness.calibration.current;
    expect(captured.kind).toBe('calibrated');

    harness.setNow(3_400);
    harness.session.emit('squeeze', harness.sources[1]!, squeezeFrame);
    harness.session.emit('squeezeend', harness.sources[1]!, squeezeFrame);

    expect(harness.calibration.current).toEqual(captured);
    expect(harness.manager.currentInteraction.kind).toBe('calibrated-success');
  });

  it('does not arm or capture when the initial select action is cancelled', () => {
    const harness = createHarness();
    harness.connect(0);
    const frame = validFrame();

    harness.session.emit('selectstart', harness.sources[0]!, frame);
    harness.session.emit('selectend', harness.sources[0]!, frame);

    expect(frame.getPose).not.toHaveBeenCalled();
    expect(harness.calibration.current.kind).toBe('uncalibrated');
    expect(harness.manager.currentInteraction.kind).toBe('cancelled');
  });

  it('cancels without DOM overlay using squeeze or a deliberate trigger hold', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.squeeze(0);
    expect(harness.calibration.current.kind).toBe('uncalibrated');
    expect(harness.manager.currentInteraction.kind).toBe('cancelled');

    harness.primary(0);
    harness.primary(0, validFrame(), 1_300);
    expect(harness.calibration.current.kind).toBe('uncalibrated');
    expect(harness.manager.currentInteraction.kind).toBe('cancelled');
  });

  it('recalibrates with short squeeze and resets with a deliberate long squeeze', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.primary(0, validFrame(-Math.PI / 2));
    expect(harness.calibration.current.kind).toBe('calibrated');

    harness.squeeze(0);
    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('ready');
    harness.primary(0, validFrame(Math.PI / 2));
    expect(harness.calibration.current).toMatchObject({
      kind: 'calibrated',
      calibration: { yawRadians: Math.PI / 2 },
    });

    harness.squeeze(0, 1_300);
    expect(harness.calibration.current.kind).toBe('uncalibrated');
    expect(harness.manager.currentInteraction.kind).toBe('reset');
  });

  it('does nothing when a squeeze action is cancelled before completion', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    const frame = validFrame();

    harness.session.emit('squeezestart', harness.sources[0]!, frame);
    harness.session.emit('squeezeend', harness.sources[0]!, frame);

    expect(harness.calibration.current.kind).toBe('calibrating');
    expect(harness.manager.currentInteraction.kind).toBe('ready');
  });

  it('resets without squeeze using a deliberate long primary press', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.primary(0);
    expect(harness.calibration.current.kind).toBe('calibrated');

    harness.primary(0, validFrame(), 1_300);
    expect(harness.calibration.current.kind).toBe('uncalibrated');
    expect(harness.manager.currentInteraction.kind).toBe('reset');
  });
});

describe('current target-ray pose validity', () => {
  it('rejects a missing current pose and remains recoverable', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.primary(0, missingPoseFrame());

    expect(harness.calibration.current).toMatchObject({
      kind: 'capture-failed',
      message: expect.stringContaining('tracking is unavailable'),
    });
    expect(harness.manager.currentInteraction.kind).toBe('recoverable-error');

    harness.primary(0, validFrame());
    expect(harness.calibration.current.kind).toBe('calibrated');
  });

  it('rejects an invisible controller despite a finite event-frame pose', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.controllers[0]!.visible = false;
    harness.primary(0, validFrame());
    expect(harness.calibration.current.kind).toBe('capture-failed');
    const fallback = harness.scene.getObjectByName('north-calibration-world-feedback');
    expect(fallback?.visible).toBe(true);
    expect(fallback?.userData.message).toContain('tracking unavailable');
  });

  it('accepts a current valid identity pose and queries the exact source and reference space', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    const frame = validFrame();

    harness.primary(0, frame);

    expect(frame.getPose).toHaveBeenCalledTimes(1);
    expect(frame.getPose).toHaveBeenCalledWith(
      harness.sources[0]!.targetRaySpace,
      harness.referenceSpace,
    );
    expect(harness.calibration.current).toMatchObject({
      kind: 'calibrated',
      calibration: { yawRadians: 0 },
    });
  });

  it('rejects a disconnected controller and clears session ownership on cleanup', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.disconnect(0);
    harness.primary(0, validFrame());
    expect(harness.calibration.current.kind).toBe('controller-unavailable');

    expect(harness.session.listenerCount()).toBeGreaterThan(0);
    harness.manager.deactivate();
    expect(harness.session.listenerCount()).toBe(0);
    expect(harness.scene.children).toHaveLength(0);
  });

  it('does not reuse a stale transform or default identity without a current pose', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.controllers[0]!.rotation.y = -Math.PI / 2;
    harness.controllers[0]!.updateMatrixWorld(true);
    harness.primary(0);
    harness.primary(0, missingPoseFrame());
    expect(harness.calibration.current.kind).toBe('capture-failed');

    const second = createHarness();
    second.connect(0);
    second.primary(0);
    second.primary(0, missingPoseFrame());
    expect(second.calibration.current.kind).toBe('capture-failed');
  });

  it('rejects non-finite pose data and a nearly vertical valid pose', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.primary(0, nonFinitePoseFrame());
    expect(harness.calibration.current.kind).toBe('capture-failed');

    harness.primary(
      0,
      {
        getPose: vi.fn().mockReturnValue(
          poseFromQuaternion(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(1, 0, 0),
              Math.PI / 2,
            ),
          ),
        ),
      } as unknown as XRFrame,
    );
    expect(harness.calibration.current.kind).toBe('invalid-direction');
  });

  it('preserves a previous calibration after failed recalibration and replaces it only on success', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.primary(0, validFrame(-Math.PI / 2));
    const first = harness.calibration.current;
    expect(first.kind).toBe('calibrated');

    harness.squeeze(0);
    harness.primary(0, missingPoseFrame());
    expect(harness.calibration.current).toMatchObject({
      kind: 'capture-failed',
      previousCalibration: (first as Extract<typeof first, { kind: 'calibrated' }>).calibration,
    });
    harness.squeeze(0);
    expect(harness.calibration.current).toEqual(first);

    harness.squeeze(0);
    harness.primary(0, validFrame(Math.PI / 2));
    expect(harness.calibration.current).toMatchObject({
      kind: 'calibrated',
      calibration: { yawRadians: Math.PI / 2 },
    });
  });
});

describe('retained controller-manager regression coverage', () => {
  it('supports either controller, shows rays only while calibrating, and captures target-ray -Z', () => {
    const harness = createHarness();
    harness.connect(1);
    const ray = harness.controllers[1]!.getObjectByName('north-calibration-target-ray');
    expect(ray?.visible).toBe(false);

    const startFrame = validFrame();
    harness.session.emit('selectstart', harness.sources[1]!, startFrame);
    expect(ray?.visible).toBe(true);
    harness.session.emit('select', harness.sources[1]!, startFrame);
    harness.session.emit('selectend', harness.sources[1]!, startFrame);
    harness.primary(1, validFrame(-Math.PI / 2));

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

  it('ignores the action that initiated calibration and duplicate select after success', () => {
    const harness = createHarness();
    harness.connect(0);
    const startFrame = validFrame();

    harness.session.emit('selectstart', harness.sources[0]!, startFrame);
    harness.session.emit('select', harness.sources[0]!, startFrame);
    expect(harness.calibration.current.kind).toBe('calibrating');
    harness.session.emit('selectend', harness.sources[0]!, startFrame);

    const captureFrame = validFrame(-Math.PI / 2);
    harness.session.emit('selectstart', harness.sources[0]!, captureFrame);
    harness.session.emit('select', harness.sources[0]!, captureFrame);
    const captured = harness.calibration.current;
    harness.session.emit('select', harness.sources[0]!, validFrame(Math.PI / 2));
    harness.session.emit('selectend', harness.sources[0]!, captureFrame);
    expect(harness.calibration.current).toEqual(captured);
  });

  it('surfaces controller disconnect and removes connection and session listeners', () => {
    const harness = createHarness();
    harness.connect(0);
    harness.primary(0);
    harness.disconnect(0);
    expect(harness.calibration.current.kind).toBe('controller-unavailable');

    harness.manager.deactivate();
    expect(harness.scene.children).toHaveLength(0);
    expect(harness.session.listenerCount()).toBe(0);
    harness.controllers[0]!.dispatchEvent({
      type: 'connected',
      data: harness.sources[0]!,
    });
    expect(harness.manager.hasUsableController()).toBe(false);
  });

  it('rejects a nearly vertical current target ray through shared calibration math', () => {
    const harness = createHarness();
    harness.connect(1);
    harness.primary(1);
    const verticalFrame = {
      getPose: vi.fn().mockReturnValue(
        poseFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            Math.PI / 2,
          ),
        ),
      ),
    } as unknown as XRFrame;

    harness.primary(1, verticalFrame);
    expect(harness.calibration.current.kind).toBe('invalid-direction');
  });
});

describe('DOM-overlay XR select suppression', () => {
  it('registers beforexrselect only while enabled and removes it during cleanup', () => {
    const guard = new DomOverlaySelectGuard();
    const control = new EventTarget();
    guard.enable([control]);
    const guarded = new Event('beforexrselect', { cancelable: true });
    control.dispatchEvent(guarded);
    expect(guarded.defaultPrevented).toBe(true);

    guard.disable();
    const unguarded = new Event('beforexrselect', { cancelable: true });
    control.dispatchEvent(unguarded);
    expect(unguarded.defaultPrevented).toBe(false);
  });

  it('prevents overlay cancel, reset, and recalibrate actions from also capturing', () => {
    const harness = createHarness();
    harness.connect(0);
    const cancel = new EventTarget();
    const reset = new EventTarget();
    const recalibrate = new EventTarget();
    harness.manager.configureDomOverlay([cancel, reset, recalibrate], true);

    harness.primary(0);
    const cancelEvent = new Event('beforexrselect', { cancelable: true });
    cancel.dispatchEvent(cancelEvent);
    if (!cancelEvent.defaultPrevented) harness.primary(0, validFrame(-Math.PI / 2));
    harness.manager.cancelCalibration();
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(harness.calibration.current.kind).toBe('uncalibrated');

    harness.primary(0);
    harness.primary(0);
    const calibrated = harness.calibration.current;
    const recalibrateEvent = new Event('beforexrselect', { cancelable: true });
    recalibrate.dispatchEvent(recalibrateEvent);
    if (!recalibrateEvent.defaultPrevented) harness.primary(0, validFrame(-Math.PI / 2));
    harness.manager.beginCalibration();
    expect(recalibrateEvent.defaultPrevented).toBe(true);
    expect(harness.calibration.current.kind).toBe('calibrating');
    harness.manager.cancelCalibration();
    expect(harness.calibration.current).toEqual(calibrated);

    const resetEvent = new Event('beforexrselect', { cancelable: true });
    reset.dispatchEvent(resetEvent);
    if (!resetEvent.defaultPrevented) harness.primary(0, validFrame(-Math.PI / 2));
    harness.manager.resetCalibration();
    expect(resetEvent.defaultPrevented).toBe(true);
    expect(harness.calibration.current.kind).toBe('uncalibrated');
  });

  it('leaves non-overlay controller select functional and removes guards on session end', () => {
    const harness = createHarness();
    harness.connect(1);
    const control = new EventTarget();
    harness.manager.configureDomOverlay([control], true);
    harness.primary(1);
    harness.primary(1, validFrame(-Math.PI / 2));
    expect(harness.calibration.current.kind).toBe('calibrated');

    harness.session.emitEnd();
    const afterEnd = new Event('beforexrselect', { cancelable: true });
    control.dispatchEvent(afterEnd);
    expect(afterEnd.defaultPrevented).toBe(false);
    expect(harness.session.listenerCount()).toBe(0);
  });

  it('ignores a late session bind and overlay setup after the manager was deactivated', () => {
    const harness = createHarness();
    const lateSession = new FakeSession();
    const control = new EventTarget();

    harness.session.emitEnd();
    harness.manager.deactivate();
    harness.manager.bindSession(lateSession as unknown as XRSession);
    harness.manager.configureDomOverlay([control], true);

    const event = new Event('beforexrselect', { cancelable: true });
    control.dispatchEvent(event);
    expect(lateSession.listenerCount()).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});
