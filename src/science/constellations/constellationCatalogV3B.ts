import { BRIGHT_STAR_CATALOG_V3B_ADDITIONS } from './brightStarCatalogV3B';
import { CONSTELLATION_CATALOG_V3A_FIGURES, CONSTELLATION_CATALOG_V3A_STARS, COURSE_40_CONSTELLATION_IDENTIFIERS, type Course40ConstellationIdentifier } from './constellationCatalogV3A';
import { COURSE_V3B_ADDITION_IDENTIFIERS, COURSE_V3B_CONNECTIVITY, type CourseV3BAdditionIdentifier } from './courseV3BConnectivity';
import { CONSTELLATION_CATALOG_V3B_METADATA } from './constellationCatalogV3BMetadata';
import type { CatalogStarIdentifier, ConstellationDatasetMetadata, ConstellationFigure, RawConstellationFigure } from './constellationCatalogTypes';

export const COURSE_50_CONSTELLATION_IDENTIFIERS = Object.freeze([...COURSE_40_CONSTELLATION_IDENTIFIERS, ...COURSE_V3B_ADDITION_IDENTIFIERS] as const);
export type Course50ConstellationIdentifier = Course40ConstellationIdentifier | CourseV3BAdditionIdentifier;
const identifierForHr = (hr: number): CatalogStarIdentifier => `BSC5P-HR-${hr}`;
function materializeFigure(raw: RawConstellationFigure<CourseV3BAdditionIdentifier>): ConstellationFigure<CourseV3BAdditionIdentifier> {
  return Object.freeze({ identifier: raw.identifier, displayName: raw.displayName, sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V3B', starCatalogIdentifiers: Object.freeze(raw.starHrs.map(identifierForHr)), segments: Object.freeze(raw.segmentHrs.map(([start, end]) => Object.freeze({ startCatalogIdentifier: identifierForHr(start), endCatalogIdentifier: identifierForHr(end) }))), suggestedLabelAnchorCatalogIdentifier: identifierForHr(raw.suggestedLabelAnchorHr), suggestedLabelPriority: raw.suggestedLabelPriority, connectivityRationale: raw.connectivityRationale });
}
export const CONSTELLATION_CATALOG_V3B_FIGURES = Object.freeze([...CONSTELLATION_CATALOG_V3A_FIGURES, ...COURSE_V3B_CONNECTIVITY.map(materializeFigure)] as readonly ConstellationFigure<Course50ConstellationIdentifier>[]);
const used = new Set(CONSTELLATION_CATALOG_V3B_FIGURES.flatMap((figure) => figure.starCatalogIdentifiers));
export const CONSTELLATION_CATALOG_V3B_STARS = Object.freeze([...CONSTELLATION_CATALOG_V3A_STARS, ...BRIGHT_STAR_CATALOG_V3B_ADDITIONS].filter((star) => used.has(star.catalogIdentifier)));
export const CONSTELLATION_CATALOG_V3B_DATASET_METADATA: ConstellationDatasetMetadata = Object.freeze({ ...CONSTELLATION_CATALOG_V3B_METADATA, constellationCount: CONSTELLATION_CATALOG_V3B_FIGURES.length, uniqueStarCount: CONSTELLATION_CATALOG_V3B_STARS.length, segmentCount: CONSTELLATION_CATALOG_V3B_FIGURES.reduce((sum, value) => sum + value.segments.length, 0) });
export function validateConstellationCatalogV3B(): { readonly valid: boolean; readonly errors: readonly string[] } {
  const errors: string[] = [];
  if (CONSTELLATION_CATALOG_V3B_FIGURES.length !== 50) errors.push('expected exactly 50 constellation figures');
  if (COURSE_V3B_ADDITION_IDENTIFIERS.length !== 10) errors.push('expected exactly 10 V3B additions');
  if (new Set(CONSTELLATION_CATALOG_V3B_FIGURES.map((figure) => figure.identifier)).size !== 50) errors.push('duplicate constellation identifier');
  if (new Set(CONSTELLATION_CATALOG_V3B_STARS.map((star) => star.catalogIdentifier)).size !== CONSTELLATION_CATALOG_V3B_STARS.length) errors.push('duplicate star catalog identifier');
  for (const star of CONSTELLATION_CATALOG_V3B_STARS) if (!Number.isFinite(star.rightAscensionHours) || !Number.isFinite(star.declinationDegrees) || !star.sourceReference || star.catalogFrame !== 'EQJ_J2000' || star.catalogEpoch !== 'J2000.0') errors.push(`${star.catalogIdentifier}: incomplete provenance`);
  for (const figure of CONSTELLATION_CATALOG_V3B_FIGURES) { const keys = new Set<string>(); if (!figure.segments.length) errors.push(`${figure.identifier}: no segments`); for (const segment of figure.segments) { if (!figure.starCatalogIdentifiers.includes(segment.startCatalogIdentifier) || !figure.starCatalogIdentifiers.includes(segment.endCatalogIdentifier)) errors.push(`${figure.identifier}: cross-constellation segment`); if (segment.startCatalogIdentifier === segment.endCatalogIdentifier) errors.push(`${figure.identifier}: degenerate segment`); const key = [segment.startCatalogIdentifier, segment.endCatalogIdentifier].sort().join('|'); if (keys.has(key)) errors.push(`${figure.identifier}: duplicate segment`); keys.add(key); } }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
