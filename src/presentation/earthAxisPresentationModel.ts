import type { EnuUnitDirection } from '../science/astronomy/types';
import type { ScientificSnapshot, ScientificSnapshotBuildResult } from '../science/snapshot/scientificSnapshot';
import { mapEnuToApplicationBasis, type ApplicationBasisDirection } from './mapEnuToApplicationBasis';

export const DEFAULT_EARTH_AXIS_RADIUS_METERS = 1.8;

export type BelowHorizonDisplayMode = 'full-axis' | 'above-horizon-emphasis';

export interface EarthAxisDisplaySettings {
  readonly showAxis: boolean;
  readonly showMarkers: boolean;
  readonly showLabels: boolean;
  readonly showBelowHorizonSegment: boolean;
  readonly belowHorizonMode: BelowHorizonDisplayMode;
  readonly presentationRadiusMeters: number;
}

export const DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS: EarthAxisDisplaySettings = Object.freeze({
  showAxis: true,
  showMarkers: true,
  showLabels: true,
  showBelowHorizonSegment: true,
  belowHorizonMode: 'above-horizon-emphasis',
  presentationRadiusMeters: DEFAULT_EARTH_AXIS_RADIUS_METERS,
});

export interface PresentationPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface EarthAxisEndpointPresentation {
  readonly pole: 'NCP' | 'SCP';
  readonly directionEnu: EnuUnitDirection;
  readonly directionApplication: ApplicationBasisDirection;
  readonly position: PresentationPoint;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number | null;
  readonly horizonRelation: 'above' | 'on' | 'below';
  readonly segmentVisible: boolean;
  readonly segmentOpacity: number;
  readonly markerVisible: boolean;
  readonly labelVisible: boolean;
}

export interface EarthAxisPresentationModel {
  readonly kind: 'ready';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly terminology: 'MEAN_POLE_OF_DATE';
  readonly precisionTier: 'TIER_1';
  readonly presentationKind: 'OBSERVER_CENTERED_DIRECTIONAL_PROXY';
  readonly presentationRadiusMeters: number;
  readonly origin: PresentationPoint;
  readonly north: EarthAxisEndpointPresentation;
  readonly south: EarthAxisEndpointPresentation;
  readonly showOrigin: boolean;
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
    !Number.isFinite(settings.presentationRadiusMeters) ||
    settings.presentationRadiusMeters < 0.5 ||
    settings.presentationRadiusMeters > 10
  ) {
    throw new Error('Earth-axis presentation radius must be finite and within [0.5, 10] meters.');
  }
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
  if (mode === 'full-axis') return relation === 'on' ? 0.7 : 0.78;
  if (relation === 'below') return 0.22;
  if (relation === 'on') return 0.58;
  return 0.88;
}

function endpoint(
  pole: EarthAxisEndpointPresentation['pole'],
  source: ScientificSnapshot['observerHorizontalEarthAxis']['north'],
  position: PresentationPoint,
  settings: EarthAxisDisplaySettings,
): EarthAxisEndpointPresentation {
  const directionApplication = mapEnuToApplicationBasis(source.direction);
  const belowVisible = source.horizonRelation !== 'below' || settings.showBelowHorizonSegment;
  return Object.freeze({
    pole,
    directionEnu: source.direction,
    directionApplication,
    position,
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
 * Converts the snapshot's canonical ENU directions once. Geographic yaw is
 * intentionally absent: the calibrated geographic parent owns that rotation.
 */
export function createEarthAxisPresentationModel(
  snapshot: ScientificSnapshot,
  settings: EarthAxisDisplaySettings = DEFAULT_EARTH_AXIS_DISPLAY_SETTINGS,
): EarthAxisPresentationModel {
  validateSettings(settings);
  const northDirection = mapEnuToApplicationBasis(
    snapshot.observerHorizontalEarthAxis.north.direction,
  );
  const northPosition: PresentationPoint = Object.freeze({
    x: northDirection.x * settings.presentationRadiusMeters,
    y: northDirection.y * settings.presentationRadiusMeters,
    z: northDirection.z * settings.presentationRadiusMeters,
  });
  const southPosition: PresentationPoint = Object.freeze({
    x: -northPosition.x,
    y: -northPosition.y,
    z: -northPosition.z,
  });

  return Object.freeze({
    kind: 'ready',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_POLE_OF_DATE',
    precisionTier: 'TIER_1',
    presentationKind: 'OBSERVER_CENTERED_DIRECTIONAL_PROXY',
    presentationRadiusMeters: settings.presentationRadiusMeters,
    origin: Object.freeze({ x: 0, y: 0, z: 0 }),
    north: endpoint('NCP', snapshot.observerHorizontalEarthAxis.north, northPosition, settings),
    south: endpoint('SCP', snapshot.observerHorizontalEarthAxis.south, southPosition, settings),
    showOrigin: settings.showAxis,
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
    'Tier 1 mean pole of date: P03 precession only; excludes nutation, CIP corrections, polar motion, Chandler wobble, and observed offsets.';
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
  return Object.freeze({
    kind: 'ready',
    status: 'Mean Earth axis ready.',
    detail: `Observer-centered directional proxy at ${DEFAULT_EARTH_AXIS_RADIUS_METERS.toFixed(2)} m; the calibrated geographic parent applies north yaw once.`,
    limitations,
    diagnostics: Object.freeze([
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
