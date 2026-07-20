import type { EnuUnitDirection } from '../science/astronomy/types';
import type { ScientificSnapshot, ScientificSnapshotBuildResult } from '../science/snapshot/scientificSnapshot';
import {
  type ApplicationBasisDirection,
} from './mapEnuToApplicationBasis';
import {
  createGeocentricCelestialStructurePresentation,
  type GeocentricCelestialStructurePresentation,
} from './geocentricCelestialStructurePresentation';

export const CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS = 10_000_000_000_000;
export const EARTH_AXIS_LINEAR_SCENE_FAR_METERS = 100;
export const EARTH_CORE_MARKER_DIAMETER_PIXELS = 18;
export const CELESTIAL_POLE_MARKER_DIAMETER_PIXELS = 18;
export const CELESTIAL_POLE_LABEL_WIDTH_PIXELS = 88;
export const CELESTIAL_POLE_LABEL_HEIGHT_PIXELS = 42;
const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600;

function convergenceUpperBoundArcseconds(observerToCoreDistanceMeters: number): number {
  return Math.atan2(
    observerToCoreDistanceMeters,
    CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS - observerToCoreDistanceMeters,
  ) * RADIANS_TO_ARCSECONDS;
}

export type BelowHorizonDisplayMode = 'full-axis' | 'above-horizon-emphasis';

export interface EarthAxisDisplaySettings {
  readonly showAxis: boolean;
  readonly showEarthCore: boolean;
  readonly showMarkers: boolean;
  readonly showLabels: boolean;
  readonly showBelowHorizonSegment: boolean;
  readonly belowHorizonMode: BelowHorizonDisplayMode;
}

export const DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS: EarthAxisDisplaySettings = Object.freeze({
  showAxis: true,
  showEarthCore: true,
  showMarkers: true,
  showLabels: true,
  showBelowHorizonSegment: true,
  belowHorizonMode: 'above-horizon-emphasis',
});

export interface PresentationPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface EarthAxisEndpointPresentation {
  readonly pole: 'NCP' | 'SCP';
  readonly pointKind: 'PROJECTIVE_DIRECTION_AT_INFINITY';
  readonly directionEnu: EnuUnitDirection;
  readonly directionApplication: ApplicationBasisDirection;
  readonly diagnosticFiniteProxyPosition: PresentationPoint;
  readonly diagnosticProxyDistanceFromCoreMeters: number;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number | null;
  readonly horizonRelation: 'above' | 'on' | 'below';
  readonly segmentVisible: boolean;
  readonly segmentOpacity: number;
  readonly markerVisible: boolean;
  readonly labelVisible: boolean;
}

export interface EarthAxisSpindlePresentation {
  readonly kind: 'RIGID_EARTH_ROTATIONAL_AXIS_SPINDLE';
  readonly validity: 'VALIDATED';
  readonly lineContract: 'ONE_CORE_ONE_DIRECTION_ONE_EXACT_ANTIPODE';
  readonly renderTopology: 'ONE_PROJECTIVELY_CLIPPED_SCREEN_SPACE_SPINDLE';
  readonly coordinateFrameIdentity: 'APPLICATION_BASIS_UNCALIBRATED_BELOW_GEOGRAPHIC_PARENT';
  readonly earthCore: PresentationPoint;
  readonly northDirection: ApplicationBasisDirection;
  readonly southDirection: ApplicationBasisDirection;
  readonly displayExtentMeters: number;
  readonly calibrationRevision: number;
  readonly acceptedCalibrationRevision: number | null;
  readonly observerRevision: number;
  readonly provenance: {
    readonly model: 'IAU_P03_PRECESSION_ONLY';
    readonly provider: string;
    readonly providerVersion: string;
    readonly simulationInstantUtc: string;
  };
}

