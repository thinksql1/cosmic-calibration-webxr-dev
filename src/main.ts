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
import { createCelestialCoordinateGridGroup } from './scene/createCelestialCoordinateGridGroup';
import { createObserverOffsetGeocentricStudyGroup } from './scene/createObserverOffsetGeocentricStudyGroup';
import { createFiniteCoreParallaxExperimentGroup } from './scene/createFiniteCoreParallaxExperimentGroup';
import { createGeocentricCelestialStructureGroup } from './scene/createGeocentricCelestialStructureGroup';
import { createLocalHorizonGroup } from './scene/createLocalHorizonGroup';
import { createSolarSystemBodiesGroup } from './scene/createSolarSystemBodiesGroup';
import { createSolarDailyPathGroup } from './scene/createSolarDailyPathGroup';
import { createReferenceScene } from './scene/createReferenceScene';
import { createSimulationInstant } from './science/astronomy/time';
import {
  SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES,
  type SupportedPlanetBody,
} from './science/astronomy/types';
import { createScientificProviderRegistry } from './science/providers/scientificProviderRegistry';
import { SolarSystemBodyStateService } from './science/bodies/solarSystemBodyState';
import { SolarDailyPathService } from './science/temporal/solarDailyPath';
import { ScientificSnapshotService } from './science/snapshot/scientificSnapshotService';
import { GeographicCalibrationStateAdapter } from './science/state/geographicCalibrationState';
import { ObserverStateStore } from './science/state/observerState';
import {
  DEVELOPMENT_DEFAULT_OBSERVER_LOCATION,
  developmentObserverLocationInput,
} from './science/astronomy/developmentObserverLocation';
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
import { createCelestialCoordinateGridPresentationModel, DEFAULT_CELESTIAL_COORDINATE_GRID_DISPLAY_SETTINGS, type CelestialCoordinateGridDisplaySettings } from './presentation/celestialCoordinateGridPresentationModel';
import { createGeocentricCelestialStructurePresentation } from './presentation/geocentricCelestialStructurePresentation';
import {
  defaultObserverOffsetGeoStudySettings,
  parseObserverOffsetGeoStudyMode,
  selectedObserverOffsetGeoStudyComponents,
  type ObserverOffsetGeoStudyMode,
  type ObserverOffsetGeoStudySettings,
} from './presentation/observerOffsetGeocentricStudy';
import { createObserverOffsetGeocentricPresentation } from './presentation/observerOffsetGeocentricPresentation';
import {
  createFiniteCoreParallaxModel,
  finiteCoreParallaxDistancePreset,
  FINITE_CORE_PARALLAX_DISTANCE_PRESETS,
  FINITE_CORE_PARALLAX_MODE,
  FINITE_CORE_PARALLAX_NORMAL_DISTANCE_METERS,
  parseFiniteCoreParallaxLaunch,
  selectEarthCorePresentation,
  type FiniteCoreParallaxModel,
} from './presentation/finiteCoreParallaxExperiment';
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
  getPlanetLabelScaleDefinition,
  parsePlanetLabelScale,
  parsePlanetLabelStudyMode,
} from './presentation/planetLabelPresentation';
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
import { applyXrObjectIsolation } from './diagnostics/xrObjectIsolation';
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
const buildIdentifierElement = requireElement<HTMLParagraphElement>('#build-identifier');
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
const showCelestialGridInput = requireElement<HTMLInputElement>('#show-celestial-coordinate-grid');
const showDeclinationGridInput = requireElement<HTMLInputElement>('#show-declination-lines');
const showRightAscensionGridInput = requireElement<HTMLInputElement>('#show-right-ascension-lines');
const showLocalHorizonInput = requireElement<HTMLInputElement>('#show-local-horizon');
const showSolarSystemBodiesInput = requireElement<HTMLInputElement>('#show-solar-system-bodies');
const showPlanetLabelsInput = requireElement<HTMLInputElement>('#show-planet-labels');
const planetLabelStudyControls = requireElement<HTMLDetailsElement>('#planet-label-study-controls');
const planetLabelStudyModeSelect = requireElement<HTMLSelectElement>('#planet-label-study-mode');
const planetLabelScaleSelect = requireElement<HTMLSelectElement>('#planet-label-scale');
const planetBodyVisibilityInputs: Readonly<Record<SupportedPlanetBody, HTMLInputElement>> = Object.freeze({
  Mercury: requireElement<HTMLInputElement>('#show-planet-mercury'),
  Venus: requireElement<HTMLInputElement>('#show-planet-venus'),
  Mars: requireElement<HTMLInputElement>('#show-planet-mars'),
  Jupiter: requireElement<HTMLInputElement>('#show-planet-jupiter'),
  Saturn: requireElement<HTMLInputElement>('#show-planet-saturn'),
  Uranus: requireElement<HTMLInputElement>('#show-planet-uranus'),
  Neptune: requireElement<HTMLInputElement>('#show-planet-neptune'),
  Pluto: requireElement<HTMLInputElement>('#show-planet-pluto'),
});
const showSolarDailyPathInput = requireElement<HTMLInputElement>('#show-solar-daily-path');
const showSolarHourNotchesInput = requireElement<HTMLInputElement>('#show-solar-hour-notches');
const showSolarPathBelowHorizonInput = requireElement<HTMLInputElement>('#show-solar-path-below-horizon');
const geoStudyControls = requireElement<HTMLDetailsElement>('#geo-study-controls');
const geoStudyModeSelect = requireElement<HTMLSelectElement>('#geo-study-mode');
const geoStudyRadiusInput = requireElement<HTMLInputElement>('#geo-study-radius');
const geoStudySurfaceInput = requireElement<HTMLInputElement>('#geo-study-surface');
const geoStudyEarthInput = requireElement<HTMLInputElement>('#geo-study-earth');
const geoStudyTangentInput = requireElement<HTMLInputElement>('#geo-study-tangent');
const geoStudyAxesInput = requireElement<HTMLInputElement>('#geo-study-axes');
const geoStudyLabelsInput = requireElement<HTMLInputElement>('#geo-study-labels');
const geoStudyOpacityInput = requireElement<HTMLInputElement>('#geo-study-opacity');
const finiteCoreStudyControls = requireElement<HTMLDetailsElement>('#finite-core-study-controls');
const finiteCoreStudyModeSelect = requireElement<HTMLSelectElement>('#finite-core-study-mode');
const finiteCoreDistanceSelect = requireElement<HTMLSelectElement>('#finite-core-distance');
const finiteCoreDiagnostics = requireElement<HTMLUListElement>('#finite-core-study-diagnostics');
const axisEyeModeSelect = requireElement<HTMLSelectElement>('#axis-eye-mode');
const equatorEyeModeSelect = requireElement<HTMLSelectElement>('#equator-eye-mode');
const horizonEyeModeSelect = requireElement<HTMLSelectElement>('#horizon-eye-mode');
const eyePresentationStatus = requireElement<HTMLParagraphElement>('#eye-presentation-status');
const xrDiagnostics = createXrPerEyeDiagnostics();
const buildIdentifier = import.meta.env.VITE_BUILD_IDENTIFIER ?? 'development-local';
const queryStudyMode = parseObserverOffsetGeoStudyMode(window.location.search);
const finiteCoreLaunch = parseFiniteCoreParallaxLaunch(window.location.search);
const queryPlanetLabelStudyMode = parsePlanetLabelStudyMode(window.location.search);
planetLabelStudyControls.hidden = !(xrDiagnostics.enabled || queryPlanetLabelStudyMode !== 'baseline');
planetLabelStudyModeSelect.value = queryPlanetLabelStudyMode;
planetLabelScaleSelect.value = parsePlanetLabelScale(new URLSearchParams(window.location.search).get('labelScale'));
geoStudyControls.hidden = !(xrDiagnostics.enabled || queryStudyMode !== 'baseline');
geoStudyModeSelect.value = queryStudyMode;
const initialStudySettings = defaultObserverOffsetGeoStudySettings(queryStudyMode);
geoStudyRadiusInput.checked = initialStudySettings.showRadius;
geoStudySurfaceInput.checked = initialStudySettings.showSurfacePoint;
geoStudyEarthInput.checked = initialStudySettings.showEarthWireframe;
geoStudyTangentInput.checked = initialStudySettings.showTangentPlane;
geoStudyAxesInput.checked = initialStudySettings.showLocalAxes;
geoStudyLabelsInput.checked = initialStudySettings.showLabels;
geoStudyOpacityInput.value = String(initialStudySettings.opacity);
finiteCoreStudyControls.hidden = !(xrDiagnostics.enabled || finiteCoreLaunch.explicitlyRequested);
// The normal development scene deliberately uses the Quest-selected far proxy;
// explicit baseline remains available only for diagnostics/comparison.
finiteCoreStudyModeSelect.value = finiteCoreLaunch.mode === 'baseline' && finiteCoreLaunch.explicitlyRequested
  ? 'baseline'
  : FINITE_CORE_PARALLAX_MODE;
