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
import { createEarthAxisGroup } from './scene/createEarthAxisGroup';
import { createCelestialEquatorGroup } from './scene/createCelestialEquatorGroup';
import { createGeocentricCelestialStructureGroup } from './scene/createGeocentricCelestialStructureGroup';
import { createLocalHorizonGroup } from './scene/createLocalHorizonGroup';
import { createSolarSystemBodiesGroup } from './scene/createSolarSystemBodiesGroup';
import { createSolarDailyPathGroup } from './scene/createSolarDailyPathGroup';
import { createReferenceScene } from './scene/createReferenceScene';
import { createSimulationInstant } from './science/astronomy/time';
import { createScientificProviderRegistry } from './science/providers/scientificProviderRegistry';
import { SolarSystemBodyStateService } from './science/bodies/solarSystemBodyState';
import { SolarDailyPathService } from './science/temporal/solarDailyPath';
import { ScientificSnapshotService } from './science/snapshot/scientificSnapshotService';
import { GeographicCalibrationStateAdapter } from './science/state/geographicCalibrationState';
import { ObserverStateStore } from './science/state/observerState';
import { ScientificConfigurationStore } from './science/state/scientificConfiguration';
import { SimulationClock } from './science/state/simulationClock';
import { CivilTimeZoneStateStore } from './science/state/civilTimeZoneState';
import { browserResolvedTimeZone } from './science/temporal/civilTime';
import {
  createEarthAxisPresentationModel,
  createEarthAxisStatusViewModel,
  DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
  EARTH_AXIS_LINEAR_SCENE_FAR_METERS,
  type EarthAxisDisplaySettings,
} from './presentation/earthAxisPresentationModel';
import {
  createCelestialEquatorPresentationModel,
  DEFAULT_CELESTIAL_EQUATOR_DISPLAY_SETTINGS,
  type CelestialEquatorDisplaySettings,
} from './presentation/celestialEquatorPresentationModel';
import { createGeocentricCelestialStructurePresentation } from './presentation/geocentricCelestialStructurePresentation';
import {
  parseEyePresentationMode,
  type EyePresentationMode,
} from './presentation/eyePresentationMode';
import {
  createLocalHorizonPresentationModel,
  DEFAULT_LOCAL_HORIZON_DISPLAY_SETTINGS,
  LOCAL_HORIZON_SAMPLE_COUNT,
} from './presentation/localHorizonPresentationModel';
import {
  createSolarSystemBodyPresentationModel,
  DEFAULT_SOLAR_SYSTEM_BODY_DISPLAY_SETTINGS,
  type SolarSystemBodyDisplaySettings,
} from './presentation/solarSystemBodyPresentationModel';
import {
  createSolarDailyPathPresentationModel,
  DEFAULT_SOLAR_DAILY_PATH_DISPLAY_SETTINGS,
  type SolarDailyPathDisplaySettings,
} from './presentation/solarDailyPathPresentationModel';
import { RealtimeCelestialUpdateScheduler } from './temporal/realtimeCelestialUpdateScheduler';
import {
  applyBasicDiagnosticMaterials,
  createSimpleUnifiedRootDiagnostic,
  createXrPerEyeDiagnostics,
} from './diagnostics/xrPerEyeDiagnostics';
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
const bearingPresetButtons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-bearing]'),
];
const celestialPanel = requireElement<HTMLElement>('#celestial-panel');
const celestialStatus = requireElement<HTMLParagraphElement>('#celestial-status');
const celestialDetail = requireElement<HTMLParagraphElement>('#celestial-detail');
const celestialLimitations = requireElement<HTMLParagraphElement>('#celestial-limitations');
const celestialDiagnostics = requireElement<HTMLUListElement>('#celestial-diagnostics');
const observerLatitudeInput = requireElement<HTMLInputElement>('#observer-latitude');
const observerLongitudeInput = requireElement<HTMLInputElement>('#observer-longitude');
const observerElevationInput = requireElement<HTMLInputElement>('#observer-elevation');
const observerError = requireElement<HTMLParagraphElement>('#observer-error');
const applyObserverButton = requireElement<HTMLButtonElement>('#apply-observer');
const clearObserverButton = requireElement<HTMLButtonElement>('#clear-observer');
const observerPresetButtons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-observer-latitude]'),
];
const selectedUtcOutput = requireElement<HTMLOutputElement>('#selected-utc');
const timePresetButtons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-time-utc]'),
];
const useCurrentTimeButton = requireElement<HTMLButtonElement>('#use-current-time');
const civilTimeZoneInput = requireElement<HTMLInputElement>('#civil-time-zone');
const civilTimeZoneError = requireElement<HTMLParagraphElement>('#civil-time-zone-error');
const showAxisInput = requireElement<HTMLInputElement>('#show-celestial-axis');
const showEarthCoreInput = requireElement<HTMLInputElement>('#show-earth-core');
const showMarkersInput = requireElement<HTMLInputElement>('#show-pole-markers');
const showLabelsInput = requireElement<HTMLInputElement>('#show-pole-labels');
const showBelowHorizonInput = requireElement<HTMLInputElement>('#show-below-horizon');
const showCelestialEquatorInput = requireElement<HTMLInputElement>('#show-celestial-equator');
const showLocalHorizonInput = requireElement<HTMLInputElement>('#show-local-horizon');
const showSolarSystemBodiesInput = requireElement<HTMLInputElement>('#show-solar-system-bodies');
const showSolarDailyPathInput = requireElement<HTMLInputElement>('#show-solar-daily-path');
const showSolarHourNotchesInput = requireElement<HTMLInputElement>('#show-solar-hour-notches');
const showSolarPathBelowHorizonInput = requireElement<HTMLInputElement>('#show-solar-path-below-horizon');
const axisEyeModeSelect = requireElement<HTMLSelectElement>('#axis-eye-mode');
const equatorEyeModeSelect = requireElement<HTMLSelectElement>('#equator-eye-mode');
const horizonEyeModeSelect = requireElement<HTMLSelectElement>('#horizon-eye-mode');
const eyePresentationStatus = requireElement<HTMLParagraphElement>('#eye-presentation-status');
const xrDiagnostics = createXrPerEyeDiagnostics();
const diagnosticPreset = xrDiagnostics.preset;
if (xrDiagnostics.enabled) {
  showAxisInput.checked = diagnosticPreset.axis;
  showEarthCoreInput.checked = diagnosticPreset.core;
  showMarkersInput.checked = diagnosticPreset.markers;
  showLabelsInput.checked = diagnosticPreset.labels;
  showCelestialEquatorInput.checked = diagnosticPreset.equator;
  showLocalHorizonInput.checked = diagnosticPreset.horizon;
  showSolarSystemBodiesInput.checked = diagnosticPreset.bodies;
  showSolarDailyPathInput.checked = diagnosticPreset.sunPath;
  showSolarHourNotchesInput.checked = diagnosticPreset.sunPath;
}
const celestialOverlayControls = [
  ...celestialPanel.querySelectorAll<HTMLElement>('button, input, select, summary'),
];
const domOverlayControls: EventTarget[] = [
  enterArButton,
  calibrateButton,
  cancelCalibrationButton,
  resetNorthButton,
  bearingInput,
  simulateNorthButton,
  ...bearingPresetButtons,
  ...celestialOverlayControls,
  ...document.querySelectorAll<HTMLElement>('#xr-diagnostic-panel button, #xr-diagnostic-panel select, #xr-diagnostic-panel summary'),
];

