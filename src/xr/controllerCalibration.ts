import * as THREE from 'three';
import type { XRTargetRaySpace } from 'three/src/renderers/webxr/WebXRController.js';
import {
  isCalibrationActive,
  NorthCalibrationController,
  type NorthCalibrationState,
} from '../calibration/state';

const CONTROLLER_COUNT = 2;
const DELIBERATE_HOLD_MS = 1_200;
const TARGET_RAY_FORWARD = new THREE.Vector3(0, 0, -1);
const TRACKING_UNAVAILABLE_MESSAGE =
  'Controller tracking is unavailable. Move the controller into view and try again.';

const SESSION_INPUT_EVENTS = [
  'selectstart',
  'select',
  'selectend',
  'squeezestart',
  'squeeze',
  'squeezeend',
] as const;

type SessionInputEventName = (typeof SESSION_INPUT_EVENTS)[number];

export type ControllerInteractionKind =
  | 'idle-uncalibrated'
  | 'idle-calibrated'
  | 'awaiting-release'
  | 'ready'
  | 'capture-processing'
  | 'calibrated-success'
  | 'recoverable-error'
  | 'cancelled'
  | 'reset';

export interface ControllerInteractionState {
  readonly kind: ControllerInteractionKind;
  readonly message: string;
}

interface ControllerSlot {
  readonly index: number;
  readonly controller: XRTargetRaySpace;
  readonly ray: THREE.Line;
  readonly feedback: THREE.Sprite;
  inputSource?: XRInputSource;
  usable: boolean;
  selectStartedAt?: number;
  selectCompleted: boolean;
  selectHandled: boolean;
  selectStartsCalibration: boolean;
  selectStartedFromCalibrated: boolean;
  squeezeStartedAt?: number;
  squeezeHandled: boolean;
  readonly onConnected: (event: { data: XRInputSource }) => void;
  readonly onDisconnected: (event: { data: XRInputSource }) => void;
}

interface FeedbackDrawing {
  readonly context: CanvasRenderingContext2D;
  readonly texture: THREE.CanvasTexture;
}

export type ControllerGetter = (index: number) => XRTargetRaySpace;
export type ReferenceSpaceGetter = () => XRReferenceSpace | null;
export type InteractionStateListener = (state: ControllerInteractionState) => void;

const feedbackDrawings = new WeakMap<THREE.Sprite, FeedbackDrawing>();

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

function createFeedbackSprite(): THREE.Sprite {
  const material = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.name = 'north-calibration-controller-feedback';
  sprite.position.set(0, 0.18, -0.72);
  sprite.scale.set(0.9, 0.34, 1);
  sprite.visible = false;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    if (context) {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
      feedbackDrawings.set(sprite, { context, texture });
    }
  }

  return sprite;
}

function drawFeedback(sprite: THREE.Sprite, message: string): void {
  sprite.userData.message = message;
  const drawing = feedbackDrawings.get(sprite);
  if (!drawing) return;

  const { context, texture } = drawing;
  const { canvas } = context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(5, 17, 22, 0.82)';
  context.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.strokeStyle = 'rgba(128, 203, 216, 0.55)';
  context.lineWidth = 3;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.fillStyle = '#e8f7fa';
  context.font = '500 29px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const lines = message.split('\n').slice(0, 3);
  const lineHeight = 42;
  const firstY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, canvas.width / 2, firstY + index * lineHeight, canvas.width - 52);
  });
  texture.needsUpdate = true;
}

function disposeFeedback(sprite: THREE.Sprite): void {
  feedbackDrawings.get(sprite)?.texture.dispose();
  feedbackDrawings.delete(sprite);
  (sprite.material as THREE.SpriteMaterial).dispose();
}

function isUsableController(inputSource: XRInputSource): boolean {
  return inputSource.targetRayMode === 'tracked-pointer' && !inputSource.hand;
}