finiteCoreDistanceSelect.value = finiteCoreLaunch.enabled
  ? finiteCoreLaunch.distancePreset
  : 'far';
buildIdentifierElement.textContent = `Build: ${buildIdentifier}`;
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
if (finiteCoreLaunch.enabled) showCelestialGridInput.checked = true;
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
const celestialCoordinateGrid = createCelestialCoordinateGridGroup(
  (event, detail) => xrDiagnostics.record(event, detail),
);
const observerOffsetStudy = createObserverOffsetGeocentricStudyGroup(
  (event, detail) => xrDiagnostics.record(event, detail),
);
const finiteCoreParallaxExperiment = createFiniteCoreParallaxExperimentGroup(
  (event, detail) => xrDiagnostics.record(event, detail),
);
const geocentricCelestialStructure = createGeocentricCelestialStructureGroup(
  celestialAxis.group,
  celestialEquator.group,
  celestialCoordinateGrid.group,
  observerOffsetStudy.group,
);
const localHorizon = createLocalHorizonGroup(LOCAL_HORIZON_SAMPLE_COUNT);
const solarSystemBodies = createSolarSystemBodiesGroup(
  (event, detail) => xrDiagnostics.record(event, detail),
);
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
geographicReference.add(finiteCoreParallaxExperiment.group);
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
xrDiagnostics.instrument(scene);

