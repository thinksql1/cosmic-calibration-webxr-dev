import type { ApplicationBasisDirection } from './mapEnuToApplicationBasis';
import { mapEnuToApplicationBasis } from './mapEnuToApplicationBasis';
import type { SolarSystemBodyState } from '../science/bodies/solarSystemBodyState';
import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import type { SolarDailyPath } from '../science/temporal/solarDailyPath';

export interface SolarDailyPathDisplaySettings {
  readonly showPath: boolean;
  readonly showHourNotches: boolean;
  readonly showBelowHorizon: boolean;
}

export const DEFAULT_SOLAR_DAILY_PATH_DISPLAY_SETTINGS: SolarDailyPathDisplaySettings = Object.freeze({
  showPath: false,
  showHourNotches: false,
  showBelowHorizon: true,
});

export interface SolarDailyPathDisplaySample {
  readonly directionApplication: ApplicationBasisDirection;
  readonly aboveHorizon: boolean;
  readonly opacity: number;
}

export interface SolarDailyHourNotchDisplayModel extends SolarDailyPathDisplaySample {
  readonly localLabel: string;
  readonly utcOffsetLabel: string;
  readonly fold: 0 | 1;
  readonly pathSampleIndex: number;
  readonly emphasized: boolean;
  readonly pixelDiameter: number;
}

export interface SolarDailyPathPresentationModel {
  readonly kind: 'ready';
  readonly presentationKind: 'OBSERVER_RELATIVE_PROJECTIVE_APPARENT_SUN_CIVIL_DAY_PATH';
  readonly renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES';
  readonly depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY';
  readonly gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES';
  readonly timeZone: string;
  readonly selectedCivilDate: string;
  readonly samples: readonly SolarDailyPathDisplaySample[];
  readonly hourNotches: readonly SolarDailyHourNotchDisplayModel[];
  readonly currentHourNotchIndex: number | undefined;
  readonly pathVisible: boolean;
  readonly hourNotchesVisible: boolean;
  readonly snapshotIdentity: {
    readonly pathCacheKey: string;
    readonly bodyCacheKey: string;
    readonly observerRevision: number;
    readonly timeRevision: number;
    readonly calibrationRevision: number;
    readonly configurationRevision: number;
  };
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
    readonly correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION';
    readonly samplingPolicy: string;
    readonly civilTimeResolver: string;
  };
}

function validateInputs(
  snapshot: ScientificSnapshot,
  bodyState: SolarSystemBodyState,
  path: SolarDailyPath,
): void {
  if (
    snapshot.kind !== 'ready' ||
    bodyState.kind !== 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE' ||
    path.kind !== 'READY_SOLAR_DAILY_APPARENT_PATH' ||
    bodyState.snapshotIdentity.observerRevision !== snapshot.revisions.observer ||
    bodyState.snapshotIdentity.timeRevision !== snapshot.revisions.time ||
    bodyState.snapshotIdentity.configurationRevision !== snapshot.revisions.configuration ||
    bodyState.snapshotIdentity.instantUtc !== snapshot.clock.instant.utcIso ||
    path.snapshotIdentity.observerRevision !== snapshot.revisions.observer ||
    path.snapshotIdentity.configurationRevision !== snapshot.revisions.configuration ||
    path.correctionProfile !== snapshot.configuration.bodyCorrectionProfile ||
    path.provenance.identity.provider !== snapshot.providers.astronomy.provider ||
    path.provenance.identity.providerVersion !== snapshot.providers.astronomy.providerVersion ||
    path.samples.length < 2 ||
    path.hourNotches.length === 0
  ) {
    throw new Error('Solar-path presentation requires active immutable Sun-path and body scientific state.');
  }
}

function currentHourNotchIndex(path: SolarDailyPath, currentUnixMilliseconds: number): number | undefined {
  if (
    currentUnixMilliseconds < path.schedule.start.unixMilliseconds ||
    currentUnixMilliseconds >= path.schedule.end.unixMilliseconds
  ) return undefined;
  let selected = 0;
  for (let index = 0; index < path.hourNotches.length; index += 1) {
    if (path.hourNotches[index]!.instant.unixMilliseconds > currentUnixMilliseconds) break;
    selected = index;
  }
  return selected;
}

function sampleDisplay(
  direction: { readonly east: number; readonly north: number; readonly up: number },
  aboveHorizon: boolean,
  showBelowHorizon: boolean,
): SolarDailyPathDisplaySample {
  return Object.freeze({
    directionApplication: mapEnuToApplicationBasis({
      frame: 'HORIZONTAL_ENU',
      units: 'unitless',
      east: direction.east,
      north: direction.north,
      up: direction.up,
    }),
    aboveHorizon,
    opacity: aboveHorizon ? 0.56 : showBelowHorizon ? 0.18 : 0,
  });
}

/** Maps science-owned observer-relative Sun directions once; calibration yaw stays parent-only. */
export function createSolarDailyPathPresentationModel(
  snapshot: ScientificSnapshot,
  bodyState: SolarSystemBodyState,
  path: SolarDailyPath,
  settings: SolarDailyPathDisplaySettings = DEFAULT_SOLAR_DAILY_PATH_DISPLAY_SETTINGS,
): SolarDailyPathPresentationModel {
  validateInputs(snapshot, bodyState, path);
  const emphasizedNotch = currentHourNotchIndex(path, snapshot.clock.instant.unixMilliseconds);
  const samples = Object.freeze(path.samples.map((sample) =>
    sampleDisplay(sample.direction, sample.aboveHorizon, settings.showBelowHorizon),
  ));
  const hourNotches = Object.freeze(path.hourNotches.map((notch, index) => {
    const display = sampleDisplay(notch.direction, notch.aboveHorizon, settings.showBelowHorizon);
    const emphasized = index === emphasizedNotch;
    return Object.freeze({
      ...display,
      localLabel: notch.civil.localLabel,
      utcOffsetLabel: notch.civil.local.utcOffsetLabel,
      fold: notch.civil.fold,
      pathSampleIndex: notch.pathSampleIndex,
      emphasized,
      pixelDiameter: emphasized ? 10 : 6,
    });
  }));
  return Object.freeze({
    kind: 'ready',
    presentationKind: 'OBSERVER_RELATIVE_PROJECTIVE_APPARENT_SUN_CIVIL_DAY_PATH',
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_SUN_PATH_AND_CIVIL_NOTCHES',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    timeZone: path.schedule.timeZone.ianaName,
    selectedCivilDate: `${String(path.schedule.date.year).padStart(4, '0')}-${String(path.schedule.date.month).padStart(2, '0')}-${String(path.schedule.date.day).padStart(2, '0')}`,
    samples,
    hourNotches,
    currentHourNotchIndex: emphasizedNotch,
    pathVisible: settings.showPath,
    hourNotchesVisible: settings.showHourNotches,
    snapshotIdentity: Object.freeze({
      pathCacheKey: path.cacheKey,
      bodyCacheKey: bodyState.cacheKey,
      observerRevision: snapshot.revisions.observer,
      timeRevision: snapshot.revisions.time,
      calibrationRevision: snapshot.revisions.geographicCalibration,
      configurationRevision: snapshot.revisions.configuration,
    }),
    provenance: Object.freeze({
      provider: path.provenance.identity.provider,
      providerVersion: path.provenance.identity.providerVersion,
      correctionProfile: path.correctionProfile,
      samplingPolicy: path.provenance.pathSamplingPolicyId,
      civilTimeResolver: path.schedule.timeZone.resolverVersion,
    }),
  });
}
