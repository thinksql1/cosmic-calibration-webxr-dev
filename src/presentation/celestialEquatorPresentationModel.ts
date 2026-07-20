import type { EnuUnitDirection } from '../science/astronomy/types';
import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import {
  mapEnuToApplicationBasis,
  type ApplicationBasisDirection,
  type ApplicationBasisPosition,
} from './mapEnuToApplicationBasis';
import {
  createGeocentricCelestialStructurePresentation,
  type GeocentricCelestialStructurePresentation,
} from './geocentricCelestialStructurePresentation';

export const CELESTIAL_EQUATOR_SAMPLE_COUNT = 96;
export const CELESTIAL_EQUATOR_LINE_OPACITY = 0.48;

export interface CelestialEquatorDisplaySettings {
  readonly showEquator: boolean;
}

export const DEFAULT_CELESTIAL_EQUATOR_DISPLAY_SETTINGS: CelestialEquatorDisplaySettings =
  Object.freeze({ showEquator: false });

export interface CelestialEquatorSample {
  readonly index: number;
  readonly directionEnu: EnuUnitDirection;
  readonly directionApplication: ApplicationBasisDirection;
  readonly finitePositionApplication: ApplicationBasisPosition;
}

export interface CelestialEquatorPresentationModel {
  readonly kind: 'ready';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly terminology: 'MEAN_CELESTIAL_EQUATOR_OF_DATE';
  readonly presentationKind:
    'EARTH_CORE_CENTERED_REFERENCE_RING_IN_CELESTIAL_EQUATORIAL_PLANE';
  readonly renderStrategy:
    'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_EQUATOR_RING';
  readonly depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY';
  readonly gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES';
  readonly earthCore: ApplicationBasisPosition;
  readonly center: ApplicationBasisPosition;
  readonly displayRadiusMeters: number;
  readonly normalEnu: EnuUnitDirection;
  readonly normalApplication: ApplicationBasisDirection;
  readonly firstEnu: EnuUnitDirection;
  readonly secondEnu: EnuUnitDirection;
  readonly firstApplication: ApplicationBasisDirection;
  readonly secondApplication: ApplicationBasisDirection;
  readonly geocentricStructure: GeocentricCelestialStructurePresentation;
  readonly samples: readonly CelestialEquatorSample[];
  readonly sampleCount: number;
  readonly visible: boolean;
  readonly lineOpacity: number;
  readonly snapshotIdentity: {
    readonly cacheKey: string;
    readonly creationSequence: number;
    readonly observerRevision: number;
    readonly timeRevision: number;
    readonly calibrationRevision: number;
    readonly acceptedCalibrationRevision: number | null;
    readonly configurationRevision: number;
  };
  readonly provenance: {
    readonly frame: 'HORIZONTAL_ENU';
    readonly sourceBasisFrame: 'GCRS';
    readonly model: 'IAU_P03_PRECESSION_ONLY';
    readonly provider: string;
    readonly providerVersion: string;
    readonly samplingPhase: 'LOCAL_CANONICAL_UNLABELED';
  };
}

function dot(left: EnuUnitDirection, right: EnuUnitDirection): number {
  return left.east * right.east + left.north * right.north + left.up * right.up;
}

function length(value: EnuUnitDirection): number {
  return Math.hypot(value.east, value.north, value.up);
}

function normalizedDirection(
  first: EnuUnitDirection,
  second: EnuUnitDirection,
  theta: number,
): EnuUnitDirection {
  const east = Math.cos(theta) * first.east + Math.sin(theta) * second.east;
  const north = Math.cos(theta) * first.north + Math.sin(theta) * second.north;
  const up = Math.cos(theta) * first.up + Math.sin(theta) * second.up;
  const magnitude = Math.hypot(east, north, up);
  if (!Number.isFinite(magnitude) || Math.abs(magnitude - 1) > 1e-10) {
    throw new Error('Celestial-equator sampling requires a finite orthonormal basis.');
  }
  return Object.freeze({
    frame: 'HORIZONTAL_ENU',
    units: 'unitless',
    east: east / magnitude,
    north: north / magnitude,
    up: up / magnitude,
  });
}

function validateSnapshot(snapshot: ScientificSnapshot): void {
  const equator = snapshot.observerHorizontalEquator;
  const pole = snapshot.observerHorizontalEarthAxis.north.direction;
  if (
    snapshot.kind !== 'ready' ||
    snapshot.frameContract.celestialEquatorPipeline !==
      'VALIDATED_GCRS_P03_BASIS_TO_LOCAL_UNLABELED_HORIZONTAL_ENU_PLANE' ||
    equator.frame !== 'HORIZONTAL_ENU' ||
    equator.model !== 'IAU_P03_PRECESSION_ONLY' ||
    equator.terminology !== 'MEAN_EQUATOR_OF_DATE' ||
    equator.sourceBasisFrame !== 'GCRS' ||
    equator.handedness !== 'right-handed' ||
    equator.provenance.provider !== snapshot.earthAxis.provenance.provider ||
    equator.provenance.providerVersion !== snapshot.earthAxis.provenance.providerVersion ||
    [equator.normal, equator.first, equator.second, pole].some(
      (value) => value.frame !== 'HORIZONTAL_ENU' || value.units !== 'unitless' || !Number.isFinite(length(value)),
    ) ||
    Math.abs(length(equator.normal) - 1) > 1e-12 ||
    Math.abs(length(equator.first) - 1) > 1e-12 ||
    Math.abs(length(equator.second) - 1) > 1e-12 ||
    Math.abs(dot(equator.normal, pole) - 1) > 1e-12 ||
    Math.abs(dot(equator.first, equator.normal)) > 1e-12 ||
    Math.abs(dot(equator.second, equator.normal)) > 1e-12 ||
    Math.abs(dot(equator.first, equator.second)) > 1e-12
  ) {
    throw new Error('Celestial-equator presentation requires one validated P03 horizontal equator basis.');
  }
}