const desktopBackground = new THREE.Color(0x071014);
const scene = createReferenceScene();
const geographicReference = createGeographicReferenceGroup();
const celestialAxis = createEarthAxisGroup(
  undefined,
  (event, detail) => xrDiagnostics.record(event, detail),
);
const celestialEquator = createCelestialEquatorGroup(
  96,
  (event, detail) => xrDiagnostics.record(event, detail),
);
const geocentricCelestialStructure = createGeocentricCelestialStructureGroup(
  celestialAxis.group,
  celestialEquator.group,
);
const localHorizon = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
const solarSystemBodies = createSolarSystemBodiesGroup();
const solarDailyPath = createSolarDailyPathGroup();
if (xrDiagnostics.enabled && diagnosticPreset.legacyAxisRoot) {
  geocentricCelestialStructure.remove(celestialAxis.group);
  geographicReference.add(geocentricCelestialStructure, celestialAxis.group);
} else {
  geographicReference.add(geocentricCelestialStructure);
}
if (xrDiagnostics.enabled && diagnosticPreset.simpleUnifiedRoot) {
  geocentricCelestialStructure.add(createSimpleUnifiedRootDiagnostic());
}
geographicReference.add(localHorizon.group);
geographicReference.add(solarSystemBodies.group);
geographicReference.add(solarDailyPath.group);
scene.add(geographicReference);
scene.background = desktopBackground;
if (xrDiagnostics.enabled) {
  applyBasicDiagnosticMaterials(geocentricCelestialStructure, diagnosticPreset.basicTarget);
  if (diagnosticPreset.legacyAxisRoot) {
    applyBasicDiagnosticMaterials(celestialAxis.group, diagnosticPreset.basicTarget);
  }
  if (diagnosticPreset.disableFrustumCulling) {
    geocentricCelestialStructure.traverse((object) => { object.frustumCulled = false; });
  }
}