export interface EarthAxisPresentationModel {
  readonly kind: 'ready';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly terminology: 'MEAN_POLE_OF_DATE';
  readonly precisionTier: 'TIER_1';
  readonly presentationKind: 'GEOCENTRIC_WORLD_SCALE_EARTH_CORE_AXIS';
  readonly poleTopology: 'ANTIPODAL_PROJECTIVE_DIRECTIONS_AT_INFINITY';
  readonly renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES';
  readonly depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY';
  readonly gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES';
  readonly observerSurfaceOrigin: PresentationPoint;
  readonly earthCore: PresentationPoint;
  readonly earthCoreVisible: boolean;
  readonly earthCoreMarkerDiameterPixels: number;
  readonly poleMarkerDiameterPixels: number;
  readonly poleLabelWidthPixels: number;
  readonly poleLabelHeightPixels: number;
  readonly poleRenderConvergenceUpperBoundArcseconds: number;
  readonly observerToCoreDistanceMeters: number;
  readonly observerToAxisDistanceMeters: number;
  readonly geocentricStructure: GeocentricCelestialStructurePresentation;
  readonly spindle: EarthAxisSpindlePresentation;
  readonly north: EarthAxisEndpointPresentation;
  readonly south: EarthAxisEndpointPresentation;
  readonly snapshotIdentity: {
    readonly cacheKey: string;
    readonly creationSequence: number;
    readonly observerRevision: number;
    readonly timeRevision: number;
    readonly calibrationRevision: number;
    readonly acceptedCalibrationRevision: number | null;
  };
}

export interface EarthAxisStatusViewModel {
  readonly kind: 'ready' | 'not-ready';
  readonly status: string;
  readonly detail: string;
  readonly limitations: string;
  readonly diagnostics: readonly string[];
}

function validateSettings(settings: EarthAxisDisplaySettings): void {
  if (
    settings.belowHorizonMode !== 'full-axis' &&
    settings.belowHorizonMode !== 'above-horizon-emphasis'
  ) {
    throw new Error('Unsupported below-horizon Earth-axis display mode.');
  }
}

function opacityFor(
  relation: EarthAxisEndpointPresentation['horizonRelation'],
  mode: BelowHorizonDisplayMode,
): number {
  if (mode === 'full-axis') return 0.72;
  if (relation === 'below') return 0.46;
  if (relation === 'on') return 0.62;
  return 0.74;
}

function addScaled(
  origin: PresentationPoint,
  direction: ApplicationBasisDirection,
  scale: number,
): PresentationPoint {
  return Object.freeze({
    x: origin.x + direction.x * scale,
    y: origin.y + direction.y * scale,
    z: origin.z + direction.z * scale,
  });
}

function endpoint(
  pole: EarthAxisEndpointPresentation['pole'],
  source: ScientificSnapshot['observerHorizontalEarthAxis']['north'],
  directionEnu: EnuUnitDirection,
  directionApplication: ApplicationBasisDirection,
  earthCore: PresentationPoint,
  settings: EarthAxisDisplaySettings,
): EarthAxisEndpointPresentation {
  const belowVisible = source.horizonRelation !== 'below' || settings.showBelowHorizonSegment;
  return Object.freeze({
    pole,
    pointKind: 'PROJECTIVE_DIRECTION_AT_INFINITY',
    directionEnu,
    directionApplication,
    diagnosticFiniteProxyPosition: addScaled(
      earthCore,
      directionApplication,
      CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS,
    ),
    diagnosticProxyDistanceFromCoreMeters: CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS,
    altitudeDeg: source.altitudeDeg,
    azimuthDeg: source.azimuthDeg,
    horizonRelation: source.horizonRelation,
    segmentVisible: settings.showAxis && belowVisible,
    segmentOpacity: opacityFor(source.horizonRelation, settings.belowHorizonMode),
    markerVisible: settings.showMarkers,
    labelVisible: settings.showLabels,
  });
}

/**
 * Converts the snapshot's metric geocentric placement and projective pole
 * directions once. Geographic yaw is intentionally absent: the calibrated
 * geographic parent owns that room transform.
 */
