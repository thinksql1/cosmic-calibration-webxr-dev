import type { NorthCalibrationState } from '../calibration/state';
import type { EnuUnitDirection } from '../science/astronomy/types';
import {
  mapEnuToApplicationBasis,
  type ApplicationBasisDirection,
} from './mapEnuToApplicationBasis';

export const LOCAL_HORIZON_SAMPLE_COUNT = 96;
export const LOCAL_HORIZON_PRESENTATION_RADIUS_METERS = 24;
export const LOCAL_HORIZON_LINE_OPACITY = 0.42;

export interface LocalHorizonDisplaySettings {
  readonly showHorizon: boolean;
  readonly presentationRadiusMeters: number;
}

export const DEFAULT_LOCAL_HORIZON_DISPLAY_SETTINGS: LocalHorizonDisplaySettings = Object.freeze({
  showHorizon: false,
  presentationRadiusMeters: LOCAL_HORIZON_PRESENTATION_RADIUS_METERS,
});

export interface LocalHorizonSample {
  readonly index: number;
  readonly directionEnu: EnuUnitDirection;
  readonly directionApplication: ApplicationBasisDirection;
  readonly positionApplicationMeters: Readonly<{
    readonly x: number;
    readonly y: number;
    readonly z: number;
  }>;
}

export interface ReadyLocalHorizonPresentationModel {
  readonly kind: 'ready';
  readonly terminology: 'LOCAL_ASTRONOMICAL_HORIZON_TIER_1';
  readonly frame: 'HORIZONTAL_ENU';
  readonly center: 'OBSERVER_LOCAL_TANGENT_ORIGIN';
  readonly verticalModel: 'WGS84_GEODETIC_UP_TIER_1_APPROXIMATION';
  readonly presentationKind: 'BOUNDED_OBSERVER_CENTERED_LOCAL_TANGENT_CIRCLE';
  readonly depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_LOCAL_REFERENCE';
  readonly east: EnuUnitDirection;
  readonly north: EnuUnitDirection;
  readonly up: EnuUnitDirection;
  readonly samples: readonly LocalHorizonSample[];
  readonly sampleCount: number;
  readonly presentationRadiusMeters: number;
  readonly visible: boolean;
  readonly lineOpacity: number;
  readonly acceptedCalibrationRevision: number | null;
}

export interface NotReadyLocalHorizonPresentationModel {
  readonly kind: 'not-ready';
  readonly reason: 'CALIBRATION_REQUIRED';
}

export type LocalHorizonPresentationModel =
  | ReadyLocalHorizonPresentationModel
  | NotReadyLocalHorizonPresentationModel;

function clean(value: number): number {
  return Math.abs(value) <= Number.EPSILON * 4 ? 0 : value;
}

function unitDirection(east: number, north: number): EnuUnitDirection {
  const length = Math.hypot(east, north);
  if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-12) {
    throw new Error('Local-horizon sampling requires finite unit directions.');
  }
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: clean(east / length),
    north: clean(north / length),
    up: 0,
  });
}

function validateSettings(settings: LocalHorizonDisplaySettings): void {
  if (
    typeof settings.showHorizon !== 'boolean' ||
    !Number.isFinite(settings.presentationRadiusMeters) ||
    settings.presentationRadiusMeters < 10 ||
    settings.presentationRadiusMeters > 100
  ) {
    throw new Error('Local-horizon settings require a 10–100 meter finite presentation radius.');
  }
}

/**
 * Creates the bounded local tangent-plane reference. It intentionally uses no
 * Earth-core, P03, or celestial-equator input: local east/north span altitude
 * zero and local up is their normal. Geographic yaw remains parent-only.
 */
export function createLocalHorizonPresentationModel(
  calibration: NorthCalibrationState,
  settings: LocalHorizonDisplaySettings = DEFAULT_LOCAL_HORIZON_DISPLAY_SETTINGS,
): LocalHorizonPresentationModel {
  validateSettings(settings);
  if (calibration.kind !== 'calibrated') {
    return Object.freeze({ kind: 'not-ready', reason: 'CALIBRATION_REQUIRED' });
  }

  const east = Object.freeze({
    frame: 'HORIZONTAL_ENU' as const,
    units: 'unitless' as const,
    east: 1,
    north: 0,
    up: 0,
  });
  const north = Object.freeze({
    frame: 'HORIZONTAL_ENU' as const,
    units: 'unitless' as const,
    east: 0,
    north: 1,
    up: 0,
  });
  const up = Object.freeze({
    frame: 'HORIZONTAL_ENU' as const,
    units: 'unitless' as const,
    east: 0,
    north: 0,
    up: 1,
  });
  const samples = Object.freeze(Array.from(
    { length: LOCAL_HORIZON_SAMPLE_COUNT },
    (_, index): LocalHorizonSample => {
      const theta = (index / LOCAL_HORIZON_SAMPLE_COUNT) * Math.PI * 2;
      const directionEnu = unitDirection(Math.cos(theta), Math.sin(theta));
      const mappedDirection = mapEnuToApplicationBasis(directionEnu);
      const directionApplication = Object.freeze({
        ...mappedDirection,
        x: clean(mappedDirection.x),
        y: clean(mappedDirection.y),
        z: clean(mappedDirection.z),
      });
      return Object.freeze({
        index,
        directionEnu,
        directionApplication,
        positionApplicationMeters: Object.freeze({
          x: clean(directionApplication.x * settings.presentationRadiusMeters),
          y: clean(directionApplication.y * settings.presentationRadiusMeters),
          z: clean(directionApplication.z * settings.presentationRadiusMeters),
        }),
      });
    },
  ));

  return Object.freeze({
    kind: 'ready',
    terminology: 'LOCAL_ASTRONOMICAL_HORIZON_TIER_1',
    frame: 'HORIZONTAL_ENU',
    center: 'OBSERVER_LOCAL_TANGENT_ORIGIN',
    verticalModel: 'WGS84_GEODETIC_UP_TIER_1_APPROXIMATION',
    presentationKind: 'BOUNDED_OBSERVER_CENTERED_LOCAL_TANGENT_CIRCLE',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_LOCAL_REFERENCE',
    east,
    north,
    up,
    samples,
    sampleCount: LOCAL_HORIZON_SAMPLE_COUNT,
    presentationRadiusMeters: settings.presentationRadiusMeters,
    visible: settings.showHorizon,
    lineOpacity: LOCAL_HORIZON_LINE_OPACITY,
    acceptedCalibrationRevision: calibration.calibration.acceptedRevision ?? null,
  });
}