function defaultInteraction(state: NorthCalibrationState): ControllerInteractionState {
  if (state.kind === 'calibrated') {
    return {
      kind: 'idle-calibrated',
      message: 'North saved\nTrigger: recalibrate\nHold trigger: reset',
    };
  }
  if (isCalibrationActive(state)) {
    return {
      kind:
        state.kind === 'invalid-direction' || state.kind === 'capture-failed'
          ? 'recoverable-error'
          : 'ready',
      message:
        state.kind === 'invalid-direction' || state.kind === 'capture-failed'
          ? `${state.message}\nTrigger: try again`
          : 'Aim at true north\nTrigger: capture\nGrip or hold trigger: cancel',
    };
  }
  return {
    kind: 'idle-uncalibrated',
    message: 'Trigger: begin\nnorth calibration',
  };
}

function transformIsFinite(transform: XRRigidTransform): boolean {
  const { orientation, position } = transform;
  const values = [
    orientation.x,
    orientation.y,
    orientation.z,
    orientation.w,
    position.x,
    position.y,
    position.z,
    position.w,
    ...transform.matrix,
  ];
  if (!values.every(Number.isFinite)) return false;
  const quaternionLength = Math.hypot(
    orientation.x,
    orientation.y,
    orientation.z,
    orientation.w,
  );
  return Number.isFinite(quaternionLength) && quaternionLength > Number.EPSILON;
}

/**
 * Cancelling `beforexrselect` on an interactive DOM-overlay control suppresses
 * the paired XR select sequence while leaving the DOM click itself intact.
 */
export class DomOverlaySelectGuard {
  private controls: EventTarget[] = [];
  private readonly onBeforeXrSelect: EventListener = (event) => event.preventDefault();

  enable(controls: readonly EventTarget[]): void {
    this.disable();
    this.controls = [...controls];
    this.controls.forEach((control) => {
      control.addEventListener('beforexrselect', this.onBeforeXrSelect);
    });
  }

  disable(): void {
    this.controls.forEach((control) => {
      control.removeEventListener('beforexrselect', this.onBeforeXrSelect);
    });
    this.controls = [];
  }
}