export function createEarthAxisPresentationModel(
  snapshot: ScientificSnapshot,
  settings: EarthAxisDisplaySettings = DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
  geocentricStructure: GeocentricCelestialStructurePresentation =
    createGeocentricCelestialStructurePresentation(snapshot),
): EarthAxisPresentationModel {
  validateSettings(settings);
  const placement = snapshot.observerGeocentricEarthAxis;
  if (
    geocentricStructure.snapshotCacheKey !== snapshot.cacheKey ||
    geocentricStructure.validity !== 'VALIDATED'
  ) {
    throw new Error('Earth-axis presentation requires the matching validated geocentric structure.');
  }
  const observerSurfaceOrigin = geocentricStructure.observerSurfaceOrigin;
  const earthCore = geocentricStructure.earthCore;
  const northDirectionEnu = geocentricStructure.northAxisDirectionEnu;
  const southDirectionEnu = geocentricStructure.southAxisDirectionEnu;
  const northDirectionApplication = geocentricStructure.northAxisDirection;
  const southDirectionApplication = geocentricStructure.southAxisDirection;
  const convergenceBound = convergenceUpperBoundArcseconds(
    placement.observerToCoreDistanceMeters,
  );
  const spindle: EarthAxisSpindlePresentation = Object.freeze({
    kind: 'RIGID_EARTH_ROTATIONAL_AXIS_SPINDLE',
    validity: 'VALIDATED',
    lineContract: 'ONE_CORE_ONE_DIRECTION_ONE_EXACT_ANTIPODE',
    renderTopology: 'ONE_PROJECTIVELY_CLIPPED_SCREEN_SPACE_SPINDLE',
    coordinateFrameIdentity: 'APPLICATION_BASIS_UNCALIBRATED_BELOW_GEOGRAPHIC_PARENT',
    earthCore,
    northDirection: northDirectionApplication,
    southDirection: southDirectionApplication,
    displayExtentMeters: CELESTIAL_POLE_RENDER_DISTANCE_FROM_CORE_METERS,
    calibrationRevision: snapshot.revisions.geographicCalibration,
    acceptedCalibrationRevision:
      snapshot.geographicCalibration.acceptedCalibrationRevision ?? null,
    observerRevision: snapshot.revisions.observer,
    provenance: Object.freeze({
      model: 'IAU_P03_PRECESSION_ONLY',
      provider: snapshot.earthAxis.provenance.provider,
      providerVersion: snapshot.earthAxis.provenance.providerVersion,
      simulationInstantUtc: snapshot.clock.instant.utcIso,
    }),
  });

  return Object.freeze({
    kind: 'ready',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_POLE_OF_DATE',
    precisionTier: 'TIER_1',
    presentationKind: 'GEOCENTRIC_WORLD_SCALE_EARTH_CORE_AXIS',
    poleTopology: 'ANTIPODAL_PROJECTIVE_DIRECTIONS_AT_INFINITY',
    renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    observerSurfaceOrigin,
    earthCore,
    earthCoreVisible: settings.showEarthCore,
    earthCoreMarkerDiameterPixels: EARTH_CORE_MARKER_DIAMETER_PIXELS,
    poleMarkerDiameterPixels: CELESTIAL_POLE_MARKER_DIAMETER_PIXELS,
    poleLabelWidthPixels: CELESTIAL_POLE_LABEL_WIDTH_PIXELS,
    poleLabelHeightPixels: CELESTIAL_POLE_LABEL_HEIGHT_PIXELS,
    poleRenderConvergenceUpperBoundArcseconds: convergenceBound,
    observerToCoreDistanceMeters: placement.observerToCoreDistanceMeters,
    observerToAxisDistanceMeters: placement.observerToAxisDistanceMeters,
    geocentricStructure,
    spindle,
    north: endpoint(
      'NCP',
      snapshot.observerHorizontalEarthAxis.north,
      northDirectionEnu,
      northDirectionApplication,
      earthCore,
      settings,
    ),
    south: endpoint(
      'SCP',
      snapshot.observerHorizontalEarthAxis.south,
      southDirectionEnu,
      southDirectionApplication,
      earthCore,
      settings,
    ),
    snapshotIdentity: Object.freeze({
      cacheKey: snapshot.cacheKey,
      creationSequence: snapshot.creationSequence,
      observerRevision: snapshot.revisions.observer,
      timeRevision: snapshot.revisions.time,
      calibrationRevision: snapshot.revisions.geographicCalibration,
      acceptedCalibrationRevision:
        snapshot.geographicCalibration.acceptedCalibrationRevision ?? null,
    }),
  });
}