const camera = new THREE.PerspectiveCamera(
  54,
  window.innerWidth / window.innerHeight,
  0.01,
  EARTH_AXIS_LINEAR_SCENE_FAR_METERS,
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
if (xrDiagnostics.enabled && diagnosticPreset.disableApplicationClipping) {
  renderer.clippingPlanes = [];
  renderer.localClippingEnabled = false;
}
xrDiagnostics.installGlobalCapture(renderer);
xrDiagnostics.instrument(geographicReference);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.update();

const northCalibration = new NorthCalibrationController();
const observerState = new ObserverStateStore();
const simulationClock = new SimulationClock(
  createSimulationInstant('2025-06-21T16:00:00.000Z', 'user-selected'),
);
const scientificConfiguration = new ScientificConfigurationStore();
const scientificCalibration = new GeographicCalibrationStateAdapter();
const scientificProviders = createScientificProviderRegistry();
const scientificSnapshotService = new ScientificSnapshotService(scientificProviders);
const solarSystemBodyStateService = new SolarSystemBodyStateService(scientificProviders);
const solarDailyPathService = new SolarDailyPathService(scientificProviders);
const civilTimeZoneState = new CivilTimeZoneStateStore();
const realtimeCelestialUpdates = new RealtimeCelestialUpdateScheduler();
let currentXrState: XRState = checkingState;
let controllerManager: NorthCalibrationControllerManager | undefined;
let scientificOriginIdentity = 'desktop-simulation';
let xrOriginSequence = 0;
let previousCalibrationKind: NorthCalibrationState['kind'] | undefined;

function diagnosticSnapshot(label: string, state: NorthCalibrationState): void {
  xrDiagnostics.snapshot(
    label,
    state.kind === 'calibrated' ? state.calibration.yawRadians : undefined,
    {
      referenceSpaceType: 'local-floor',
      renderer,
      camera,
      geographicRoot: geographicReference,
      geocentricRoot: geocentricCelestialStructure,
      horizon: localHorizon.group,
      earthAxis: celestialAxis.group,
      equator: celestialEquator.group,
    },
  );
}

function currentAxisDisplaySettings(): EarthAxisDisplaySettings {
  return Object.freeze({
    ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
    showAxis: showAxisInput.checked,
    showEarthCore: showEarthCoreInput.checked,
    showMarkers: showMarkersInput.checked,
    showLabels: showLabelsInput.checked,
    showBelowHorizonSegment: showBelowHorizonInput.checked,
  });
}

function currentEquatorDisplaySettings(): CelestialEquatorDisplaySettings {
  return Object.freeze({
    ...DEFAULT_CELESTIAL_EQUATOR_DISPLAY_SETTINGS,
    showEquator: showCelestialEquatorInput.checked,
  });
}

function currentSolarSystemBodyDisplaySettings(): SolarSystemBodyDisplaySettings {
  return Object.freeze({
    ...DEFAULT_SOLAR_SYSTEM_BODY_DISPLAY_SETTINGS,
    showBodies: showSolarSystemBodiesInput.checked,
    emphasizeSun: showSolarDailyPathInput.checked || showSolarHourNotchesInput.checked,
    showSunOnly: !showSolarSystemBodiesInput.checked &&
      (showSolarDailyPathInput.checked || showSolarHourNotchesInput.checked),
  });
}

function currentSolarDailyPathDisplaySettings(): SolarDailyPathDisplaySettings {
  return Object.freeze({
    ...DEFAULT_SOLAR_DAILY_PATH_DISPLAY_SETTINGS,
    showPath: showSolarDailyPathInput.checked,
    showHourNotches: showSolarHourNotchesInput.checked,
    showBelowHorizon: showSolarPathBelowHorizonInput.checked,
  });
}

function selectedEyeMode(select: HTMLSelectElement): EyePresentationMode {
  return parseEyePresentationMode(select.value);
}

function updateEyePresentationModes(): void {
  const axisMode = selectedEyeMode(axisEyeModeSelect);
  const equatorMode = selectedEyeMode(equatorEyeModeSelect);
  const horizonMode = selectedEyeMode(horizonEyeModeSelect);
  celestialAxis.setEyePresentationMode(axisMode);
  celestialEquator.setEyePresentationMode(equatorMode);
  localHorizon.setEyePresentationMode(horizonMode);
  document.body.dataset.axisEyeMode = axisMode;
  document.body.dataset.equatorEyeMode = equatorMode;
  document.body.dataset.horizonEyeMode = horizonMode;
}

function renderLocalHorizon(): void {
  const model = createLocalHorizonPresentationModel(northCalibration.current, {
    ...DEFAULT_LOCAL_HORIZON_DISPLAY_SETTINGS,
    showHorizon: showLocalHorizonInput.checked,
  });
  if (model.kind === 'not-ready') {
    localHorizon.clear();
    return;
  }
  localHorizon.update(model);
}

function eyeModeDiagnostic(
  label: string,
  diagnostics: ReturnType<typeof celestialAxis.getEyePresentationDiagnostics>,
): string {
  const views = diagnostics.context === 'desktop-mono-fallback'
    ? 'desktop/mono fallback visible'
    : diagnostics.context === 'xr-no-view'
      ? 'XR view identity unavailable; layer suppressed rather than guessed'
    : `XR views ${diagnostics.viewEyes.join('/')}; rendered ${diagnostics.renderedEyes.join('/') || 'none'}; suppressed ${diagnostics.suppressedEyes.join('/') || 'none'}`;
  return `${label} eye mode ${diagnostics.mode}; ${views}`;
}

function updateEyePresentationStatus(): void {
  const next = [
    eyeModeDiagnostic('Axis/poles', celestialAxis.getEyePresentationDiagnostics()),
    eyeModeDiagnostic('Equator', celestialEquator.getEyePresentationDiagnostics()),
    eyeModeDiagnostic('Horizon', localHorizon.getEyePresentationDiagnostics()),
  ].join(' | ');
  if (eyePresentationStatus.textContent !== next) eyePresentationStatus.textContent = next;
}

function renderCelestialAxis(): void {
  updateEyePresentationModes();
  updateEyePresentationStatus();
  renderLocalHorizon();
  selectedUtcOutput.value = simulationClock.current.instant.utcIso;
  const result = scientificSnapshotService.capture({
    observer: observerState.current,
    clock: simulationClock.current,
    calibration: scientificCalibration.current,
    configuration: scientificConfiguration.current,
  });
  const view = createEarthAxisStatusViewModel(result);
  celestialStatus.textContent = view.status;
  celestialDetail.textContent = view.detail;
  celestialLimitations.textContent = view.limitations;
  const diagnostics = [
    ...view.diagnostics,
    eyeModeDiagnostic('Axis/poles', celestialAxis.getEyePresentationDiagnostics()),
    eyeModeDiagnostic('Celestial equator', celestialEquator.getEyePresentationDiagnostics()),
    eyeModeDiagnostic('Local horizon', localHorizon.getEyePresentationDiagnostics()),
    'Quest observation: each layer was clean monocularly; binocular doubling was reported. Eye modes change presentation visibility only.',
    `Local horizon: ${LOCAL_HORIZON_SAMPLE_COUNT} samples at ${DEFAULT_LOCAL_HORIZON_DISPLAY_SETTINGS.presentationRadiusMeters} m; WGS84 geodetic-up Tier 1 tangent plane`,
  ];
  celestialDiagnostics.replaceChildren(
    ...diagnostics.map((diagnostic) => {
      const item = document.createElement('li');
      item.textContent = diagnostic;
      return item;
    }),
  );
  document.body.dataset.celestialState = view.kind;

  if (result.kind !== 'ready') {
    celestialAxis.clear();
    celestialEquator.clear();
    solarSystemBodies.clear();
    solarDailyPath.clear();
    return;
  }
  const geocentricPresentation =
    createGeocentricCelestialStructurePresentation(result.snapshot);
  celestialAxis.update(createEarthAxisPresentationModel(
    result.snapshot,
    currentAxisDisplaySettings(),
    geocentricPresentation,
  ));
  const equatorModel = createCelestialEquatorPresentationModel(
    result.snapshot,
    currentEquatorDisplaySettings(),
    geocentricPresentation,
  );
  celestialEquator.update(equatorModel);
  const bodyState = solarSystemBodyStateService.capture(result.snapshot);
  const bodyModel = createSolarSystemBodyPresentationModel(
    result.snapshot,
    bodyState,
    currentSolarSystemBodyDisplaySettings(),
  );
  solarSystemBodies.update(bodyModel);
  if (civilTimeZoneState.current.kind !== 'ready') {
    solarDailyPath.clear();
    celestialDiagnostics.append(
      Object.assign(document.createElement('li'), {
        textContent: 'Sun path unavailable: choose a valid IANA civil time zone.',
      }),
    );
  } else {
    try {
      const pathState = solarDailyPathService.capture(
        result.snapshot,
        civilTimeZoneState.current.timeZone,
        civilTimeZoneState.current.revision,
      );
      const pathModel = createSolarDailyPathPresentationModel(
        result.snapshot,
        bodyState,
        pathState,
        currentSolarDailyPathDisplaySettings(),
      );
      solarDailyPath.update(pathModel);
      celestialDiagnostics.append(
        ...[
          `Sun path: ${pathModel.selectedCivilDate} in ${pathModel.timeZone}; ${pathModel.samples.length} apparent samples and ${pathModel.hourNotches.length} valid civil-hour notches`,
          `Sun path ${pathModel.renderStrategy}; ${pathModel.provenance.samplingPolicy}; below-horizon path ${pathModel.pathVisible && currentSolarDailyPathDisplaySettings().showBelowHorizon ? 'available' : 'suppressed by presentation'}`,
        ].map((diagnostic) => {
          const item = document.createElement('li');
          item.textContent = diagnostic;
          return item;
        }),
      );
    } catch (error) {
      solarDailyPath.clear();
      const item = document.createElement('li');
      item.textContent = `Sun path unavailable: ${error instanceof Error ? error.message : 'scientific path calculation failed.'}`;
      celestialDiagnostics.append(item);
    }
  }
  celestialDiagnostics.append(
    ...[
      `Equator ${equatorModel.terminology}; ${equatorModel.sampleCount} bounded finite-ring samples`,
      `Equator basis ${equatorModel.provenance.frame} from ${equatorModel.provenance.sourceBasisFrame}; ${equatorModel.provenance.samplingPhase}`,
      `Equator render strategy ${equatorModel.renderStrategy}`,
      `Equator depth contract ${equatorModel.depthContract}`,
      `Bodies: ${bodyModel.markers.length} actual apparent topocentric directions; ${bodyModel.provenance.correctionProfile}; below-horizon positions retained`,
      `Bodies render strategy ${bodyModel.renderStrategy}; ${bodyModel.presentationRadiusPolicy}`,
    ].map((diagnostic) => {
      const item = document.createElement('li');
      item.textContent = diagnostic;
      return item;
    }),
  );
}

function setImmersivePresentation(active: boolean): void {
  controls.enabled = !active;
  scene.background = active ? null : desktopBackground;
  renderer.setClearColor(desktopBackground, active ? 0 : 1);
  if (!active) {
    celestialAxis.applyEyePresentationViews();
    celestialEquator.applyEyePresentationViews();
    localHorizon.applyEyePresentationViews();
  }
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
    scientificOriginIdentity = `xr-session-pending-${xrOriginSequence + 1}`;
    northCalibration.reset();
    controllerManager?.activate();
  }
  if (
    state.kind === 'session-cleaning' ||
    state.kind === 'session-ended' ||
    state.kind === 'session-denied-or-failed'
  ) {
    scientificOriginIdentity = 'desktop-simulation';
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
  const interaction = controllerManager?.currentInteraction;
  xrDiagnostics.setCalibrationState(state.kind);
  if (state.kind === 'calibrating' && previousCalibrationKind !== 'calibrating') {
    xrDiagnostics.record('calibration.start');
    diagnosticSnapshot('before-calibration', state);
  }
  if (state.kind === 'calibrated' && previousCalibrationKind !== 'calibrated') {
    xrDiagnostics.record('calibration.completion.begin');
    diagnosticSnapshot('before-calibrated-apply', state);
  }
  applyCalibrationToGeographicGroup(geographicReference, state);
  scientificCalibration.update(state, scientificOriginIdentity);
  controllerManager?.updateRayVisibility();
  document.body.dataset.northState = state.kind;

  if (state.kind === 'uncalibrated') {
    calibrationStatus.textContent = 'North not calibrated.';
    calibrationDetail.textContent = xrActive
      ? interaction?.kind === 'reset'
        ? 'North reset. Press and release either controller trigger to begin again.'
        : 'Press and release either controller trigger once to begin calibration. The first press only arms capture.'
      : 'Enter AR for physical calibration or use the desktop simulation.';
  } else if (state.kind === 'calibrating') {
    calibrationStatus.textContent = 'North calibration active.';
    calibrationDetail.textContent =
      interaction?.kind === 'awaiting-release'
        ? 'Release the starting trigger. A later deliberate trigger press captures north.'
        : 'Point either tracked controller at true north and press its trigger. Squeeze cancels; holding trigger for 1.2 seconds is the no-squeeze cancel fallback.';
  } else if (state.kind === 'calibrated') {
    calibrationStatus.textContent = state.calibration.simulated
      ? 'North calibrated (desktop simulation).'
      : 'North calibrated.';
    calibrationDetail.textContent = `Geographic-group yaw: ${formatYaw(state.calibration.yawRadians)}. Trigger starts recalibration; hold trigger or grip for 1.2 seconds to reset. Recalibrate after recentering, changing rooms, or resetting the boundary.`;
  } else {
    calibrationStatus.textContent =
      state.kind === 'controller-unavailable'
        ? 'Controller unavailable.'
        : state.kind === 'invalid-direction'
          ? 'Direction not usable.'
          : 'North capture failed.';
    calibrationDetail.textContent = state.previousCalibration
      ? `${state.message} Squeeze or hold trigger to cancel and restore the prior accepted calibration.`
      : state.message;
  }

  calibrateButton.hidden = !xrActive || calibrationActive;
  calibrateButton.textContent = state.kind === 'calibrated' ? 'Recalibrate North' : 'Calibrate North';
  cancelCalibrationButton.hidden = !xrActive || !calibrationActive;
  resetNorthButton.hidden = state.kind === 'uncalibrated';
  desktopSimulation.hidden = xrActive;
  renderCelestialAxis();
  if (state.kind === 'calibrated' && previousCalibrationKind !== 'calibrated') {
    diagnosticSnapshot('after-calibration', state);
    xrDiagnostics.record('calibration.completion.end');
  }
  previousCalibrationKind = state.kind;
}

northCalibration.subscribe(renderCalibrationState);

controllerManager = new NorthCalibrationControllerManager(
  scene,
  (index) => renderer.xr.getController(index),
  () => renderer.xr.getReferenceSpace(),
  northCalibration,
);
controllerManager.subscribeInteraction(() => {
  renderCalibrationState(northCalibration.current);
});

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
      const xrSession = session as XRSession;
      await renderer.xr.setSession(xrSession);
      xrOriginSequence += 1;
      scientificOriginIdentity = `xr-session-${xrOriginSequence}`;
      controllerManager?.bindSession(xrSession);
      controllerManager?.configureDomOverlay(
        domOverlayControls,
        Boolean(xrSession.domOverlayState),
      );
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
  xrDiagnostics.record('calibration.start.request');
  controllerManager?.beginCalibration();
});