let diagnosticIsolationSignature = '';
function enforceEarthCoreToggle(): void {
  if (showEarthCoreInput.checked) return;
  const scientificMarker = celestialAxis.group.getObjectByName('modeled-earth-core-marker');
  const finiteProxy = finiteCoreParallaxExperiment.group.getObjectByName('finite-core-holographic-proxy');
  if (scientificMarker) scientificMarker.visible = false;
  if (finiteProxy) finiteProxy.visible = false;
  finiteCoreParallaxExperiment.group.visible = false;
}

function applyDiagnosticObjectIsolation(): void {
  if (!xrDiagnostics.enabled) {
    enforceEarthCoreToggle();
    solarSystemBodies.enforceVisibilityControls();
    return;
  }
  // Controller feedback objects are added only after XR session activation;
  // instrumentation is idempotent and picks up those late candidates.
  xrDiagnostics.instrument(scene);
  const result = applyXrObjectIsolation(scene, xrDiagnostics.isolation);
  const signature = `${result.stateId}|${result.matchedObjectNames.join(',')}`;
  enforceEarthCoreToggle();
  // Diagnostics may isolate descendants, but explicit body/label controls remain authoritative.
  solarSystemBodies.enforceVisibilityControls();
  if (signature === diagnosticIsolationSignature) return;
  diagnosticIsolationSignature = signature;
  xrDiagnostics.record('object-isolation.state', [
    `id=${result.stateId}`,
    `requested=${result.requestedObjectNames.join(',') || 'preset-behavior'}`,
    `matched=${result.matchedObjectNames.join(',') || 'none'}`,
  ].join('|'));
}

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
let currentFiniteCoreModel: FiniteCoreParallaxModel | undefined;
let lastFiniteCoreDiagnosticUpdateMs = Number.NEGATIVE_INFINITY;
let observerLocationEntry: 'development-default' | 'user-edited' = 'development-default';

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
      grid: celestialCoordinateGrid.group,
    },
  );
}

function currentAxisDisplaySettings(): EarthAxisDisplaySettings {
  return Object.freeze({
    ...DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
    showAxis: showAxisInput.checked,
    // The scientific homogeneous marker is retained only for the explicit
    // comparison baseline. Ordinary development uses the finite proxy below.
    showEarthCore: selectedEarthCorePresentation() === 'scientific-marker',
    showMarkers: showMarkersInput.checked,
    showLabels: showLabelsInput.checked,
    showBelowHorizonSegment: showBelowHorizonInput.checked,
  });
}

function finiteCoreExperimentEnabled(): boolean {
  return selectedEarthCorePresentation() === 'finite-proxy';
}

function selectedEarthCorePresentation(): ReturnType<typeof selectEarthCorePresentation> {
  return selectEarthCorePresentation(showEarthCoreInput.checked, finiteCoreStudyModeSelect.value);
}

function finiteCoreExperimentDistanceMeters(): number {
  if (finiteCoreStudyModeSelect.value === FINITE_CORE_PARALLAX_MODE &&
      finiteCoreDistanceSelect.value === 'far') {
    return FINITE_CORE_PARALLAX_NORMAL_DISTANCE_METERS;
  }
  return FINITE_CORE_PARALLAX_DISTANCE_PRESETS[
    finiteCoreParallaxDistancePreset(finiteCoreDistanceSelect.value)
  ];
}

function currentEquatorDisplaySettings(): CelestialEquatorDisplaySettings {
  return Object.freeze({
    ...DEFAULT_CELESTIAL_EQUATOR_DISPLAY_SETTINGS,
    showEquator: showCelestialEquatorInput.checked,
  });
}