export class NorthCalibrationControllerManager {
  private active = false;
  private slots: ControllerSlot[] = [];
  private worldFeedback?: THREE.Sprite;
  private session?: XRSession;
  private armingInputSource?: XRInputSource;
  private domOverlayActive = false;
  private suppressCalibrationSync = false;
  private interaction: ControllerInteractionState;
  private readonly interactionListeners = new Set<InteractionStateListener>();
  private readonly overlayGuard = new DomOverlaySelectGuard();
  private readonly unsubscribe: () => void;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly getController: ControllerGetter,
    private readonly getReferenceSpace: ReferenceSpaceGetter,
    private readonly calibration: NorthCalibrationController,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.interaction = defaultInteraction(calibration.current);
    this.unsubscribe = calibration.subscribe((state) => {
      if (!this.suppressCalibrationSync) this.setInteraction(defaultInteraction(state));
      this.updateRayVisibility();
      this.updateFeedback();
    });
  }

  get currentInteraction(): ControllerInteractionState {
    return this.interaction;
  }

  subscribeInteraction(listener: InteractionStateListener): () => void {
    this.interactionListeners.add(listener);
    listener(this.interaction);
    return () => this.interactionListeners.delete(listener);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.worldFeedback = createFeedbackSprite();
    this.worldFeedback.name = 'north-calibration-world-feedback';
    this.worldFeedback.position.set(0, 1.25, -1.15);
    this.scene.add(this.worldFeedback);
    this.slots = Array.from({ length: CONTROLLER_COUNT }, (_, index) =>
      this.createSlot(index),
    );
    this.setInteraction(defaultInteraction(this.calibration.current));
  }

  bindSession(session: XRSession): void {
    this.unbindSession();
    if (!this.active) return;
    this.session = session;
    SESSION_INPUT_EVENTS.forEach((type) => {
      session.addEventListener(type, this.onSessionInput);
    });
    session.addEventListener('end', this.onSessionEnd);
  }

  configureDomOverlay(controls: readonly EventTarget[], active: boolean): void {
    this.overlayGuard.disable();
    this.domOverlayActive = this.active && active;
    if (this.domOverlayActive) this.overlayGuard.enable(controls);
    this.updateFeedback();
  }

  deactivate(): void {
    this.unbindSession();
    this.configureDomOverlay([], false);
    if (!this.active) return;
    this.active = false;
    this.armingInputSource = undefined;

    this.slots.forEach((slot) => {
      slot.controller.removeEventListener('connected', slot.onConnected);
      slot.controller.removeEventListener('disconnected', slot.onDisconnected);
      slot.controller.remove(slot.ray);
      slot.controller.remove(slot.feedback);
      this.scene.remove(slot.controller);
      slot.ray.geometry.dispose();
      (slot.ray.material as THREE.Material).dispose();
      disposeFeedback(slot.feedback);
    });
    this.slots = [];
    if (this.worldFeedback) {
      this.scene.remove(this.worldFeedback);
      disposeFeedback(this.worldFeedback);
      this.worldFeedback = undefined;
    }
    this.setInteraction(defaultInteraction(this.calibration.current));
  }

  dispose(): void {
    this.deactivate();
    this.unsubscribe();
    this.interactionListeners.clear();
  }

  beginCalibration(): void {
    this.armingInputSource = undefined;
    this.clearAllInputPresses();
    const available = this.hasUsableController();
    this.changeCalibration(() => this.calibration.begin(available));
    this.setInteraction(
      available
        ? {
            kind: 'ready',
            message: 'Aim at true north\nTrigger: capture\nGrip or hold trigger: cancel',
          }
        : {
            kind: 'recoverable-error',
            message: 'Connect a tracked controller\nto calibrate north',
          },
    );
  }

  cancelCalibration(): void {
    if (!isCalibrationActive(this.calibration.current)) return;
    this.armingInputSource = undefined;
    this.clearAllInputPresses();
    this.changeCalibration(() => this.calibration.cancel());
    const restoredState = this.calibration.current as NorthCalibrationState;
    this.setInteraction({
      kind: 'cancelled',
      message:
        restoredState.kind === 'calibrated'
          ? 'Calibration cancelled\nPrevious north restored'
          : 'Calibration cancelled\nTrigger: begin again',
    });
  }

  resetCalibration(): void {
    this.armingInputSource = undefined;
    this.clearAllInputPresses();
    this.changeCalibration(() => this.calibration.reset());
    this.setInteraction({
      kind: 'reset',
      message: 'North reset\nTrigger: begin calibration',
    });
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

  private readonly onSessionInput = (event: XRInputSourceEvent): void => {
    const slot = this.slots.find(
      (candidate) => candidate.usable && candidate.inputSource === event.inputSource,
    );
    if (!slot) return;

    const type = event.type as SessionInputEventName;
    if (type === 'selectstart') this.handleSelectStart(slot);
    if (type === 'select') this.handleSelect(slot, event);
    if (type === 'selectend') this.handleSelectEnd(slot);
    if (type === 'squeezestart') this.handleSqueezeStart(slot);
    if (type === 'squeeze') this.handleSqueeze(slot);
    if (type === 'squeezeend') this.handleSqueezeEnd(slot);
  };

  private readonly onSessionEnd = (): void => {
    this.unbindSession();
    this.configureDomOverlay([], false);
  };

  private handleSelectStart(slot: ControllerSlot): void {
    if (
      this.interaction.kind === 'awaiting-release' &&
      this.armingInputSource !== slot.inputSource
    ) {
      return;
    }

    slot.selectStartedAt = this.now();
    slot.selectCompleted = false;
    slot.selectHandled = false;
    slot.selectStartsCalibration = false;
    slot.selectStartedFromCalibrated = false;

    const state = this.calibration.current;
    if (state.kind === 'uncalibrated' || state.kind === 'calibrated') {
      this.slots.forEach((candidate) => {
        if (candidate !== slot) this.clearInputPress(candidate);
      });
      this.clearSqueezePress(slot);
      this.armingInputSource = slot.inputSource;
      slot.selectStartsCalibration = true;
      slot.selectStartedFromCalibrated = state.kind === 'calibrated';
      this.setInteraction({
        kind: 'awaiting-release',
        message: slot.selectStartedFromCalibrated
          ? 'Release: recalibrate\nHold 1.2 s: reset'
          : 'Release trigger\nto arm north capture',
      });
      this.changeCalibration(() => this.calibration.begin(true));
    }
  }

  private handleSelect(slot: ControllerSlot, event: XRInputSourceEvent): void {
    if (slot.selectHandled || slot.selectStartedAt === undefined) return;
    slot.selectHandled = true;
    slot.selectCompleted = true;
    const duration = Math.max(0, this.now() - slot.selectStartedAt);

    if (slot.selectStartsCalibration) {
      if (this.armingInputSource !== slot.inputSource) return;
      if (slot.selectStartedFromCalibrated && duration >= DELIBERATE_HOLD_MS) {
        slot.selectStartsCalibration = false;
        this.resetCalibration();
      }
      return;
    }

    if (!isCalibrationActive(this.calibration.current)) return;
    if (
      this.interaction.kind !== 'ready' &&
      this.interaction.kind !== 'recoverable-error'
    ) {
      return;
    }
    if (duration >= DELIBERATE_HOLD_MS) {
      this.cancelCalibration();
      return;
    }

    this.captureCurrentPose(slot, event);
  }

  private handleSelectEnd(slot: ControllerSlot): void {
    if (
      slot.selectStartsCalibration &&
      this.armingInputSource === slot.inputSource
    ) {
      if (slot.selectCompleted && isCalibrationActive(this.calibration.current)) {
        this.armingInputSource = undefined;
        this.setInteraction({
          kind: 'ready',
          message: 'Aim at true north\nTrigger: capture\nGrip or hold trigger: cancel',
        });
      } else if (!slot.selectCompleted) {
        this.cancelCalibration();
      }
    }
    this.clearSelectPress(slot);
  }

  private handleSqueezeStart(slot: ControllerSlot): void {
    slot.squeezeStartedAt = this.now();
    slot.squeezeHandled = false;
  }

  private handleSqueeze(slot: ControllerSlot): void {
    if (slot.squeezeHandled || slot.squeezeStartedAt === undefined) return;
    slot.squeezeHandled = true;
    const duration = Math.max(0, this.now() - slot.squeezeStartedAt);

    if (isCalibrationActive(this.calibration.current)) {
      this.cancelCalibration();
      return;
    }

    if (this.calibration.current.kind === 'calibrated') {
      if (duration >= DELIBERATE_HOLD_MS) {
        this.resetCalibration();
      } else {
        this.beginCalibration();
      }
    }
  }

  private handleSqueezeEnd(slot: ControllerSlot): void {
    this.clearSqueezePress(slot);
  }

  private captureCurrentPose(slot: ControllerSlot, event: XRInputSourceEvent): void {
    const referenceSpace = this.getReferenceSpace();
    if (
      !referenceSpace ||
      !slot.usable ||
      !slot.controller.visible ||
      slot.inputSource !== event.inputSource
    ) {
      this.rejectUnavailableTracking();
      return;
    }

    let pose: XRPose | undefined | null;
    try {
      pose = event.frame?.getPose(event.inputSource.targetRaySpace, referenceSpace);
    } catch {
      pose = null;
    }

    if (!pose || !transformIsFinite(pose.transform)) {
      this.rejectUnavailableTracking();
      return;
    }

    const { orientation } = pose.transform;
    const quaternion = new THREE.Quaternion(
      orientation.x,
      orientation.y,
      orientation.z,
      orientation.w,
    ).normalize();
    const direction = TARGET_RAY_FORWARD.clone().applyQuaternion(quaternion);
    if (![direction.x, direction.y, direction.z].every(Number.isFinite)) {
      this.rejectUnavailableTracking();
      return;
    }

    this.setInteraction({
      kind: 'capture-processing',
      message: 'Capturing north direction...',
    });
    const captured = this.changeCalibration(() =>
      this.calibration.capture(direction, {
        controllerHandedness: event.inputSource.handedness,
        sourceIdentifier: `${event.inputSource.handedness || 'unknown'}-controller-${slot.index}`,
        simulated: false,
        timestamp: this.now(),
      }),
    );
    if (captured) {
      this.armingInputSource = undefined;
      this.clearAllInputPresses();
    }

    this.setInteraction(
      captured
        ? {
            kind: 'calibrated-success',
            message: 'North calibrated\nTrigger: recalibrate\nHold trigger: reset',
          }
        : {
            kind: 'recoverable-error',
            message: `${
              this.calibration.current.kind === 'invalid-direction' ||
              this.calibration.current.kind === 'capture-failed' ||
              this.calibration.current.kind === 'controller-unavailable'
                ? this.calibration.current.message
                : 'North capture failed.'
            }\nTrigger: try again`,
          },
    );
  }

  private rejectUnavailableTracking(): void {
    this.changeCalibration(() => this.calibration.captureFailed(TRACKING_UNAVAILABLE_MESSAGE));
    this.setInteraction({
      kind: 'recoverable-error',
      message: 'Controller tracking unavailable\nMove it into view and retry',
    });
  }

  private createSlot(index: number): ControllerSlot {
    const controller = this.getController(index);
    const ray = createAimingRay();
    const feedback = createFeedbackSprite();
    const slot = {} as ControllerSlot;

    const onConnected = (event: { data: XRInputSource }): void => {
      slot.inputSource = event.data;
      slot.usable = isUsableController(event.data);
      if (slot.usable) this.calibration.noteControllerAvailable();
      this.updateRayVisibility();
      this.updateFeedback();
    };

    const onDisconnected = (event: { data: XRInputSource }): void => {
      const interruptedArming = this.armingInputSource === event.data;
      if (interruptedArming) this.armingInputSource = undefined;
      slot.inputSource = undefined;
      slot.usable = false;
      this.clearInputPress(slot);
      if (!this.hasUsableController()) {
        this.calibration.noteControllerUnavailable();
        if (isCalibrationActive(this.calibration.current)) {
          this.setInteraction({
            kind: 'recoverable-error',
            message: 'Controller disconnected\nReconnect and try again',
          });
        }
      } else if (interruptedArming && isCalibrationActive(this.calibration.current)) {
        this.setInteraction({
          kind: 'recoverable-error',
          message: 'Starting controller disconnected\nAim and trigger to continue',
        });
      }
      this.updateRayVisibility();
      this.updateFeedback();
    };

    Object.assign(slot, {
      index,
      controller,
      ray,
      feedback,
      usable: false,
      selectCompleted: false,
      selectHandled: false,
      selectStartsCalibration: false,
      selectStartedFromCalibrated: false,
      squeezeHandled: false,
      onConnected,
      onDisconnected,
    });

    controller.add(ray, feedback);
    controller.addEventListener('connected', onConnected);
    controller.addEventListener('disconnected', onDisconnected);
    this.scene.add(controller);
    return slot;
  }

  private clearSelectPress(slot: ControllerSlot): void {
    slot.selectStartedAt = undefined;
    slot.selectCompleted = false;
    slot.selectHandled = false;
    slot.selectStartsCalibration = false;
    slot.selectStartedFromCalibrated = false;
  }

  private clearSqueezePress(slot: ControllerSlot): void {
    slot.squeezeStartedAt = undefined;
    slot.squeezeHandled = false;
  }

  private clearInputPress(slot: ControllerSlot): void {
    this.clearSelectPress(slot);
    this.clearSqueezePress(slot);
  }

  private clearAllInputPresses(): void {
    this.slots.forEach((slot) => this.clearInputPress(slot));
  }

  private unbindSession(): void {
    if (!this.session) return;
    SESSION_INPUT_EVENTS.forEach((type) => {
      this.session?.removeEventListener(type, this.onSessionInput);
    });
    this.session.removeEventListener('end', this.onSessionEnd);
    this.session = undefined;
  }

  private changeCalibration<Result>(action: () => Result): Result {
    this.suppressCalibrationSync = true;
    try {
      return action();
    } finally {
      this.suppressCalibrationSync = false;
      this.updateRayVisibility();
      this.updateFeedback();
    }
  }

  private setInteraction(state: ControllerInteractionState): void {
    this.interaction = state;
    this.updateRayVisibility();
    this.updateFeedback();
    this.interactionListeners.forEach((listener) => listener(state));
  }

  private updateFeedback(): void {
    this.slots.forEach((slot) => {
      drawFeedback(slot.feedback, this.interaction.message);
      slot.feedback.visible =
        this.active && !this.domOverlayActive && slot.usable;
    });
    if (this.worldFeedback) {
      drawFeedback(this.worldFeedback, this.interaction.message);
      const anyVisibleController = this.slots.some(
        (slot) => slot.usable && slot.controller.visible,
      );
      this.worldFeedback.visible =
        this.active &&
        !this.domOverlayActive &&
        (!anyVisibleController || this.interaction.kind === 'recoverable-error');
    }
  }
}
