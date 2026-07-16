import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';
import { normalizeDegrees } from './calibration/math';
import {
  isCalibrationActive,
  NorthCalibrationController,
  type NorthCalibrationState,
} from './calibration/state';
import {
  applyCalibrationToGeographicGroup,
  createGeographicReferenceGroup,
} from './scene/createGeographicReference';
import { createReferenceScene } from './scene/createReferenceScene';
import { NorthCalibrationControllerManager } from './xr/controllerCalibration';
import {
  checkingState,
  detectImmersiveAr,
  ImmersiveArSessionController,
  type ImmersiveArSession,
  type XRState,
} from './xr/state';

function requireElement<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Required element is missing: ${selector}`);
  return element;
}

const sceneHost = requireElement<HTMLDivElement>('#scene');
const statusElement = requireElement<HTMLParagraphElement>('#status');
const detailElement = requireElement<HTMLParagraphElement>('#status-detail');
const enterArButton = requireElement<HTMLButtonElement>('#enter-ar');
const calibrationStatus = requireElement<HTMLParagraphElement>('#north-status');
const calibrationDetail = requireElement<HTMLParagraphElement>('#north-detail');
const calibrateButton = requireElement<HTMLButtonElement>('#calibrate-north');
const cancelCalibrationButton = requireElement<HTMLButtonElement>('#cancel-calibration');
const resetNorthButton = requireElement<HTMLButtonElement>('#reset-north');
const desktopSimulation = requireElement<HTMLDivElement>('#desktop-simulation');
const bearingInput = requireElement<HTMLInputElement>('#simulated-bearing');
const bearingOutput = requireElement<HTMLOutputElement>('#bearing-output');
const simulateNorthButton = requireElement<HTMLButtonElement>('#simulate-north');

const desktopBackground = new THREE.Color(0x071014);
const scene = createReferenceScene();
const geographicReference = createGeographicReferenceGroup();
scene.add(geographicReference);
scene.background = desktopBackground;

const camera = new THREE.PerspectiveCamera(
  54,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(2.7, 2.1, 3.1);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
sceneHost.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.update();

const northCalibration = new NorthCalibrationController();
let currentXrState: XRState = checkingState;
let controllerManager: NorthCalibrationControllerManager | undefined;

function setImmersivePresentation(active: boolean): void {
  controls.enabled = !active;
  scene.background = active ? null : desktopBackground;
  renderer.setClearColor(desktopBackground, active ? 0 : 1);
}

function renderState(state: XRState): void {
  currentXrState = state;
  statusElement.textContent = state.message;
  detailElement.textContent = state.detail ?? '';
  document.body.dataset.xrState = state.kind;

  const canEnter =
    state.kind === 'supported' ||
    state.kind === 'session-ended' ||
    state.kind === 'session-denied-or-failed';
  enterArButton.hidden = !canEnter;
  enterArButton.disabled = state.kind === 'session-starting';
  enterArButton.textContent = state.kind === 'session-denied-or-failed' ? 'Try AR again' : 'Enter AR';

  if (state.kind === 'session-active') setImmersivePresentation(true);
  if (state.kind === 'session-starting') {
    northCalibration.reset();
    controllerManager?.activate();
  }
  if (
    state.kind === 'session-cleaning' ||
    state.kind === 'session-ended' ||
    state.kind === 'session-denied-or-failed'
  ) {
    setImmersivePresentation(false);
    controllerManager?.deactivate();
    northCalibration.reset();
  }

  renderCalibrationState(northCalibration.current);
}

function formatYaw(yawRadians: number): string {
  const degrees = (yawRadians * 180) / Math.PI;
  return `${degrees >= 0 ? '+' : ''}${degrees.toFixed(1)}°`;
}

function renderCalibrationState(state: NorthCalibrationState): void {
  const xrActive = currentXrState.kind === 'session-active';
  const calibrationActive = isCalibrationActive(state);
  applyCalibrationToGeographicGroup(geographicReference, state);
  controllerManager?.updateRayVisibility();
  document.body.dataset.northState = state.kind;

  if (state.kind === 'uncalibrated') {
    calibrationStatus.textContent = 'North not calibrated.';
    calibrationDetail.textContent = xrActive
      ? 'Stand at the physical origin, then begin calibration.'
      : 'Enter AR for physical calibration or use the desktop simulation.';
  } else if (state.kind === 'calibrating') {
    calibrationStatus.textContent = 'North calibration active.';
    calibrationDetail.textContent =
      'Point either controller at the true-north marker, hold it approximately level, and press the trigger.';
  } else if (state.kind === 'calibrated') {
    calibrationStatus.textContent = state.calibration.simulated
      ? 'North calibrated (desktop simulation).'
      : 'North calibrated.';
    calibrationDetail.textContent = `Geographic-group yaw: ${formatYaw(state.calibration.yawRadians)}. Recalibrate after recentering, changing rooms, or resetting the boundary.`;
  } else {
    calibrationStatus.textContent =
      state.kind === 'controller-unavailable'
        ? 'Controller unavailable.'
        : state.kind === 'invalid-direction'
          ? 'Direction not usable.'
          : 'North capture failed.';
    calibrationDetail.textContent = state.message;
  }

  calibrateButton.hidden = !xrActive || calibrationActive;
  calibrateButton.textContent = state.kind === 'calibrated' ? 'Recalibrate North' : 'Calibrate North';
  cancelCalibrationButton.hidden = !xrActive || !calibrationActive;
  resetNorthButton.hidden = state.kind === 'uncalibrated';
  desktopSimulation.hidden = xrActive;
}

northCalibration.subscribe(renderCalibrationState);

controllerManager = new NorthCalibrationControllerManager(
  scene,
  (index) => renderer.xr.getController(index),
  northCalibration,
);

const browserXr = navigator.xr;
const xrApi = browserXr
  ? {
      isSessionSupported: (mode: 'immersive-ar') =>
        browserXr.isSessionSupported(mode),
      requestSession: (mode: 'immersive-ar', options: XRSessionInit) =>
        browserXr.requestSession(mode, options),
    }
  : undefined;

let sessionController: ImmersiveArSessionController | undefined;
if (xrApi) {
  sessionController = new ImmersiveArSessionController(
    xrApi,
    async (session: ImmersiveArSession) => {
      await renderer.xr.setSession(session as XRSession);
    },
    renderState,
    (phase, error) => {
      console.warn(`WebXR ${phase} failure.`, error);
    },
    {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body },
    },
  );
}

enterArButton.addEventListener('click', () => {
  void sessionController?.start();
});

calibrateButton.addEventListener('click', () => {
  controllerManager?.beginCalibration();
});

cancelCalibrationButton.addEventListener('click', () => {
  northCalibration.cancel();
});

resetNorthButton.addEventListener('click', () => {
  northCalibration.reset();
});

function updateBearingOutput(): void {
  bearingOutput.value = `${normalizeDegrees(Number(bearingInput.value)).toFixed(0)}°`;
}

function simulateBearing(degrees: number): void {
  bearingInput.value = String(normalizeDegrees(degrees));
  updateBearingOutput();
  northCalibration.simulateBearing(degrees);
}

bearingInput.addEventListener('input', updateBearingOutput);
simulateNorthButton.addEventListener('click', () => {
  simulateBearing(Number(bearingInput.value));
});
document.querySelectorAll<HTMLButtonElement>('[data-bearing]').forEach((button) => {
  button.addEventListener('click', () => {
    simulateBearing(Number(button.dataset.bearing));
  });
});
updateBearingOutput();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

async function initializeCapabilityState(): Promise<void> {
  renderState(checkingState);
  const state = await detectImmersiveAr({
    isSecureContext: window.isSecureContext,
    xr: xrApi,
  });
  renderState(state);
}

void initializeCapabilityState();