function currentGridDisplaySettings(): CelestialCoordinateGridDisplaySettings {
  return Object.freeze({
    ...DEFAULT_CELESTIAL_COORDINATE_GRID_DISPLAY_SETTINGS,
    showGrid: showCelestialGridInput.checked,
    showDeclinationLines: showDeclinationGridInput.checked,
    showRightAscensionLines: showRightAscensionGridInput.checked,
  });
}

function currentStudyDisplaySettings(): ObserverOffsetGeoStudySettings {
  return Object.freeze({
    mode: geoStudyModeSelect.value as ObserverOffsetGeoStudyMode,
    showRadius: geoStudyRadiusInput.checked,
    showSurfacePoint: geoStudySurfaceInput.checked,
    showEarthWireframe: geoStudyEarthInput.checked,
    showTangentPlane: geoStudyTangentInput.checked,
    showLocalAxes: geoStudyAxesInput.checked,
    showLabels: geoStudyLabelsInput.checked,
    opacity: Number(geoStudyOpacityInput.value),
  });
}

function currentSolarSystemBodyDisplaySettings(): SolarSystemBodyDisplaySettings {
  const planetLabelStudyMode = parsePlanetLabelStudyMode(`?labelStudy=${planetLabelStudyModeSelect.value}`);
  return Object.freeze({
    ...DEFAULT_SOLAR_SYSTEM_BODY_DISPLAY_SETTINGS,
    showBodies: showSolarSystemBodiesInput.checked,
    enabledPlanetBodies: SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES.filter(
      (body) => planetBodyVisibilityInputs[body].checked,
    ),
    showPlanetLabels: showPlanetLabelsInput.checked,
    planetLabelStudyMode,
    planetLabelScale: parsePlanetLabelScale(planetLabelScaleSelect.value),
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
    `Build ${buildIdentifier}`,
    ...view.diagnostics,
    eyeModeDiagnostic('Axis/poles', celestialAxis.getEyePresentationDiagnostics()),
    eyeModeDiagnostic('Celestial equator', celestialEquator.getEyePresentationDiagnostics()),
    `Celestial grid: ${celestialCoordinateGrid.group.userData.activeLineCount ?? 0} active lines; longitude reference ${celestialCoordinateGrid.group.userData.longitudeReference ?? 'not-ready'}`,
    `Observer-offset study: ${currentStudyDisplaySettings().mode}; ${selectedObserverOffsetGeoStudyComponents(currentStudyDisplaySettings()).join(', ') || 'baseline only'}`,
    `Earth Core toggle ${showEarthCoreInput.checked ? 'ON' : 'OFF'}; selected representation ${selectedEarthCorePresentation()}; configured proxy distance ${finiteCoreExperimentDistanceMeters().toFixed(1)} m`,
    `Configured observer ${observerLatitudeInput.value}°, ${observerLongitudeInput.value}° east-positive, ${observerElevationInput.value} m MSL (${observerLocationEntry === 'development-default' ? 'development defaults' : 'user-edited this session'}; no persistence)`,
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
    celestialCoordinateGrid.clear();
    observerOffsetStudy.clear();
    finiteCoreParallaxExperiment.clear('scientific state not ready');
    currentFiniteCoreModel = undefined;
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
  const gridSettings = currentGridDisplaySettings();
  const gridModel = createCelestialCoordinateGridPresentationModel(
    result.snapshot,
    gridSettings,
    geocentricPresentation,
  );
  celestialCoordinateGrid.update(gridModel, gridSettings);
  const observerOffsetContract = createObserverOffsetGeocentricPresentation(geocentricPresentation);
  if (observerOffsetContract.kind === 'not-ready') {
    observerOffsetStudy.clear();
    finiteCoreParallaxExperiment.clear(`observer-offset contract ${observerOffsetContract.reason}`);
    currentFiniteCoreModel = undefined;
    celestialDiagnostics.append(Object.assign(document.createElement('li'), {
      textContent: `Observer-offset study suppressed: ${observerOffsetContract.reason}.`,
    }));
  } else {
    const studySettings = currentStudyDisplaySettings();
    observerOffsetStudy.update(observerOffsetContract, studySettings);
    const finiteCoreModel = createFiniteCoreParallaxModel(
      observerOffsetContract,
      finiteCoreExperimentDistanceMeters(),
    );
    finiteCoreParallaxExperiment.update(finiteCoreModel, finiteCoreExperimentEnabled());
    currentFiniteCoreModel = finiteCoreModel.kind === 'FINITE_CORE_PARALLAX_MODEL'
      ? finiteCoreModel
      : undefined;
    const coreVisualNames = directCoreVisualObjectNames();
    const studyDiagnostics = observerOffsetStudy.getDiagnostics();
    celestialDiagnostics.append(...[
      `Direct Earth-core visuals ${coreVisualNames.length}: ${coreVisualNames.join(', ') || 'none'}; finite proxy ${isVisibleInScene(finiteCoreParallaxExperiment.group.getObjectByName('finite-core-holographic-proxy')) ? 'visible' : 'hidden'}; scientific marker ${isVisibleInScene(celestialAxis.group.getObjectByName('modeled-earth-core-marker')) ? 'visible' : 'hidden'}`,
      `Observer-offset study ${studySettings.mode}; Earth/grid reference ratio ${(observerOffsetContract.referenceEarthSphereRadiusMeters / observerOffsetContract.scientificCelestialGridRadiusMeters).toFixed(2)}`,
      `Study observer-to-core ${observerOffsetContract.scientificObserverToCoreDistanceMeters.toFixed(1)} m; reference Earth radius ${observerOffsetContract.referenceEarthSphereRadiusMeters.toFixed(1)} m`,
      `Study core anchor (${observerOffsetContract.earthCoreAnchor.x.toFixed(5)}, ${observerOffsetContract.earthCoreAnchor.y.toFixed(5)}, ${observerOffsetContract.earthCoreAnchor.z.toFixed(5)}, w=${observerOffsetContract.earthCoreAnchor.w.toExponential(3)}); observer origin (${observerOffsetContract.scientificObserver.x.toFixed(1)}, ${observerOffsetContract.scientificObserver.y.toFixed(1)}, ${observerOffsetContract.scientificObserver.z.toFixed(1)})`,
      `Study reference-surface anchor (${observerOffsetContract.referenceEarthSphereSurfaceAnchor.x.toFixed(5)}, ${observerOffsetContract.referenceEarthSphereSurfaceAnchor.y.toFixed(5)}, ${observerOffsetContract.referenceEarthSphereSurfaceAnchor.z.toFixed(5)}, w=${observerOffsetContract.referenceEarthSphereSurfaceAnchor.w.toExponential(3)}); grid radius ${observerOffsetContract.scientificCelestialGridRadiusMeters.toFixed(1)} m`,
      `Study observer-to-core vector (${observerOffsetContract.scientificObserverToCore.x.toFixed(1)}, ${observerOffsetContract.scientificObserverToCore.y.toFixed(1)}, ${observerOffsetContract.scientificObserverToCore.z.toFixed(1)}); ellipsoid/reference-sphere offset ${observerOffsetContract.ellipsoidToReferenceSphereOffsetMeters.toFixed(1)} m`,
      `Study tangent normal (${observerOffsetContract.localUp.x.toFixed(3)}, ${observerOffsetContract.localUp.y.toFixed(3)}, ${observerOffsetContract.localUp.z.toFixed(3)}); objects ${(studyDiagnostics.activeObjectNames as readonly string[] | undefined)?.join(', ') || 'none'}`,
      `Study center/radius errors: Earth sphere center 0 m; surface reference radius 0 m; tangent basis orthogonality 0 within contract tolerance; GPU component maximum ${observerOffsetContract.maximumUploadedComponentMagnitude.toFixed(6)}`,
    finiteCoreModel.kind === 'FINITE_CORE_PARALLAX_MODEL'
        ? `Finite core proxy direction (${finiteCoreModel.scientificObserverToCoreDirection.x.toFixed(5)}, ${finiteCoreModel.scientificObserverToCoreDirection.y.toFixed(5)}, ${finiteCoreModel.scientificObserverToCoreDirection.z.toFixed(5)}); local distance ${finiteCoreModel.proxyDistanceMeters.toFixed(1)} m; scientific distance ${finiteCoreModel.scientificObserverToCoreDistanceMeters.toFixed(1)} m; proxy ${finiteCoreExperimentEnabled() ? 'world-locked and selected' : 'not submitted'}`
        : `Finite core proxy suppressed: ${finiteCoreModel.reason}`,
    ].map((detail) => Object.assign(document.createElement('li'), { textContent: detail })));
  }
  const bodyState = solarSystemBodyStateService.capture(result.snapshot);
  const bodyModel = createSolarSystemBodyPresentationModel(
    result.snapshot,
    bodyState,
    currentSolarSystemBodyDisplaySettings(),
  );
  solarSystemBodies.update(bodyModel);
  const bodyDiagnostics = solarSystemBodies.getDiagnostics();
  const planetLabelScale = getPlanetLabelScaleDefinition(bodyModel.labels[0]?.scale ?? parsePlanetLabelScale(planetLabelScaleSelect.value));
  celestialDiagnostics.append(...[
    `Apparent-body provider ${bodyModel.provenance.provider} ${bodyModel.provenance.providerVersion}; ${bodyModel.provenance.sourceFrame} → ${bodyModel.provenance.outputFrame}; profile ${bodyModel.provenance.correctionProfile}`,
    `Planet Labels ${showPlanetLabelsInput.checked ? 'ON' : 'OFF'}; study ${bodyModel.planetLabelStudyMode}; preset ${planetLabelScale.id} (${planetLabelScale.displayName}); dimensions ${planetLabelScale.dimensionsMeters[0].toFixed(2)} × ${planetLabelScale.dimensionsMeters[1].toFixed(2)} m; multiplier ${planetLabelScale.relativeToPreviousLarge}× previous Large; configured ${bodyDiagnostics.configuredLabelObjectNames.length}; submitted ${bodyDiagnostics.submittedLabelObjectNames.length}; visible ${bodyDiagnostics.activeLabelObjectNames.length}; render-callback observed ${bodyDiagnostics.renderedLabelObjectNames.length}`,
    `Enabled planets ${currentSolarSystemBodyDisplaySettings().enabledPlanetBodies?.join(', ') || 'none'}; provider catalog ${bodyState.provenance.identity.supportedBodies.join(', ')}; selected UTC ${result.snapshot.clock.instant.utcIso}; observer ${result.snapshot.observer.observer.latitudeDeg.toFixed(4)}, ${result.snapshot.observer.observer.longitudeDegEast.toFixed(4)}, ${result.snapshot.observer.observer.elevationMeters.toFixed(0)} m MSL`,
    `Body markers ${bodyDiagnostics.activeMarkerObjectNames.join(', ') || 'none'}; labels ${bodyDiagnostics.activeLabelObjectNames.join(', ') || 'none'}; suppressed markers ${bodyDiagnostics.suppressedMarkerObjectNames.join(', ') || 'none'}; suppressed labels ${bodyDiagnostics.suppressedLabelObjectNames.join(', ') || 'none'}; label-anchor directional error 0`,
    ...Object.entries(bodyDiagnostics.labelDetails).map(([body, detail]) => {
      const placement = detail.placement;
      return `${body} label: created=${detail.objectCreated}; texture=${detail.textureWidth}x${detail.textureHeight}; alphaPixels=${detail.visibleAlphaPixelCount}; spriteScale=${detail.worldScale.map((value) => value.toFixed(2)).join('×')} m; material=${detail.materialType}; opacity=${detail.opacity}; transparent=${detail.transparent}; depthTest=${detail.depthTest}; depthWrite=${detail.depthWrite}; renderOrder=${detail.renderOrder}; frustumCulled=${detail.frustumCulled}; anchor=${placement ? placement.anchor.toArray().map((value) => value.toFixed(4)).join(',') : 'suppressed'}; offset=${placement ? placement.tangentOffset.toArray().map((value) => value.toFixed(4)).join(',') : 'suppressed'}; projected=${Object.entries(detail.projectedCentersNdc).map(([eye, value]) => `${eye}:${value.map((component) => component.toFixed(4)).join(',')}`).join(';') || 'not-rendered'}; disparity=${detail.stereoDisparityNdc?.toExponential(3) ?? 'pending'}; cameraDistance=${detail.cameraDistanceMeters?.toFixed(3) ?? 'pending'}; callbackErrors=${detail.callbackErrorCount}; reason=${detail.suppressionReason ?? 'none'}`;
    }),
    ...bodyModel.markers.map((marker) => `${marker.body}: ENU (${marker.directionEnu.east.toFixed(4)}, ${marker.directionEnu.north.toFixed(4)}, ${marker.directionEnu.up.toFixed(4)}) → application (${marker.directionApplication.x.toFixed(4)}, ${marker.directionApplication.y.toFixed(4)}, ${marker.directionApplication.z.toFixed(4)}); marker ${marker.visible ? 'enabled' : 'disabled'}; finite ${Number.isFinite(marker.directionApplication.x) && Number.isFinite(marker.directionApplication.y) && Number.isFinite(marker.directionApplication.z)}`),
  ].map((detail) => Object.assign(document.createElement('li'), { textContent: detail })));
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
      `Celestial coordinate grid: ${gridModel.lines.filter((line) => line.family === 'declination').length} closed declination circles; ${gridModel.lines.filter((line) => line.family === 'right-ascension').length} open pole-to-pole right-ascension meridians`,
      'Grid longitude is a deterministic local canonical reference, not a claimed sidereal or vernal-equinox alignment.',
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
    celestialCoordinateGrid.applyEyePresentationViews();
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
    const input = source === 'development default location'
      ? developmentObserverLocationInput(source)
      : {
        latitudeDeg: observerLatitudeInput.valueAsNumber,
        longitudeDegEast: observerLongitudeInput.valueAsNumber,
        elevationMeters: observerElevationInput.valueAsNumber,
        horizontalDatum: 'WGS84' as const,
        verticalDatum: 'MEAN_SEA_LEVEL' as const,
        source,
      };
    observerState.set(input);
    observerError.textContent = '';
  } catch (error) {
    observerState.clear();
    observerError.textContent = error instanceof Error ? error.message : 'Observer values are invalid.';
  }
  renderCelestialAxis();
}

function isVisibleInScene(object: THREE.Object3D | undefined): boolean {
  let current = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent ?? undefined;
  }
  return Boolean(object);
}

