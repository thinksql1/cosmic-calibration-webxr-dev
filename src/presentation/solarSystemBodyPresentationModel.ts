import type { ObserverRelativeBody, EnuUnitDirection } from '../science/astronomy/types';
import type { SolarSystemBodyState } from '../science/bodies/solarSystemBodyState';
import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import {
  mapEnuToApplicationBasis,
  type ApplicationBasisDirection,
} from './mapEnuToApplicationBasis';

export interface SolarSystemBodyDisplaySettings {
  readonly showBodies: boolean;
}

export const DEFAULT_SOLAR_SYSTEM_BODY_DISPLAY_SETTINGS: SolarSystemBodyDisplaySettings =
  Object.freeze({ showBodies: false });

export interface SolarSystemBodyStyle {
  readonly colorHex: number;
  readonly pixelDiameter: number;
  readonly opacity: number;
}

export interface SolarSystemBodyMarkerModel {
  readonly body: ObserverRelativeBody;
  readonly directionEnu: EnuUnitDirection;
  readonly directionApplication: ApplicationBasisDirection;
  readonly altitudeDeg: number;
  readonly azimuthDeg: number;
  readonly aboveHorizon: boolean;
  readonly celestialEquatorRelation: 'NORTH' | 'ON' | 'SOUTH';
  readonly style: SolarSystemBodyStyle;
}

export interface SolarSystemBodyPresentationModel {
  readonly kind: 'ready';
  readonly presentationKind: 'PROJECTIVE_APPARENT_TOPOCENTRIC_DIRECTIONS_AT_INFINITY';
  readonly renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS';
  readonly depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY';
  readonly gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES';
  readonly presentationRadiusPolicy: 'DIRECTION_AT_INFINITY_NO_FINITE_CELESTIAL_DISTANCE';
  readonly markers: readonly SolarSystemBodyMarkerModel[];
  readonly visible: boolean;
  readonly snapshotIdentity: {
    readonly snapshotCacheKey: string;
    readonly bodyCacheKey: string;
    readonly observerRevision: number;
    readonly timeRevision: number;
    readonly calibrationRevision: number;
    readonly acceptedCalibrationRevision: number | null;
    readonly configurationRevision: number;
  };
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
    readonly sourceFrame: 'EQD_TRUE';
    readonly outputFrame: 'HORIZONTAL_ENU';
    readonly correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION';
  };
}

const BODY_STYLES: Readonly<Record<ObserverRelativeBody, SolarSystemBodyStyle>> = Object.freeze({
  Sun: Object.freeze({ colorHex: 0xffc46b, pixelDiameter: 18, opacity: 0.92 }),
  Moon: Object.freeze({ colorHex: 0xdde9f3, pixelDiameter: 16, opacity: 0.9 }),
  Mercury: Object.freeze({ colorHex: 0xb6ada3, pixelDiameter: 9, opacity: 0.76 }),
  Venus: Object.freeze({ colorHex: 0xf0d29a, pixelDiameter: 13, opacity: 0.82 }),
  Mars: Object.freeze({ colorHex: 0xe47d68, pixelDiameter: 12, opacity: 0.82 }),
  Jupiter: Object.freeze({ colorHex: 0xd7a56c, pixelDiameter: 15, opacity: 0.84 }),
  Saturn: Object.freeze({ colorHex: 0xcbbb91, pixelDiameter: 14, opacity: 0.82 }),
});

function unitLength(direction: EnuUnitDirection): number {
  return Math.hypot(direction.east, direction.north, direction.up);
}

function validateInputs(snapshot: ScientificSnapshot, state: SolarSystemBodyState): void {
  if (
    snapshot.kind !== 'ready' ||
    state.kind !== 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE' ||
    state.snapshotIdentity.observerRevision !== snapshot.revisions.observer ||
    state.snapshotIdentity.timeRevision !== snapshot.revisions.time ||
    state.snapshotIdentity.configurationRevision !== snapshot.revisions.configuration ||
    state.snapshotIdentity.instantUtc !== snapshot.clock.instant.utcIso ||
    state.provenance.identity.providerVersion !== snapshot.providers.astronomy.providerVersion ||
    state.provenance.identity.provider !== snapshot.providers.astronomy.provider ||
    state.correctionProfile !== snapshot.configuration.bodyCorrectionProfile ||
    state.bodies.length !== 7
  ) {
    throw new Error('Solar-system presentation requires body state from the active immutable scientific snapshot.');
  }
}

/**
 * Maps validated horizontal directions only. Geographic yaw is deliberately
 * absent: it remains owned by the established calibrated geographic parent.
 */
export function createSolarSystemBodyPresentationModel(
  snapshot: ScientificSnapshot,
  state: SolarSystemBodyState,
  settings: SolarSystemBodyDisplaySettings = DEFAULT_SOLAR_SYSTEM_BODY_DISPLAY_SETTINGS,
): SolarSystemBodyPresentationModel {
  validateInputs(snapshot, state);
  const markers = Object.freeze(state.bodies.map((result) => {
    const direction = result.horizontal.direction;
    if (
      direction.frame !== 'HORIZONTAL_ENU' ||
      direction.units !== 'unitless' ||
      !Number.isFinite(unitLength(direction)) ||
      Math.abs(unitLength(direction) - 1) > 1e-10
    ) {
      throw new Error('Solar-system presentation requires finite unit ENU directions.');
    }
    return Object.freeze({
      body: result.body,
      directionEnu: direction,
      directionApplication: mapEnuToApplicationBasis(direction),
      altitudeDeg: result.horizontal.altitudeDeg,
      azimuthDeg: result.horizontal.azimuthDeg,
      aboveHorizon: result.aboveHorizon,
      celestialEquatorRelation: result.celestialEquatorRelation,
      style: BODY_STYLES[result.body],
    });
  }));
  return Object.freeze({
    kind: 'ready',
    presentationKind: 'PROJECTIVE_APPARENT_TOPOCENTRIC_DIRECTIONS_AT_INFINITY',
    renderStrategy: 'HOMOGENEOUS_PROJECTIVE_APPARENT_BODY_DIRECTIONS',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    presentationRadiusPolicy: 'DIRECTION_AT_INFINITY_NO_FINITE_CELESTIAL_DISTANCE',
    markers,
    visible: settings.showBodies,
    snapshotIdentity: Object.freeze({
      snapshotCacheKey: snapshot.cacheKey,
      bodyCacheKey: state.cacheKey,
      observerRevision: snapshot.revisions.observer,
      timeRevision: snapshot.revisions.time,
      calibrationRevision: snapshot.revisions.geographicCalibration,
      acceptedCalibrationRevision: snapshot.geographicCalibration.acceptedCalibrationRevision ?? null,
      configurationRevision: snapshot.revisions.configuration,
    }),
    provenance: Object.freeze({
      provider: state.provenance.identity.provider,
      providerVersion: state.provenance.identity.providerVersion,
      sourceFrame: state.provenance.sourceFrame,
      outputFrame: state.provenance.outputFrame,
      correctionProfile: state.correctionProfile,
    }),
  });
}