cancelCalibrationButton.addEventListener('click', () => {
  controllerManager?.cancelCalibration();
});

resetNorthButton.addEventListener('click', () => {
  controllerManager?.resetCalibration();
});

function updateBearingOutput(): void {
  bearingOutput.value = `${normalizeDegrees(Number(bearingInput.value)).toFixed(0)}°`;
}

function simulateBearing(degrees: number): void {
  scientificOriginIdentity = 'desktop-simulation';
  bearingInput.value = String(normalizeDegrees(degrees));
  updateBearingOutput();
  northCalibration.simulateBearing(degrees);
}

bearingInput.addEventListener('input', updateBearingOutput);
simulateNorthButton.addEventListener('click', () => {
  simulateBearing(Number(bearingInput.value));
});
bearingPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    simulateBearing(Number(button.dataset.bearing));
  });
});
updateBearingOutput();

function applyCivilTimeZone(source: 'browser-intl' | 'user-selected'): void {
  try {
    civilTimeZoneState.set(civilTimeZoneInput.value.trim(), source);
    civilTimeZoneError.textContent = '';
  } catch (error) {
    civilTimeZoneState.clear();
    civilTimeZoneError.textContent = error instanceof Error ? error.message : 'Civil time zone is invalid.';
  }
  renderCelestialAxis();
}

