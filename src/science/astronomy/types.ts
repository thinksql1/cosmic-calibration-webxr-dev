export type SimulationInstantSource =
  | 'frozen-test'
  | 'user-selected'
  | 'system-selected';

export interface SimulationInstant {
  readonly utcIso: string;
  readonly unixMilliseconds: number;
  readonly source: SimulationInstantSource;
}

export type VerticalDatum = 'MEAN_SEA_LEVEL' | 'WGS84_ELLIPSOID';

export interface ObserverUncertainty {
  readonly horizontalMeters?: number;
  readonly verticalMeters?: number;
}

export interface ObserverInput {
  readonly latitudeDeg: number;
  readonly longitudeDegEast: number;
  readonly elevationMeters: number;
  readonly horizontalDatum?: 'WGS84';
  readonly verticalDatum?: VerticalDatum;
  readonly source?: string;
  readonly uncertainty?: ObserverUncertainty;
}

export interface ValidatedObserver {
  readonly kind: 'VALIDATED_OBSERVER';
  readonly latitudeDeg: number;
  readonly longitudeDegEast: number;
  readonly elevationMeters: number;
  readonly horizontalDatum: 'WGS84';
  readonly verticalDatum: VerticalDatum;
  readonly source?: string;
  readonly uncertainty?: ObserverUncertainty;
}

export type CelestialFrameTag =
  | 'EQJ_J2000'
  | 'EQD_TRUE'
  | 'GCRS'
  | 'P03_MEAN_EQUATOR_OF_DATE';

export type DirectionFrameTag = CelestialFrameTag | 'HORIZONTAL_ENU';

