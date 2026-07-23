import type { GeocentricCelestialStructurePresentation } from './geocentricCelestialStructurePresentation';
import {
  FIRST_CONSTELLATION_DATASET_METADATA,
  FIRST_CONSTELLATION_FIGURES,
  FIRST_CONSTELLATION_STARS,
  type FirstConstellationCatalogStar,
  type FirstConstellationIdentifier,
} from '../science/constellations/firstConstellationCatalog';
import {
  catalogJ2000Direction,
  CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
  sampleMinorGreatCircleArc,
  type UnitVector3,
} from '../science/constellations/greatCircleArc';
import type { Matrix3Rows } from '../science/astronomy/realSkyEquatorialOrientation';

export interface FirstConstellationCanonicalSegment {
  readonly name: string;
  readonly constellationIdentifier: FirstConstellationIdentifier;
  readonly startStar: FirstConstellationCatalogStar;
  readonly endStar: FirstConstellationCatalogStar;
  readonly directions: readonly UnitVector3[];
  readonly angularSeparationDegrees: number;
  readonly intervalCount: number;
  readonly maximumAdjacentAngularSeparationDegrees: number;
  readonly minorArc: true;
}
export interface FirstConstellationCanonicalFigure {
  readonly identifier: FirstConstellationIdentifier;
  readonly displayName: string;
  readonly starDirections: readonly { readonly star: FirstConstellationCatalogStar; readonly direction: UnitVector3 }[];
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
  readonly enabledConstellations: ReadonlySet<FirstConstellationIdentifier>;
  readonly showEndpointMarkers: boolean;
}
export interface FirstConstellationPresentationUpdate {
  readonly structure: GeocentricCelestialStructurePresentation;
  readonly orientationRows: Matrix3Rows;
  readonly settings: FirstConstellationDisplaySettings;
}

function createCanonicalGeometry(): FirstConstellationCanonicalGeometry {
  const stars = new Map(FIRST_CONSTELLATION_STARS.map((star) => [star.catalogIdentifier, star]));
  const figures = FIRST_CONSTELLATION_FIGURES.map((figure) => {
    const starDirections = figure.starCatalogIdentifiers.map((identifier) => {
      const catalogStar = stars.get(identifier);
      if (!catalogStar) throw new Error(`Missing first-set star ${identifier}.`);
      const direction = catalogJ2000Direction(catalogStar.rightAscensionHours, catalogStar.declinationDegrees);
      if (!direction) throw new Error(`Invalid J2000 coordinate for ${identifier}.`);
      return Object.freeze({ star: catalogStar, direction });
    });
    const segments = figure.segments.map((segment, index) => {
      const startStar = stars.get(segment.startCatalogIdentifier);
      const endStar = stars.get(segment.endCatalogIdentifier);
      if (!startStar || !endStar) throw new Error(`Missing first-set segment endpoint for ${figure.identifier}.`);
      const start = catalogJ2000Direction(startStar.rightAscensionHours, startStar.declinationDegrees);
      const end = catalogJ2000Direction(endStar.rightAscensionHours, endStar.declinationDegrees);
      if (!start || !end) throw new Error(`Invalid first-set segment endpoint for ${figure.identifier}.`);
      const arc = sampleMinorGreatCircleArc(start, end);
      if (arc.kind !== 'ready') throw new Error(`Invalid first-set arc ${figure.identifier}-${index}: ${arc.reason}`);
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
    starCount: FIRST_CONSTELLATION_STARS.length,
    segmentCount: figures.reduce((sum, figure) => sum + figure.segments.length, 0),
    vertexCount: figures.reduce((sum, figure) => sum + figure.segments.reduce((figureSum, segment) => figureSum + segment.directions.length, 0), 0),
    maximumAngularStepDegrees: CONSTELLATION_MAX_ANGULAR_STEP_DEGREES,
  });
}

export const FIRST_CONSTELLATION_CANONICAL_GEOMETRY = createCanonicalGeometry();
export { FIRST_CONSTELLATION_DATASET_METADATA };
