import * as THREE from 'three';
import type { XRTargetRaySpace } from 'three/src/renderers/webxr/WebXRController.js';
import {
  isCalibrationActive,
  NorthCalibrationController,
} from '../calibration/state';

const CONTROLLER_COUNT = 2;
const CAPTURE_ARM_DELAY_MS = 300;
const TARGET_RAY_FORWARD = new THREE.Vector3(0, 0, -1);

interface ControllerSlot {
  readonly index: number;
  readonly controller: XRTargetRaySpace;
  readonly ray: THREE.Line;
  inputSource?: XRInputSource;
  usable: boolean;
  readonly onConnected: (event: { data: XRInputSource }) => void;
  readonly onDisconnected: (event: { data: XRInputSource }) => void;
  readonly onSelect: (event: { data: XRInputSource }) => void;
}

export type ControllerGetter = (index: number) => XRTargetRaySpace;

function createAimingRay(): THREE.Line {
  const ray = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1.8),
    ]),
    new THREE.LineBasicMaterial({
      color: 0xffdf87,
      transparent: true,
      opacity: 0.78,
    }),
  );
  ray.name = 'north-calibration-target-ray';
  ray.visible = false;
  return ray;
}

function isUsableController(inputSource: XRInputSource): boolean {
  return inputSource.targetRayMode === 'tracked-pointer' && !inputSource.hand;
}

export class NorthCalibrationControllerManager {
  private active = false;
  private slots: ControllerSlot[] = [];
  private captureAllowedAt = 0;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly getController: ControllerGetter,
    private readonly calibration: NorthCalibrationController,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.unsubscribe = calibration.subscribe(() => this.updateRayVisibility());
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.slots = Array.from({ length: CONTROLLER_COUNT }, (_, index) =>
      this.createSlot(index),
    );
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;

    this.slots.forEach((slot) => {
      slot.controller.removeEventListener('connected', slot.onConnected);
      slot.controller.removeEventListener('disconnected', slot.onDisconnected);
      slot.controller.removeEventListener('select', slot.onSelect);
      slot.controller.remove(slot.ray);
      this.scene.remove(slot.controller);
    });
    this.slots = [];
    this.captureAllowedAt = 0;
  }

  dispose(): void {
    this.deactivate();
    this.unsubscribe();
  }

  beginCalibration(): void {
    this.calibration.begin(this.hasUsableController());
    this.captureAllowedAt = this.now() + CAPTURE_ARM_DELAY_MS;
    this.updateRayVisibility();
  }

  hasUsableController(): boolean {
    return this.slots.some((slot) => slot.usable);
  }

  updateRayVisibility(): void {
    const visible = this.active && isCalibrationActive(this.calibration.current);
    this.slots.forEach((slot) => {
      slot.ray.visible = visible && slot.usable;
    });
  }

  private createSlot(index: number): ControllerSlot {
    const controller = this.getController(index);
    const ray = createAimingRay();
    const slot = {} as ControllerSlot;

    const onConnected = (event: { data: XRInputSource }): void => {
      slot.inputSource = event.data;
      slot.usable = isUsableController(event.data);
      if (slot.usable) this.calibration.noteControllerAvailable();
      this.updateRayVisibility();
    };

    const onDisconnected = (): void => {
      slot.inputSource = undefined;
      slot.usable = false;
      if (!this.hasUsableController()) this.calibration.noteControllerUnavailable();
      this.updateRayVisibility();
    };

    const onSelect = (event: { data: XRInputSource }): void => {
      if (!slot.usable || !isCalibrationActive(this.calibration.current)) return;
      if (this.now() < this.captureAllowedAt) return;

      try {
        controller.updateWorldMatrix(true, false);
        const worldQuaternion = controller.getWorldQuaternion(new THREE.Quaternion());
        const direction = TARGET_RAY_FORWARD.clone().applyQuaternion(worldQuaternion);
        this.calibration.capture(direction, {
          controllerHandedness: event.data.handedness,
          sourceIdentifier: `${event.data.handedness || 'unknown'}-controller-${index}`,
          simulated: false,
          timestamp: this.now(),
        });
      } catch {
        this.calibration.captureFailed(
          'The controller target ray could not be resolved. Hold it steady and try again.',
        );
      }
    };

    Object.assign(slot, {
      index,
      controller,
      ray,
      usable: false,
      onConnected,
      onDisconnected,
      onSelect,
    });

    controller.add(ray);
    controller.addEventListener('connected', onConnected);
    controller.addEventListener('disconnected', onDisconnected);
    controller.addEventListener('select', onSelect);
    this.scene.add(controller);
    return slot;
  }
}