function directCoreVisualObjectNames(): readonly string[] {
  const candidates = [
    celestialAxis.group.getObjectByName('modeled-earth-core-marker'),
    finiteCoreParallaxExperiment.group.getObjectByName('finite-core-holographic-proxy'),
  ];
  return Object.freeze(candidates
    .filter((candidate): candidate is THREE.Object3D => isVisibleInScene(candidate))
    .map((candidate) => candidate.name));
}

function setDevelopmentObserverLocationInputs(): void {
  observerLatitudeInput.value = String(DEVELOPMENT_DEFAULT_OBSERVER_LOCATION.latitudeDeg);
  observerLongitudeInput.value = String(DEVELOPMENT_DEFAULT_OBSERVER_LOCATION.longitudeDegEast);
  observerElevationInput.value = String(DEVELOPMENT_DEFAULT_OBSERVER_LOCATION.elevationMeters);
  observerLocationEntry = 'development-default';
}

setDevelopmentObserverLocationInputs();
applyObserver('development default location');

applyObserverButton.addEventListener('click', () => applyObserver());
clearObserverButton.addEventListener('click', () => {
  observerState.clear();
  observerError.textContent = '';
  renderCelestialAxis();
});
observerPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    observerLocationEntry = 'user-edited';
    observerLatitudeInput.value = button.dataset.observerLatitude ?? '';
    observerLongitudeInput.value = '0';
    observerElevationInput.value = '0';
    applyObserver(`generic ${button.dataset.observerLabel ?? 'observer'} validation preset`);
  });
});
[observerLatitudeInput, observerLongitudeInput, observerElevationInput].forEach((input) => {
  input.addEventListener('input', () => { observerLocationEntry = 'user-edited'; });
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
  showCelestialGridInput,
  showDeclinationGridInput,
  showRightAscensionGridInput,
  showLocalHorizonInput,
  showSolarSystemBodiesInput,
  showPlanetLabelsInput,
  planetLabelStudyModeSelect,
  planetLabelScaleSelect,
  ...Object.values(planetBodyVisibilityInputs),
  showSolarDailyPathInput,
  showSolarHourNotchesInput,
  showSolarPathBelowHorizonInput,
  geoStudyRadiusInput,
  geoStudySurfaceInput,
  geoStudyEarthInput,
  geoStudyTangentInput,
  geoStudyAxesInput,
  geoStudyLabelsInput,
  geoStudyOpacityInput,
  finiteCoreDistanceSelect,
  axisEyeModeSelect,
  equatorEyeModeSelect,
  horizonEyeModeSelect,
].forEach((control) => {
  control.addEventListener('change', renderCelestialAxis);
});

geoStudyModeSelect.addEventListener('change', () => {
  const mode = geoStudyModeSelect.value as ObserverOffsetGeoStudyMode;
  const defaults = defaultObserverOffsetGeoStudySettings(mode);
  geoStudyRadiusInput.checked = defaults.showRadius;
  geoStudySurfaceInput.checked = defaults.showSurfacePoint;
  geoStudyEarthInput.checked = defaults.showEarthWireframe;
  geoStudyTangentInput.checked = defaults.showTangentPlane;
  geoStudyAxesInput.checked = defaults.showLocalAxes;
  const url = new URL(window.location.href);
  url.searchParams.set('geoStudy', mode);
  window.history.replaceState({}, '', url);
  renderCelestialAxis();
});

finiteCoreStudyModeSelect.addEventListener('change', () => {
  const finiteSelected = finiteCoreStudyModeSelect.value === FINITE_CORE_PARALLAX_MODE;
  if (finiteSelected) showCelestialGridInput.checked = true;
  if (!finiteSelected) finiteCoreDiagnostics.replaceChildren();
  const url = new URL(window.location.href);
  if (finiteSelected) {
    url.searchParams.set('coreStudy', FINITE_CORE_PARALLAX_MODE);
    url.searchParams.set('coreDistance', finiteCoreParallaxDistancePreset(finiteCoreDistanceSelect.value));
  } else {
    url.searchParams.set('coreStudy', 'baseline');
    url.searchParams.delete('coreDistance');
  }
  window.history.replaceState({}, '', url);
  renderCelestialAxis();
});

finiteCoreDistanceSelect.addEventListener('change', () => {
  const preset = finiteCoreParallaxDistancePreset(finiteCoreDistanceSelect.value);
  finiteCoreDistanceSelect.value = preset;
  if (finiteCoreStudyModeSelect.value === FINITE_CORE_PARALLAX_MODE) {
    const url = new URL(window.location.href);
    url.searchParams.set('coreDistance', preset);
    window.history.replaceState({}, '', url);
  }
  renderCelestialAxis();
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
  celestialCoordinateGrid.applyEyePresentationViews(views, renderer.xr.isPresenting);
  localHorizon.applyEyePresentationViews(views, renderer.xr.isPresenting);
  updateEyePresentationStatus();
}

function fixed(value: readonly number[], digits = 4): string {
  return `(${value.map((component) => component.toFixed(digits)).join(', ')})`;
}

function updateFiniteCoreProjectionDiagnostics(timeMs: number): void {
  if (!finiteCoreExperimentEnabled()) return;
  const cameras: readonly THREE.Camera[] = renderer.xr.isPresenting
    ? renderer.xr.getCamera().cameras
    : [camera];
  const state = finiteCoreParallaxExperiment.sampleProjection(cameras);
  if (!xrDiagnostics.enabled || timeMs - lastFiniteCoreDiagnosticUpdateMs < 250) return;
  lastFiniteCoreDiagnosticUpdateMs = timeMs;
  const model = currentFiniteCoreModel;
  const lines = [
    `Build ${buildIdentifier}`,
    `Finite proxy ${state.enabled ? 'enabled' : 'suppressed'}; distance ${model?.proxyDistanceMeters.toFixed(1) ?? 'n/a'} m; radius ${model?.proxyRadiusMeters.toFixed(2) ?? 'n/a'} m`,
    `Scientific observer-to-core direction ${model ? fixed([model.scientificObserverToCoreDirection.x, model.scientificObserverToCoreDirection.y, model.scientificObserverToCoreDirection.z], 6) : 'not-ready'}`,
    `Scientific core distance ${model?.scientificObserverToCoreDistanceMeters.toFixed(1) ?? 'not-ready'} m (not used as proxy depth)`,
    `Proxy local ${fixed(state.proxyLocalPosition)}; world ${fixed(state.proxyWorldPosition)}; finite ${state.finiteState}`,
    `Proxy local rotation ${fixed(state.proxyLocalRotation, 5)}; scale ${fixed(state.proxyLocalScale, 3)}; world matrix finite ${state.proxyWorldMatrix.every(Number.isFinite)}`,
    `Parent hierarchy ${state.proxyParentHierarchy.join(' → ')}`,
    `Draw objects ${state.submittedDrawObjectNames.join(', ') || 'none'}; suppressed ${state.suppressedComponentNames.join(', ') || 'none'}${state.suppressionReason ? ` (${state.suppressionReason})` : ''}`,
    `Camera translation ${fixed(state.cameraTranslation, 5)}; projected proxy change ${fixed(state.projectedProxyChange, 6)}`,
    `Stereo disparity NDC-x ${state.stereoDisparityNdcX?.toFixed(7) ?? 'not available in mono'}`,
    ...state.projectionSamples.map((sample) =>
      `${sample.eye} eye/camera ${fixed(sample.cameraWorldPosition, 5)} → proxy NDC ${fixed(sample.proxyNdc, 6)}`),
    `Celestial references: ${celestialCoordinateGrid.group.children.filter((object) => object.visible).map((object) => object.name).join(', ') || 'none visible'}; geometry remains under ${geocentricCelestialStructure.name}`,
  ];
  finiteCoreDiagnostics.replaceChildren(...lines.map((line) =>
    Object.assign(document.createElement('li'), { textContent: line })));
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
    xrDiagnostics.operation('object-isolation');
    applyDiagnosticObjectIsolation();
    xrDiagnostics.operation('renderer.render');
    renderer.render(scene, camera);
    xrDiagnostics.operation('finite-core-projection-diagnostics');
    updateFiniteCoreProjectionDiagnostics(_time);
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
  celestialCoordinateGrid.dispose();
  finiteCoreParallaxExperiment.dispose();
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