try {
  const browserTimeZone = browserResolvedTimeZone();
  civilTimeZoneInput.value = browserTimeZone.ianaName;
  civilTimeZoneState.set(browserTimeZone.ianaName, 'browser-intl');
} catch (error) {
  civilTimeZoneError.textContent = error instanceof Error ? error.message : 'Browser civil time zone is unavailable.';
}
civilTimeZoneInput.addEventListener('change', () => applyCivilTimeZone('user-selected'));

function applyObserver(source = 'manual observer entry'): void {
  try {
    observerState.set({
      latitudeDeg: observerLatitudeInput.valueAsNumber,
      longitudeDegEast: observerLongitudeInput.valueAsNumber,
      elevationMeters: observerElevationInput.valueAsNumber,
      horizontalDatum: 'WGS84',
      verticalDatum: 'MEAN_SEA_LEVEL',
      source,
    });
    observerError.textContent = '';
  } catch (error) {
    observerState.clear();
    observerError.textContent = error instanceof Error ? error.message : 'Observer values are invalid.';
  }
  renderCelestialAxis();
}

applyObserverButton.addEventListener('click', () => applyObserver());
clearObserverButton.addEventListener('click', () => {
  observerState.clear();
  observerError.textContent = '';
  renderCelestialAxis();
});
observerPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    observerLatitudeInput.value = button.dataset.observerLatitude ?? '';
    observerLongitudeInput.value = '0';
    observerElevationInput.value = '0';
    applyObserver(`generic ${button.dataset.observerLabel ?? 'observer'} validation preset`);
  });
});