function finiteRingPoint(
  center: ApplicationBasisPosition,
  direction: ApplicationBasisDirection,
  radiusMeters: number,
): ApplicationBasisPosition {
  return Object.freeze({
    frame: 'APPLICATION_BASIS',
    units: 'meters',
    x: center.x + direction.x * radiusMeters,
    y: center.y + direction.y * radiusMeters,
    z: center.z + direction.z * radiusMeters,
  });
}

/** Builds a bounded reference cross-section of the infinite equatorial plane. */
export function createCelestialEquatorPresentationModel(
  snapshot: ScientificSnapshot,
  settings: CelestialEquatorDisplaySettings = DEFAULT_CELESTIAL_EQUATOR_DISPLAY_SETTINGS,
  geocentricStructure: GeocentricCelestialStructurePresentation =
    createGeocentricCelestialStructurePresentation(snapshot),
): CelestialEquatorPresentationModel {
  validateSnapshot(snapshot);
  if (
    geocentricStructure.snapshotCacheKey !== snapshot.cacheKey ||
    geocentricStructure.validity !== 'VALIDATED'
  ) {
    throw new Error(
      'Celestial-equator presentation requires the matching validated geocentric structure.',
    );
  }
  const equator = snapshot.observerHorizontalEquator;
  const samples = Object.freeze(Array.from({ length: CELESTIAL_EQUATOR_SAMPLE_COUNT }, (_, index) => {
    const directionEnu = normalizedDirection(
      geocentricStructure.equatorialBasisFirstEnu,
      geocentricStructure.equatorialBasisSecondEnu,
      (index / CELESTIAL_EQUATOR_SAMPLE_COUNT) * Math.PI * 2,
    );
    const directionApplication = mapEnuToApplicationBasis(directionEnu);
    return Object.freeze({
      index,
      directionEnu,
      directionApplication,
      finitePositionApplication: finiteRingPoint(
        geocentricStructure.celestialEquatorCenter,
        directionApplication,
        geocentricStructure.celestialEquatorDisplayRadiusMeters,
      ),
    });
  }));

  return Object.freeze({
    kind: 'ready',
    model: 'IAU_P03_PRECESSION_ONLY',
    terminology: 'MEAN_CELESTIAL_EQUATOR_OF_DATE',
    presentationKind: 'EARTH_CORE_CENTERED_REFERENCE_RING_IN_CELESTIAL_EQUATORIAL_PLANE',
    renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_EQUATOR_RING',
    depthContract: 'LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY',
    gpuCoordinatePolicy: 'NO_RAW_LARGE_WORLD_VERTEX_COORDINATES',
    earthCore: geocentricStructure.earthCore,
    center: geocentricStructure.celestialEquatorCenter,
    displayRadiusMeters: geocentricStructure.celestialEquatorDisplayRadiusMeters,
    normalEnu: geocentricStructure.northAxisDirectionEnu,
    normalApplication: geocentricStructure.equatorialPlaneNormal,
    firstEnu: geocentricStructure.equatorialBasisFirstEnu,
    secondEnu: geocentricStructure.equatorialBasisSecondEnu,
    firstApplication: geocentricStructure.equatorialBasisFirst,
    secondApplication: geocentricStructure.equatorialBasisSecond,
    geocentricStructure,
    samples,
    sampleCount: CELESTIAL_EQUATOR_SAMPLE_COUNT,
    visible: settings.showEquator,
    lineOpacity: CELESTIAL_EQUATOR_LINE_OPACITY,
    snapshotIdentity: Object.freeze({
      cacheKey: snapshot.cacheKey,
      creationSequence: snapshot.creationSequence,
      observerRevision: snapshot.revisions.observer,
      timeRevision: snapshot.revisions.time,
      calibrationRevision: snapshot.revisions.geographicCalibration,
      acceptedCalibrationRevision: snapshot.geographicCalibration.acceptedCalibrationRevision ?? null,
      configurationRevision: snapshot.revisions.configuration,
    }),
    provenance: Object.freeze({
      frame: 'HORIZONTAL_ENU',
      sourceBasisFrame: 'GCRS',
      model: 'IAU_P03_PRECESSION_ONLY',
      provider: geocentricStructure.provenance.provider,
      providerVersion: geocentricStructure.provenance.providerVersion,
      samplingPhase: equator.samplingPhase,
    }),
  });
}
