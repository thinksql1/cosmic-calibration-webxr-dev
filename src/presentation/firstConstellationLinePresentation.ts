import type { GeocentricCelestialStructurePresentation } from './geocentricCelestialStructurePresentation';
import {
  CONSTELLATION_CATALOG_V2_DATASET_METADATA,
  CONSTELLATION_CATALOG_V2_FIGURES,
  CONSTELLATION_CATALOG_V2_STARS,
  type ConstellationCatalogStar,
} from '../science/constellations/constellationCatalogV2';
import {
  CONSTELLATION_CATALOG_V3A_DATASET_METADATA,
  CONSTELLATION_CATALOG_V3A_FIGURES,
  CONSTELLATION_CATALOG_V3A_STARS,
} from '../science/constellations/constellationCatalogV3A';
import {
  CONSTELLATION_CATALOG_V3B_DATASET_METADATA,
  CONSTELLATION_CATALOG_V3B_FIGURES,
  CONSTELLATION_CATALOG_V3B_STARS,
  type Course50ConstellationIdentifier,
} from '../science/constellations/constellationCatalogV3B';
import {
  catalogJ2000Direction,
  CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
  sampleMinorGreatCircleArc,
  type UnitVector3,
} from '../science/constellations/greatCircleArc';
import type { Matrix3Rows } from '../science/astronomy/realSkyEquatorialOrientation';
import type { ConstellationColorMode, ConstellationColorStrength } from './color/celestialColorModes';
import type { ConstellationBaseColorId, ConstellationHighlightColorId } from './color/celestialColorCatalog';
import type { ConstellationLearningGroupId } from '../science/constellations/constellationLearningGroups';
import type { ConstellationFigure } from '../science/constellations/constellationCatalogTypes';

export interface FirstConstellationCanonicalSegment {
  readonly name: string;
  readonly constellationIdentifier: Course50ConstellationIdentifier;
  readonly startStar: ConstellationCatalogStar;
  readonly endStar: ConstellationCatalogStar;
  readonly directions: readonly UnitVector3[];
  readonly angularSeparationDegrees: number;
  readonly intervalCount: number;
  readonly maximumAdjacentAngularSeparationDegrees: number;
  readonly minorArc: true;
}
export interface FirstConstellationCanonicalFigure {
  readonly identifier: Course50ConstellationIdentifier;
  readonly displayName: string;
  readonly starDirections: readonly { readonly star: ConstellationCatalogStar; readonly direction: UnitVector3 }[];
  readonly segments: readonly FirstConstellationCanonicalSegment[];
}
export interface FirstConstellationCanonicalGeometry {
  readonly kind: 'ready';
  readonly frame: 'EQJ_J2000';
  readonly figures: readonly FirstConstellationCanonicalFigure[];
  readonly starCount: number;
  readonly segmentCount: number;
  readonly vertexCount: number;
  readonly maximumAngularStepDegrees: number;
}
export interface FirstConstellationDisplaySettings {
  readonly studyEnabled: boolean;
  readonly masterVisible: boolean;
  readonly enabledConstellations: ReadonlySet<Course50ConstellationIdentifier>;
  readonly showEndpointMarkers: boolean;
  readonly colorMode?: ConstellationColorMode;
  readonly colorStrength?: ConstellationColorStrength;
  readonly baseColor?: ConstellationBaseColorId;
  readonly highlightColor?: ConstellationHighlightColorId;
  readonly selectedLearningGroup?: ConstellationLearningGroupId | undefined;
}
export interface FirstConstellationPresentationUpdate {
  readonly structure: GeocentricCelestialStructurePresentation;
  readonly orientationRows: Matrix3Rows;
  readonly settings: FirstConstellationDisplaySettings;
}

function createCanonicalGeometry(figuresInput: readonly ConstellationFigure<Course50ConstellationIdentifier>[], starsInput: readonly ConstellationCatalogStar[]): FirstConstellationCanonicalGeometry {
  const stars = new Map(starsInput.map((star) => [star.catalogIdentifier, star]));
  const figures = figuresInput.map((figure) => {
    const starDirections = figure.starCatalogIdentifiers.map((identifier) => {
      const catalogStar = stars.get(identifier);
      if (!catalogStar) throw new Error(`Missing catalog star ${identifier}.`);
      const direction = catalogJ2000Direction(catalogStar.rightAscensionHours, catalogStar.declinationDegrees);
      if (!direction) throw new Error(`Invalid J2000 coordinate for ${identifier}.`);
      return Object.freeze({ star: catalogStar, direction });
    });
    const segments = figure.segments.map((segment, index) => {
      const startStar = stars.get(segment.startCatalogIdentifier);
      const endStar = stars.get(segment.endCatalogIdentifier);
      if (!startStar || !endStar) throw new Error(`Missing segment endpoint for ${figure.identifier}.`);
      const start = catalogJ2000Direction(startStar.rightAscensionHours, startStar.declinationDegrees);
      const end = catalogJ2000Direction(endStar.rightAscensionHours, endStar.declinationDegrees);
      if (!start || !end) throw new Error(`Invalid segment endpoint for ${figure.identifier}.`);
      const arc = sampleMinorGreatCircleArc(start, end);
      if (arc.kind !== 'ready') throw new Error(`Invalid catalog arc ${figure.identifier}-${index}: ${arc.reason}`);
      return Object.freeze({
        name: `constellation-${figure.identifier.toLowerCase()}-segment-${String(index + 1).padStart(2, '0')}`,
        constellationIdentifier: figure.identifier,
        startStar,
        endStar,
        directions: arc.points,
        angularSeparationDegrees: arc.angularSeparationDegrees,
        intervalCount: arc.intervalCount,
        maximumAdjacentAngularSeparationDegrees: arc.maximumAdjacentAngularSeparationDegrees,
        minorArc: true as const,
      });
    });
    return Object.freeze({ identifier: figure.identifier, displayName: figure.displayName, starDirections: Object.freeze(starDirections), segments: Object.freeze(segments) });
  });
  return Object.freeze({
    kind: 'ready',
    frame: 'EQJ_J2000',
    figures: Object.freeze(figures),
    starCount: starsInput.length,
    segmentCount: figures.reduce((sum, figure) => sum + figure.segments.length, 0),
    vertexCount: figures.reduce((sum, figure) => sum + figure.segments.reduce((figureSum, segment) => figureSum + segment.directions.length, 0), 0),
    maximumAngularStepDegrees: CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
  });
}

export const FIRST_CONSTELLATION_CANONICAL_GEOMETRY = createCanonicalGeometry(CONSTELLATION_CATALOG_V2_FIGURES, CONSTELLATION_CATALOG_V2_STARS);
export const EXPANDED_CONSTELLATION_CANONICAL_GEOMETRY = FIRST_CONSTELLATION_CANONICAL_GEOMETRY;
export const COURSE_40_CONSTELLATION_CANONICAL_GEOMETRY = createCanonicalGeometry(CONSTELLATION_CATALOG_V3A_FIGURES, CONSTELLATION_CATALOG_V3A_STARS);
export const COURSE_50_CONSTELLATION_CANONICAL_GEOMETRY = createCanonicalGeometry(CONSTELLATION_CATALOG_V3B_FIGURES, CONSTELLATION_CATALOG_V3B_STARS);
export const FIRST_CONSTELLATION_DATASET_METADATA = CONSTELLATION_CATALOG_V2_DATASET_METADATA;
export { CONSTELLATION_CATALOG_V2_DATASET_METADATA };
export { CONSTELLATION_CATALOG_V3A_DATASET_METADATA };
export { CONSTELLATION_CATALOG_V3B_DATASET_METADATA };
