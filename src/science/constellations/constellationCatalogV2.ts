import { BRIGHT_STAR_CATALOG_V2 } from './brightStarCatalog';
import { CONSTELLATION_CATALOG_V2_METADATA } from './catalogMetadata';
import { EXPANDED_ADDITION_IDENTIFIERS, EXPANDED_SET_CONNECTIVITY_V2, type ExpandedAdditionIdentifier } from './expandedSetConnectivity';
import { FIRST_SET_CONNECTIVITY_V1, FIRST_SET_CONSTELLATION_IDENTIFIERS, type FirstConstellationIdentifier } from './firstSetConnectivity';
import type {
  CatalogStarIdentifier,
  ConstellationCatalogStar,
  ConstellationDatasetMetadata,
  ConstellationFigure,
  RawConstellationFigure,
} from './constellationCatalogTypes';

export const EXPANDED_CONSTELLATION_IDENTIFIERS = Object.freeze([
  ...FIRST_SET_CONSTELLATION_IDENTIFIERS,
  ...EXPANDED_ADDITION_IDENTIFIERS,
] as const);
export type ExpandedConstellationIdentifier = FirstConstellationIdentifier | ExpandedAdditionIdentifier;

const identifierForHr = (hr: number): CatalogStarIdentifier => `BSC5P-HR-${hr}`;
const starsByIdentifier = new Map(BRIGHT_STAR_CATALOG_V2.map((value) => [value.catalogIdentifier, value]));

function materializeFigure(raw: RawConstellationFigure<ExpandedConstellationIdentifier>): ConstellationFigure<ExpandedConstellationIdentifier> {
  return Object.freeze({
    identifier: raw.identifier,
    displayName: raw.displayName,
    sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V2',
    starCatalogIdentifiers: Object.freeze(raw.starHrs.map(identifierForHr)),
    segments: Object.freeze(raw.segmentHrs.map(([start, end]) => Object.freeze({
      startCatalogIdentifier: identifierForHr(start), endCatalogIdentifier: identifierForHr(end),
    }))),
    suggestedLabelAnchorCatalogIdentifier: identifierForHr(raw.suggestedLabelAnchorHr),
    suggestedLabelPriority: raw.suggestedLabelPriority,
    connectivityRationale: raw.connectivityRationale,
  });
}

export const CONSTELLATION_CATALOG_V2_FIGURES = Object.freeze([
  ...FIRST_SET_CONNECTIVITY_V1.map((value) => materializeFigure(value)),
  ...EXPANDED_SET_CONNECTIVITY_V2.map((value) => materializeFigure(value)),
]);

const usedIdentifiers = new Set(CONSTELLATION_CATALOG_V2_FIGURES.flatMap((figure) => figure.starCatalogIdentifiers));
export const CONSTELLATION_CATALOG_V2_STARS = Object.freeze(
  BRIGHT_STAR_CATALOG_V2.filter((value) => usedIdentifiers.has(value.catalogIdentifier)),
);
export const FIRST_CONSTELLATION_FIGURES = Object.freeze(
  CONSTELLATION_CATALOG_V2_FIGURES.filter((value): value is ConstellationFigure<FirstConstellationIdentifier> =>
    FIRST_SET_CONSTELLATION_IDENTIFIERS.includes(value.identifier as FirstConstellationIdentifier)),
);
export const FIRST_CONSTELLATION_STARS = Object.freeze(
  CONSTELLATION_CATALOG_V2_STARS.filter((value) => FIRST_CONSTELLATION_FIGURES.some((figure) => figure.starCatalogIdentifiers.includes(value.catalogIdentifier))),
);

const segmentCount = CONSTELLATION_CATALOG_V2_FIGURES.reduce((sum, value) => sum + value.segments.length, 0);
export const CONSTELLATION_CATALOG_V2_DATASET_METADATA: ConstellationDatasetMetadata = Object.freeze({
  ...CONSTELLATION_CATALOG_V2_METADATA,
  constellationCount: CONSTELLATION_CATALOG_V2_FIGURES.length,
  uniqueStarCount: CONSTELLATION_CATALOG_V2_STARS.length,
  segmentCount,
});

export interface ConstellationCatalogValidation { readonly valid: boolean; readonly errors: readonly string[]; }
export function validateConstellationCatalogV2(): ConstellationCatalogValidation {
  const errors: string[] = [];
  if (CONSTELLATION_CATALOG_V2_FIGURES.length !== 29) errors.push('expected exactly 29 constellation figures');
  if (new Set(CONSTELLATION_CATALOG_V2_FIGURES.map((value) => value.identifier)).size !== CONSTELLATION_CATALOG_V2_FIGURES.length) errors.push('duplicate constellation identifier');
  if (new Set(CONSTELLATION_CATALOG_V2_FIGURES.map((value) => value.displayName)).size !== CONSTELLATION_CATALOG_V2_FIGURES.length) errors.push('duplicate display name');
  if (new Set(CONSTELLATION_CATALOG_V2_STARS.map((value) => value.catalogIdentifier)).size !== CONSTELLATION_CATALOG_V2_STARS.length) errors.push('duplicate star catalog identifier');
  for (const star of CONSTELLATION_CATALOG_V2_STARS) {
    if (!Number.isFinite(star.rightAscensionHours) || star.rightAscensionHours < 0 || star.rightAscensionHours >= 24) errors.push(`${star.catalogIdentifier}: invalid RA`);
    if (!Number.isFinite(star.declinationDegrees) || star.declinationDegrees < -90 || star.declinationDegrees > 90) errors.push(`${star.catalogIdentifier}: invalid declination`);
    if (!Number.isFinite(star.visualMagnitude) || star.catalogFrame !== 'EQJ_J2000' || star.catalogEpoch !== 'J2000.0' || !star.sourceReference) errors.push(`${star.catalogIdentifier}: incomplete provenance`);
  }
  for (const figure of CONSTELLATION_CATALOG_V2_FIGURES) {
    const keys = new Set<string>();
    if (!figure.connectivityRationale || !figure.suggestedLabelAnchorCatalogIdentifier) errors.push(`${figure.identifier}: incomplete connectivity metadata`);
    for (const identifier of figure.starCatalogIdentifiers) if (!starsByIdentifier.has(identifier)) errors.push(`${figure.identifier}: missing star ${identifier}`);
    for (const segment of figure.segments) {
      if (!starsByIdentifier.has(segment.startCatalogIdentifier) || !starsByIdentifier.has(segment.endCatalogIdentifier)) errors.push(`${figure.identifier}: segment references missing star`);
      if (segment.startCatalogIdentifier === segment.endCatalogIdentifier) errors.push(`${figure.identifier}: degenerate segment`);
      const key = [segment.startCatalogIdentifier, segment.endCatalogIdentifier].sort().join('|');
      if (keys.has(key)) errors.push(`${figure.identifier}: duplicate segment ${key}`);
      keys.add(key);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export type { ConstellationCatalogStar, ConstellationFigure, FirstConstellationIdentifier };
