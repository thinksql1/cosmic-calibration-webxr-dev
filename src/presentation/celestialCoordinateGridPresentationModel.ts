import type { ScientificSnapshot } from '../science/snapshot/scientificSnapshot';
import type { ApplicationBasisDirection, ApplicationBasisPosition } from './mapEnuToApplicationBasis';
import { createGeocentricCelestialStructurePresentation, type GeocentricCelestialStructurePresentation } from './geocentricCelestialStructurePresentation';
import { createEquatorialCoordinateBasis, equatorialCoordinatesToDirection, getCanonicalCelestialPoleDirections, type EquatorialCoordinateBasis } from './equatorialCoordinates';

export const CELESTIAL_GRID_DECLINATION_DEGREES = Object.freeze([60, 30, -30, -60] as const);
export const CELESTIAL_GRID_RIGHT_ASCENSION_HOURS = Object.freeze([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const);
export const CELESTIAL_GRID_CIRCLE_SAMPLE_COUNT = 96;
export const CELESTIAL_GRID_MERIDIAN_SAMPLE_COUNT = 49;

export interface CelestialCoordinateGridDisplaySettings {
  readonly showGrid: boolean;
  readonly showDeclinationLines: boolean;
  readonly showRightAscensionLines: boolean;
}
export const DEFAULT_CELESTIAL_COORDINATE_GRID_DISPLAY_SETTINGS: CelestialCoordinateGridDisplaySettings = Object.freeze({ showGrid: false, showDeclinationLines: true, showRightAscensionLines: true });

export interface CelestialGridLine {
  readonly name: string;
  readonly family: 'declination' | 'right-ascension';
  readonly closed: boolean;
  readonly declinationDegrees?: number;
  readonly rightAscensionHours?: number;
  readonly directions: readonly ApplicationBasisDirection[];
  readonly opacity: number;
}
export interface CelestialCoordinateGridPresentationModel {
  readonly kind: 'ready';
  readonly renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_GRID';
  readonly coordinateBasis: EquatorialCoordinateBasis;
  readonly canonicalPoles: ReturnType<typeof getCanonicalCelestialPoleDirections>;
  readonly earthCore: ApplicationBasisPosition;
  readonly displayRadiusMeters: number;
  readonly geocentricStructure: GeocentricCelestialStructurePresentation;
  readonly lines: readonly CelestialGridLine[];
  readonly visible: boolean;
}

function lineName(declination: number): string { return `declination-circle-${declination >= 0 ? 'plus' : 'minus'}-${Math.abs(declination)}`; }
function meridianName(hours: number): string { return `right-ascension-meridian-${String(hours).padStart(2, '0')}h`; }

function gridBasis(structure: GeocentricCelestialStructurePresentation): EquatorialCoordinateBasis {
  return createEquatorialCoordinateBasis(structure.equatorialBasisFirst, structure.equatorialBasisSecond, structure.northAxisDirection);
}

function declinationLine(declinationDegrees: number, basis: EquatorialCoordinateBasis): CelestialGridLine {
  const directions = Object.freeze(Array.from({ length: CELESTIAL_GRID_CIRCLE_SAMPLE_COUNT }, (_, index) =>
    equatorialCoordinatesToDirection(index * 24 / CELESTIAL_GRID_CIRCLE_SAMPLE_COUNT, 'hours', declinationDegrees, basis)));
  return Object.freeze({ name: lineName(declinationDegrees), family: 'declination', closed: true, declinationDegrees, directions, opacity: Math.abs(declinationDegrees) === 30 ? 0.27 : 0.18 });
}
function meridianLine(hours: number, basis: EquatorialCoordinateBasis): CelestialGridLine {
  const directions = Object.freeze(Array.from({ length: CELESTIAL_GRID_MERIDIAN_SAMPLE_COUNT }, (_, index) =>
    equatorialCoordinatesToDirection(hours, 'hours', -90 + index * 180 / (CELESTIAL_GRID_MERIDIAN_SAMPLE_COUNT - 1), basis)));
  return Object.freeze({ name: meridianName(hours), family: 'right-ascension', closed: false, rightAscensionHours: hours, directions, opacity: hours === 0 ? 0.34 : 0.20 });
}

export function createCelestialCoordinateGridPresentationModel(snapshot: ScientificSnapshot, settings: CelestialCoordinateGridDisplaySettings = DEFAULT_CELESTIAL_COORDINATE_GRID_DISPLAY_SETTINGS, structure: GeocentricCelestialStructurePresentation = createGeocentricCelestialStructurePresentation(snapshot)): CelestialCoordinateGridPresentationModel {
  if (snapshot.kind !== 'ready' || structure.validity !== 'VALIDATED' || structure.snapshotCacheKey !== snapshot.cacheKey) throw new Error('Celestial grid requires the matching validated geocentric structure.');
  const basis = gridBasis(structure);
  const canonicalPoles = getCanonicalCelestialPoleDirections(basis);
  const lines = Object.freeze([
    ...CELESTIAL_GRID_DECLINATION_DEGREES.map((value) => declinationLine(value, basis)),
    ...CELESTIAL_GRID_RIGHT_ASCENSION_HOURS.map((value) => meridianLine(value, basis)),
  ]);
  return Object.freeze({ kind: 'ready', renderStrategy: 'CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_GEOCENTRIC_GRID', coordinateBasis: basis, canonicalPoles, earthCore: structure.earthCore, displayRadiusMeters: structure.celestialEquatorDisplayRadiusMeters, geocentricStructure: structure, lines, visible: settings.showGrid });
}
