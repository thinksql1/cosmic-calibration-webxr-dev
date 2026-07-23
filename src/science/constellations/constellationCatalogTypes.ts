export type CatalogFrame = 'EQJ_J2000';
export type CatalogEpoch = 'J2000.0';
export type CatalogStarIdentifier = `BSC5P-HR-${number}`;

export interface ConstellationCatalogStar {
  readonly catalogIdentifier: CatalogStarIdentifier;
  readonly displayName: string;
  readonly rightAscensionHours: number;
  readonly declinationDegrees: number;
  readonly catalogFrame: CatalogFrame;
  readonly catalogEpoch: CatalogEpoch;
  readonly visualMagnitude: number;
  readonly sourceReference: string;
}

export interface ConstellationSegment {
  readonly startCatalogIdentifier: CatalogStarIdentifier;
  readonly endCatalogIdentifier: CatalogStarIdentifier;
}

export interface ConstellationFigure<Identifier extends string = string> {
  readonly identifier: Identifier;
  readonly displayName: string;
  readonly sourceTradition: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V2';
  readonly starCatalogIdentifiers: readonly CatalogStarIdentifier[];
  readonly segments: readonly ConstellationSegment[];
  readonly suggestedLabelAnchorCatalogIdentifier: CatalogStarIdentifier;
  readonly suggestedLabelPriority: 'anchor' | 'standard';
  readonly connectivityRationale: string;
}

export interface RawConstellationFigure<Identifier extends string = string> {
  readonly identifier: Identifier;
  readonly displayName: string;
  readonly starHrs: readonly number[];
  readonly segmentHrs: readonly (readonly [number, number])[];
  readonly suggestedLabelAnchorHr: number;
  readonly suggestedLabelPriority: 'anchor' | 'standard';
  readonly connectivityRationale: string;
}

export interface ConstellationDatasetMetadata {
  readonly version: string;
  readonly createdDate: string;
  readonly constellationCount: number;
  readonly uniqueStarCount: number;
  readonly segmentCount: number;
  readonly starCoordinateSource: 'NASA_HEASARC_BSC5P';
  readonly starCoordinateSourceUrl: string;
  readonly sourceReference: string;
  readonly license: 'UNITED_STATES_GOVERNMENT_WORK_PUBLIC_DOMAIN';
  readonly licenseUrl: string;
  readonly dataCatalogUrl: string;
  readonly catalogFrame: CatalogFrame;
  readonly catalogEpoch: CatalogEpoch;
  readonly properMotionPolicy: 'OMITTED_FIXED_J2000_VISUAL_CATALOG';
  readonly connectivitySource: 'PROJECT_AUTHORED_CONVENTIONAL_WESTERN_V2';
  readonly connectivityPolicy: string;
}
