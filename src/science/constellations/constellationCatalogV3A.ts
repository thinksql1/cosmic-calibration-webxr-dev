import { BRIGHT_STAR_CATALOG_V2 } from './brightStarCatalog';
import { BRIGHT_STAR_CATALOG_V3A_ADDITIONS } from './brightStarCatalogV3A';
import { CONSTELLATION_CATALOG_V2_FIGURES, EXPANDED_CONSTELLATION_IDENTIFIERS, type ExpandedConstellationIdentifier } from './constellationCatalogV2';
import { COURSE_V3A_ADDITION_IDENTIFIERS, COURSE_V3A_CONNECTIVITY, type CourseV3AAdditionIdentifier } from './courseV3AConnectivity';
import { CONSTELLATION_CATALOG_V3A_METADATA } from './constellationCatalogV3AMetadata';
import type { CatalogStarIdentifier, ConstellationDatasetMetadata, ConstellationFigure, RawConstellationFigure } from './constellationCatalogTypes';

export const COURSE_40_CONSTELLATION_IDENTIFIERS = Object.freeze([...EXPANDED_CONSTELLATION_IDENTIFIERS, ...COURSE_V3A_ADDITION_IDENTIFIERS] as const);
export type Course40ConstellationIdentifier = ExpandedConstellationIdentifier | CourseV3AAdditionIdentifier;
const identifierForHr = (hr: number): CatalogStarIdentifier => `BSC5P-HR-${hr}`;
function materializeFigure(raw: RawConstellationFigure<CourseV3AAdditionIdentifier>): ConstellationFigure<CourseV3AAdditionIdentifier> {
  return Object.freeze({ identifier: raw.identifier, displayName: raw.displayName, sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V3A', starCatalogIdentifiers: Object.freeze(raw.starHrs.map(identifierForHr)), segments: Object.freeze(raw.segmentHrs.map(([start, end]) => Object.freeze({ startCatalogIdentifier: identifierForHr(start), endCatalogIdentifier: identifierForHr(end) }))), suggestedLabelAnchorCatalogIdentifier: identifierForHr(raw.suggestedLabelAnchorHr), suggestedLabelPriority: raw.suggestedLabelPriority, connectivityRationale: raw.connectivityRationale });
}
export const CONSTELLATION_CATALOG_V3A_FIGURES = Object.freeze([...CONSTELLATION_CATALOG_V2_FIGURES, ...COURSE_V3A_CONNECTIVITY.map(materializeFigure)] as readonly ConstellationFigure<Course40ConstellationIdentifier>[]);
const used = new Set(CONSTELLATION_CATALOG_V3A_FIGURES.flatMap((figure) => figure.starCatalogIdentifiers));
export const CONSTELLATION_CATALOG_V3A_STARS = Object.freeze([...BRIGHT_STAR_CATALOG_V2, ...BRIGHT_STAR_CATALOG_V3A_ADDITIONS].filter((star) => used.has(star.catalogIdentifier)));
export const CONSTELLATION_CATALOG_V3A_DATASET_METADATA: ConstellationDatasetMetadata = Object.freeze({ ...CONSTELLATION_CATALOG_V3A_METADATA, constellationCount: CONSTELLATION_CATALOG_V3A_FIGURES.length, uniqueStarCount: CONSTELLATION_CATALOG_V3A_STARS.length, segmentCount: CONSTELLATION_CATALOG_V3A_FIGURES.reduce((sum, value) => sum + value.segments.length, 0) });
export function validateConstellationCatalogV3A(): { readonly valid: boolean; readonly errors: readonly string[] } {
  const errors: string[] = [];
  if (CONSTELLATION_CATALOG_V3A_FIGURES.length !== 40) errors.push('expected exactly 40 constellation figures');
  if (COURSE_V3A_ADDITION_IDENTIFIERS.length !== 11) errors.push('expected exactly 11 V3A additions');
  if (new Set(CONSTELLATION_CATALOG_V3A_FIGURES.map((figure) => figure.identifier)).size !== 40) errors.push('duplicate constellation identifier');
  if (new Set(CONSTELLATION_CATALOG_V3A_STARS.map((star) => star.catalogIdentifier)).size !== CONSTELLATION_CATALOG_V3A_STARS.length) errors.push('duplicate star catalog identifier');
  for (const star of CONSTELLATION_CATALOG_V3A_STARS) if (!Number.isFinite(star.rightAscensionHours) || !Number.isFinite(star.declinationDegrees) || !star.sourceReference || star.catalogFrame !== 'EQJ_J2000' || star.catalogEpoch !== 'J2000.0') errors.push(`${star.catalogIdentifier}: incomplete provenance`);
  for (const figure of CONSTELLATION_CATALOG_V3A_FIGURES) { const keys = new Set<string>(); if (!figure.segments.length) errors.push(`${figure.identifier}: no segments`); for (const segment of figure.segments) { if (!figure.starCatalogIdentifiers.includes(segment.startCatalogIdentifier) || !figure.starCatalogIdentifiers.includes(segment.endCatalogIdentifier)) errors.push(`${figure.identifier}: cross-constellation segment`); if (segment.startCatalogIdentifier === segment.endCatalogIdentifier) errors.push(`${figure.identifier}: degenerate segment`); const key = [segment.startCatalogIdentifier, segment.endCatalogIdentifier].sort().join('|'); if (keys.has(key)) errors.push(`${figure.identifier}: duplicate segment`); keys.add(key); } }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