function selectTime(utcIso: string, source: 'user-selected' | 'system-selected'): void {
  try {
    simulationClock.selectFrozen(createSimulationInstant(utcIso, source));
    observerError.textContent = '';
  } catch (error) {
    observerError.textContent = error instanceof Error ? error.message : 'Selected UTC instant is invalid.';
  }
  renderCelestialAxis();
}

timePresetButtons.forEach((button) => {
  button.addEventListener('click', () => selectTime(button.dataset.timeUtc ?? '', 'user-selected'));
});
useCurrentTimeButton.addEventListener('click', () => {
  try {
    simulationClock.selectFrozen(createSimulationInstant(new Date().toISOString(), 'system-selected'));
    simulationClock.startRealtime();
    realtimeCelestialUpdates.reset(performance.now());
    observerError.textContent = '';
  } catch (error) {
    observerError.textContent = error instanceof Error ? error.message : 'Current UTC instant is invalid.';
  }
  renderCelestialAxis();
});

[
  showAxisInput,
  showEarthCoreInput,
  showMarkersInput,
  showLabelsInput,
  showBelowHorizonInput,
  showCelestialEquatorInput,
  showLocalHorizonInput,
  showSolarSystemBodiesInput,
  showSolarDailyPathInput,
  showSolarHourNotchesInput,
  showSolarPathBelowHorizonInput,
  axisEyeModeSelect,
  equatorEyeModeSelect,
  horizonEyeModeSelect,
].forEach((control) => {
  control.addEventListener('change', renderCelestialAxis);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function applyEyePresentationForFrame(frame?: XRFrame): void {
  let views: readonly XRView[] | undefined;
  if (renderer.xr.isPresenting && frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const pose = referenceSpace ? frame.getViewerPose(referenceSpace) : null;
    views = pose?.views;
  }
  celestialAxis.applyEyePresentationViews(views, renderer.xr.isPresenting);
  celestialEquator.applyEyePresentationViews(views, renderer.xr.isPresenting);
  localHorizon.applyEyePresentationViews(views, renderer.xr.isPresenting);
  updateEyePresentationStatus();
}

renderer.setAnimationLoop((_time, frame) => {
  xrDiagnostics.frameEntry();
  let completed = false;
  try {
    xrDiagnostics.operation('realtime-update');
    const update = realtimeCelestialUpdates.advance(_time, simulationClock);
    if (update.shouldRefreshScientificState) renderCelestialAxis();
    xrDiagnostics.operation('eye-presentation');
    applyEyePresentationForFrame(frame);
    xrDiagnostics.operation('desktop-controls');
    if (!renderer.xr.isPresenting) controls.update();
    xrDiagnostics.operation('renderer.render');
    renderer.render(scene, camera);
    xrDiagnostics.operation('frame-complete');
    completed = true;
  } finally {
    xrDiagnostics.frameCompletion(completed);
    xrDiagnostics.flushPanel();
  }
});

window.addEventListener('pagehide', () => {
  celestialAxis.dispose();
  celestialEquator.dispose();
  localHorizon.dispose();
  solarSystemBodies.dispose();
  solarDailyPath.dispose();
  xrDiagnostics.dispose();
}, { once: true });

async function initializeCapabilityState(): Promise<void> {
  renderState(checkingState);
  const state = await detectImmersiveAr({
    isSecureContext: window.isSecureContext,
    xr: xrApi,
  });
  renderState(state);
}

void initializeCapabilityState();