export interface CartesianUnitDirection<Frame extends CelestialFrameTag> {
  readonly frame: Frame;
  readonly units: 'unitless';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface EnuUnitDirection {
  readonly frame: 'HORIZONTAL_ENU';
  readonly units: 'unitless';
  readonly east: number;
  readonly north: number;
  readonly up: number;
}

export type CorrectionProfileId =
  | 'AE_APPARENT_TOPOCENTRIC_AIRLESS'
  | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
  | 'IAU_P03_MEAN_PRECESSION_ONLY';

export interface CorrectionProfile {
  readonly id: CorrectionProfileId;
  readonly lightTime: 'included' | 'not-applicable';
  readonly topocentricParallax: 'included' | 'not-applicable';
  readonly aberration: 'included' | 'not-applicable';
  readonly gravitationalDeflection: 'not-documented' | 'not-applicable';
  readonly frameBias: 'included' | 'provider-managed' | 'not-applicable';
  readonly precession: 'provider-managed' | 'IAU_P03' | 'not-applicable';
  readonly nutation: 'included' | 'excluded' | 'not-applicable';
  readonly refraction: 'disabled' | 'normal' | 'not-applicable';
  readonly polarMotion: 'excluded' | 'not-applicable';
}

export const CORRECTION_PROFILES = Object.freeze({
  AE_APPARENT_TOPOCENTRIC_AIRLESS: Object.freeze({
    id: 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
    lightTime: 'included',
    topocentricParallax: 'included',
    aberration: 'included',
    gravitationalDeflection: 'not-documented',
    frameBias: 'provider-managed',
    precession: 'provider-managed',
    nutation: 'included',
    refraction: 'disabled',
    polarMotion: 'excluded',
  }),
  AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION: Object.freeze({
    id: 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION',
    lightTime: 'included',
    topocentricParallax: 'included',
    aberration: 'included',
    gravitationalDeflection: 'not-documented',
    frameBias: 'provider-managed',
    precession: 'provider-managed',
    nutation: 'included',
    refraction: 'normal',
    polarMotion: 'excluded',
  }),
  IAU_P03_MEAN_PRECESSION_ONLY: Object.freeze({
    id: 'IAU_P03_MEAN_PRECESSION_ONLY',
    lightTime: 'not-applicable',
    topocentricParallax: 'not-applicable',
    aberration: 'not-applicable',
    gravitationalDeflection: 'not-applicable',
    frameBias: 'included',
    precession: 'IAU_P03',
    nutation: 'excluded',
    refraction: 'not-applicable',
    polarMotion: 'excluded',
  }),
} satisfies Readonly<Record<CorrectionProfileId, CorrectionProfile>>);

export interface ResultProvenance {
  readonly provider: string;
  readonly providerVersion: string;
  readonly adapterVersion: string;
  readonly simulationInstant: SimulationInstant;
  readonly observer?: ValidatedObserver;
  readonly sourceFrame: CelestialFrameTag;
  readonly outputFrame: DirectionFrameTag;
  readonly correctionProfile: CorrectionProfile;
  readonly validationFixture?: string;
}

/** Bodies intentionally supported by the bounded actual-position layer. */
export const SUPPORTED_SOLAR_SYSTEM_BODIES = Object.freeze([
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const);

export type ObserverRelativeBody = (typeof SUPPORTED_SOLAR_SYSTEM_BODIES)[number];

/** Major planets are separate from the Sun, Moon, and the dwarf planet Pluto. */
export const SUPPORTED_PLANET_BODIES = Object.freeze([
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
] as const);

export const SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES = Object.freeze([
  ...SUPPORTED_PLANET_BODIES, 'Pluto',
] as const);

export type SupportedPlanetBody = (typeof SUPPORTED_PLANET_AND_DWARF_PLANET_BODIES)[number];

export interface EquatorialPositionResult {
  readonly body: ObserverRelativeBody;
  readonly center: 'TOPOCENTRIC';
  readonly frame: 'EQD_TRUE';
  readonly coordinateClass: 'PROVIDER_APPARENT_TOPOCENTRIC';
  readonly coordinateEpoch: 'OF_DATE';
  readonly rightAscensionHours: number;
  readonly declinationDeg: number;
  readonly distanceAu: number;
  readonly units: {
    readonly rightAscension: 'sidereal-hours';
    readonly declination: 'degrees';
    readonly distance: 'AU';
    readonly direction: 'unitless';
  };
  readonly direction: CartesianUnitDirection<'EQD_TRUE'>;
  readonly provenance: ResultProvenance;
}

export interface ObserverRelativePositionResult {
  readonly body: ObserverRelativeBody;
  readonly center: 'TOPOCENTRIC';
  readonly frame: 'HORIZONTAL_ENU';
  readonly azimuthDeg: number;
  readonly altitudeDeg: number;
  readonly units: {
    readonly azimuth: 'degrees';
    readonly altitude: 'degrees';
    readonly direction: 'unitless';
  };
  readonly direction: EnuUnitDirection;
  readonly provenance: ResultProvenance;
}

/**
 * One provider-owned apparent topocentric result, kept free of rendering
 * types. Horizontal coordinates preserve below-horizon truth rather than
 * clamping a body to a display horizon.
 */
export interface ApparentTopocentricBodyResult {
  readonly kind: 'VALID_APPARENT_TOPOCENTRIC_BODY';
  readonly body: ObserverRelativeBody;
  readonly equatorial: EquatorialPositionResult;
  readonly horizontal: ObserverRelativePositionResult;
  readonly aboveHorizon: boolean;
  readonly celestialEquatorRelation: 'NORTH' | 'ON' | 'SOUTH';
  readonly correctionProfile: CorrectionProfile;
  readonly warnings: readonly [];
  readonly validity: 'VALID';
}

export interface TerrestrialTime {
  readonly inputScale: 'UTC';
  readonly outputScale: 'TT';
  readonly julianDateTt: number;
  readonly julianCenturiesSinceJ2000: number;
  readonly deltaTSeconds: number;
  readonly ut1Policy: 'UTC_APPROXIMATES_UT1';
  readonly deltaTModel: 'ASTRONOMY_ENGINE_ESPENAK_MEEUS';
  readonly providerVersion: string;
}

export interface TerrestrialTimeProvider {
  toTerrestrialTime(instant: SimulationInstant): TerrestrialTime;
}

export type RotationRow = readonly [number, number, number];

export interface TaggedRotationMatrix {
  readonly transform: 'GCRS_TO_P03_MEAN_EQUATOR_OF_DATE';
  readonly rows: readonly [RotationRow, RotationRow, RotationRow];
}

export interface MeanPoleRequest {
  readonly instant: SimulationInstant;
  readonly sourceFrame: 'GCRS';
  readonly modelReferenceEpoch: 'J2000.0';
  readonly outputFrame: 'P03_MEAN_EQUATOR_OF_DATE';
}

export interface MeanPoleProvenance {
  readonly provider: string;
  readonly providerVersion: string;
  readonly simulationInstant: SimulationInstant;
  readonly matrixSourceFrame: 'GCRS';
  readonly matrixOutputFrame: 'P03_MEAN_EQUATOR_OF_DATE';
  readonly poleVectorFrame: 'GCRS';
  readonly correctionProfile: CorrectionProfile;
}

export interface MeanPoleResult {
  readonly poleKind: 'MEAN';
  readonly model: 'IAU_P03_PRECESSION_ONLY';
  readonly modelReference: string;
  readonly referenceEpoch: 'J2000.0';
  readonly vectorFrame: 'GCRS';
  readonly meanEquatorFrame: 'P03_MEAN_EQUATOR_OF_DATE';
  readonly north: CartesianUnitDirection<'GCRS'>;
  readonly south: CartesianUnitDirection<'GCRS'>;
  readonly biasPrecessionMatrix: TaggedRotationMatrix;
  readonly correctionProfile: CorrectionProfile;
  readonly validDomain: {
    readonly minimumJulianCenturiesSinceJ2000: -1;
    readonly maximumJulianCenturiesSinceJ2000: 1;
  };
  readonly time: TerrestrialTime;
  readonly provenance: MeanPoleProvenance;
}