function formatAngle(value: number | null): string {
  return value === null ? 'undefined at zenith/nadir' : `${value.toFixed(1)} degrees`;
}

export function createEarthAxisStatusViewModel(
  result: ScientificSnapshotBuildResult,
): EarthAxisStatusViewModel {
  const limitations =
    'Tier 1 P03 mean pole of date; excludes nutation, CIP corrections, polar motion, Chandler wobble, and observed offsets. Poles are directions at infinity, not Polaris. MSL elevation is a disclosed numeric ellipsoid-height approximation for geocentric placement.';
  if (result.kind === 'not-ready') {
    const codes = new Set(result.errors.map(({ code }) => code));
    const status = codes.has('OBSERVER_MISSING')
      ? 'Celestial axis needs an observer location.'
      : codes.has('CALIBRATION_MISSING')
        ? 'Celestial axis needs a current north calibration.'
        : codes.has('MODEL_DOMAIN')
          ? 'Selected time is outside the validated P03 domain.'
          : 'Celestial axis is not scientifically ready.';
    return Object.freeze({
      kind: 'not-ready',
      status,
      detail: result.errors.map(({ message }) => message).join(' '),
      limitations,
      diagnostics: Object.freeze([]),
    });
  }

  const { snapshot } = result;
  const placement = snapshot.observerGeocentricEarthAxis;
  const convergenceBound = convergenceUpperBoundArcseconds(
    placement.observerToCoreDistanceMeters,
  );
  return Object.freeze({
    kind: 'ready',
    status: 'Geocentric mean Earth axis ready.',
    detail: 'The modeled WGS84 Earth core is placed at world scale; one P03 axis passes through it to antipodal projective NCP/SCP directions. Geographic yaw is applied once by the calibrated parent.',
    limitations,
    diagnostics: Object.freeze([
      `Scientific Earth core ENU east ${placement.earthCore.east.toFixed(3)} m north ${placement.earthCore.north.toFixed(3)} m up ${placement.earthCore.up.toFixed(3)} m`,
      `Scientific P03 NCP ENU east ${placement.northDirection.east.toFixed(9)} north ${placement.northDirection.north.toFixed(9)} up ${placement.northDirection.up.toFixed(9)}`,
      `Earth core distance ${(placement.observerToCoreDistanceMeters / 1000).toFixed(2)} km`,
      `Observer distance from rotation axis ${(placement.observerToAxisDistanceMeters / 1000).toFixed(2)} km`,
      `Core elevation treatment ${placement.elevationTreatment}`,
      `Diagnostic 10^13 m finite-proxy convergence bound ${convergenceBound.toFixed(3)} arcseconds`,
      'Spindle contract ONE_CORE_ONE_DIRECTION_ONE_EXACT_ANTIPODE',
      'Render strategy CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES',
      `Camera-relative core magnitude approximately ${(placement.observerToCoreDistanceMeters / 1000).toFixed(2)} km before small eye/head offsets`,
      'Depth contract LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
      'GPU pole policy unit projective directions; no finite celestial distance is uploaded',
      `NCP altitude ${snapshot.observerHorizontalEarthAxis.north.altitudeDeg.toFixed(2)} degrees`,
      `NCP azimuth ${formatAngle(snapshot.observerHorizontalEarthAxis.north.azimuthDeg)}`,
      `SCP altitude ${snapshot.observerHorizontalEarthAxis.south.altitudeDeg.toFixed(2)} degrees`,
      `UTC ${snapshot.clock.instant.utcIso} (${snapshot.clock.instant.source})`,
      `Observer ${snapshot.observer.observer.latitudeDeg.toFixed(4)} degrees latitude`,
      `Accepted calibration ${snapshot.geographicCalibration.acceptedCalibrationRevision ?? 'legacy identity'}`,
      `P03 provider ${snapshot.earthAxis.provenance.providerVersion}`,
    ]),
  });
}
