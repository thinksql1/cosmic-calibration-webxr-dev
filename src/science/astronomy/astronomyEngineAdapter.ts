import {
  AstroTime,
  Body,
  DeltaT_EspenakMeeus,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  RotateVector,
  Rotation_EQD_HOR,
  Rotation_EQJ_EQD,
  Rotation_EQJ_HOR,
  SearchMoonPhase,
  SearchMoonQuarter,
  SetDeltaTFunction,
  SiderealTime,
  Vector,
  type RotationMatrix,
} from 'astronomy-engine';
import {
  APPARENT_TOPOCENTRIC_ADAPTER_VERSION,
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
} from '../providers/astronomyProviderIdentity';
import { AstronomyContractError } from './errors';
import {
  horizontalAnglesToEnu,
  normalizeCartesianDirection,
} from './frameTransforms';
import {
  CORRECTION_PROFILES,
  type CorrectionProfileId,
  type ApparentTopocentricBodyResult,
  type ApparentTopocentricEqjDirectionResult,
  type EquatorialPositionResult,
  type ObserverRelativeBody,
  type ObserverRelativePositionResult,
  type MoonPhaseProviderResult,
  type MoonPhaseEventProviderResult,
  type ResultProvenance,
  type SimulationInstant,
  type TerrestrialTime,
  type ValidatedObserver,
} from './types';

export {
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
};
const JULIAN_DATE_J2000 = 2_451_545;
const DAYS_PER_JULIAN_CENTURY = 36_525;

export type AstronomyEngineRotationRows = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

export interface AstronomyEngineRealSkyRotations {
  readonly eqjToEqdRows: AstronomyEngineRotationRows;
  readonly eqdToHorRows: AstronomyEngineRotationRows;
  readonly eqjToHorRows: AstronomyEngineRotationRows;
  readonly greenwichApparentSiderealTimeHours: number;
}

type HorizontalCorrectionProfile = Extract<
  CorrectionProfileId,
  | 'AE_APPARENT_TOPOCENTRIC_AIRLESS'
  | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
>;

function providerTime(instant: SimulationInstant): AstroTime {
  // Astronomy Engine exposes a process-global Delta-T hook. Resetting it at
  // the adapter boundary makes this contract deterministic and prevents a
  // different caller from silently selecting another model.
  SetDeltaTFunction(DeltaT_EspenakMeeus);
  return new AstroTime(new Date(instant.unixMilliseconds));
}

function providerObserver(observer: ValidatedObserver): Observer {
  if (observer.verticalDatum !== 'MEAN_SEA_LEVEL') {
    throw new AstronomyContractError(
      'UNSUPPORTED_VERTICAL_DATUM',
      'Astronomy Engine requires elevation above mean sea level; no ellipsoid-to-geoid conversion is performed by this adapter.',
    );
  }

  return new Observer(
    observer.latitudeDeg,
    observer.longitudeDegEast,
    observer.elevationMeters,
  );
}

function providerBody(body: ObserverRelativeBody): Body {
  switch (body) {
    case 'Sun': return Body.Sun;
    case 'Moon': return Body.Moon;
    case 'Mercury': return Body.Mercury;
    case 'Venus': return Body.Venus;
    case 'Mars': return Body.Mars;
    case 'Jupiter': return Body.Jupiter;
    case 'Saturn': return Body.Saturn;
    case 'Uranus': return Body.Uranus;
    case 'Neptune': return Body.Neptune;
    case 'Pluto': return Body.Pluto;
  }
}

function providerRotationRows(
  rotation: RotationMatrix,
  time: AstroTime,
): AstronomyEngineRotationRows {
  const basis = [
    new Vector(1, 0, 0, time),
    new Vector(0, 1, 0, time),
    new Vector(0, 0, 1, time),
  ].map((vector) => RotateVector(rotation, vector));
  return Object.freeze([
    Object.freeze([basis[0]!.x, basis[1]!.x, basis[2]!.x] as const),
    Object.freeze([basis[0]!.y, basis[1]!.y, basis[2]!.y] as const),
    Object.freeze([basis[0]!.z, basis[1]!.z, basis[2]!.z] as const),
  ]);
}

/** Raw provider rotations remain confined to this adapter boundary. */
export function getAstronomyEngineRealSkyRotations(
  instant: SimulationInstant,
  observer: ValidatedObserver,
): AstronomyEngineRealSkyRotations {
  const time = providerTime(instant);
  const rawObserver = providerObserver(observer);
  return Object.freeze({
    eqjToEqdRows: providerRotationRows(Rotation_EQJ_EQD(time), time),
    eqdToHorRows: providerRotationRows(Rotation_EQD_HOR(time, rawObserver), time),
    eqjToHorRows: providerRotationRows(Rotation_EQJ_HOR(time, rawObserver), time),
    greenwichApparentSiderealTimeHours: SiderealTime(time),
  });
}

function provenance(
  instant: SimulationInstant,
  observer: ValidatedObserver,
  outputFrame: 'EQD_TRUE' | 'HORIZONTAL_ENU',
  correctionProfile: HorizontalCorrectionProfile,
): ResultProvenance {
  return Object.freeze({
    provider: ASTRONOMY_ENGINE_PROVIDER,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
    adapterVersion: APPARENT_TOPOCENTRIC_ADAPTER_VERSION,
    simulationInstant: instant,
    observer,
    sourceFrame: 'EQD_TRUE',
    outputFrame,
    correctionProfile: CORRECTION_PROFILES[correctionProfile],
  });
}

export function toTerrestrialTime(
  instant: SimulationInstant,
): TerrestrialTime {
  const time = providerTime(instant);
  const deltaTSeconds = (time.tt - time.ut) * 86_400;
  const julianDateTt = JULIAN_DATE_J2000 + time.tt;

  return Object.freeze({
    inputScale: 'UTC',
    outputScale: 'TT',
    julianDateTt,
    julianCenturiesSinceJ2000:
      (julianDateTt - JULIAN_DATE_J2000) / DAYS_PER_JULIAN_CENTURY,
    deltaTSeconds,
    ut1Policy: 'UTC_APPROXIMATES_UT1',
    deltaTModel: 'ASTRONOMY_ENGINE_ESPENAK_MEEUS',
    providerVersion: ASTRONOMY_ENGINE_VERSION,
  });
}

export function getApparentTopocentricEquatorial(
  body: ObserverRelativeBody,
  instant: SimulationInstant,
  observer: ValidatedObserver,
  correctionProfile: HorizontalCorrectionProfile = 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
): EquatorialPositionResult {
  if (
    correctionProfile !== 'AE_APPARENT_TOPOCENTRIC_AIRLESS' &&
    correctionProfile !== 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
  ) {
    throw new AstronomyContractError(
      'UNSUPPORTED_CORRECTION_PROFILE',
      `Unsupported equatorial correction profile: ${String(correctionProfile)}`,
    );
  }
  const time = providerTime(instant);
  const equatorial = Equator(
    providerBody(body),
    time,
    providerObserver(observer),
    true,
    true,
  );

  return Object.freeze({
    body,
    center: 'TOPOCENTRIC',
    frame: 'EQD_TRUE',
    coordinateClass: 'PROVIDER_APPARENT_TOPOCENTRIC',
    coordinateEpoch: 'OF_DATE',
    rightAscensionHours: equatorial.ra,
    declinationDeg: equatorial.dec,
    distanceAu: equatorial.dist,
    units: Object.freeze({
      rightAscension: 'sidereal-hours',
      declination: 'degrees',
      distance: 'AU',
      direction: 'unitless',
    }),
    direction: normalizeCartesianDirection(
      'EQD_TRUE',
      equatorial.vec.x,
      equatorial.vec.y,
      equatorial.vec.z,
    ),
    provenance: provenance(
      instant,
      observer,
      'EQD_TRUE',
      correctionProfile,
    ),
  });
}

export function getObserverRelativePosition(
  body: ObserverRelativeBody,
  instant: SimulationInstant,
  observer: ValidatedObserver,
  correctionProfile: HorizontalCorrectionProfile,
): ObserverRelativePositionResult {
  if (
    correctionProfile !== 'AE_APPARENT_TOPOCENTRIC_AIRLESS' &&
    correctionProfile !== 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
  ) {
    throw new AstronomyContractError(
      'UNSUPPORTED_CORRECTION_PROFILE',
      `Unsupported horizontal correction profile: ${String(correctionProfile)}`,
    );
  }

  const time = providerTime(instant);
  const rawObserver = providerObserver(observer);
  const equatorial = Equator(
    providerBody(body),
    time,
    rawObserver,
    true,
    true,
  );
  const refraction =
    correctionProfile === 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
      ? 'normal'
      : undefined;
  const horizontal = Horizon(
    time,
    rawObserver,
    equatorial.ra,
    equatorial.dec,
    refraction,
  );

  return Object.freeze({
    body,
    center: 'TOPOCENTRIC',
    frame: 'HORIZONTAL_ENU',
    azimuthDeg: horizontal.azimuth,
    altitudeDeg: horizontal.altitude,
    units: Object.freeze({
      azimuth: 'degrees',
      altitude: 'degrees',
      direction: 'unitless',
    }),
    direction: horizontalAnglesToEnu(
      horizontal.azimuth,
      horizontal.altitude,
    ),
    provenance: provenance(
      instant,
      observer,
      'HORIZONTAL_ENU',
      correctionProfile,
    ),
  });
}

/**
 * Returns one typed actual-position result for the body layer. This is the
 * only public route that combines equatorial and horizontal provider values;
 * scene and presentation code receive no Astronomy Engine values or objects.
 */
export function getApparentTopocentricBody(
  body: ObserverRelativeBody,
  instant: SimulationInstant,
  observer: ValidatedObserver,
  correctionProfile: HorizontalCorrectionProfile,
): ApparentTopocentricBodyResult {
  const equatorial = getApparentTopocentricEquatorial(
    body,
    instant,
    observer,
    correctionProfile,
  );
  const horizontal = getObserverRelativePosition(
    body,
    instant,
    observer,
    correctionProfile,
  );
  const celestialEquatorRelation =
    equatorial.declinationDeg > 0
      ? 'NORTH'
      : equatorial.declinationDeg < 0
        ? 'SOUTH'
        : 'ON';
  return Object.freeze({
    kind: 'VALID_APPARENT_TOPOCENTRIC_BODY',
    body,
    equatorial,
    horizontal,
    aboveHorizon: horizontal.altitudeDeg >= 0,
    celestialEquatorRelation,
    correctionProfile: CORRECTION_PROFILES[correctionProfile],
    warnings: Object.freeze([]) as readonly [],
    validity: 'VALID',
  });
}

/**
 * Returns the provider's geocentric synodic phase state. The phase longitude
 * convention is 0° new, 90° first quarter, 180° full, and 270° last quarter.
 * This result is presentation metadata and never substitutes for the
 * topocentric Moon direction.
 */
export function getMoonPhaseState(
  instant: SimulationInstant,
): MoonPhaseProviderResult {
  const time = providerTime(instant);
  const phaseLongitudeDeg = MoonPhase(time);
  const illumination = Illumination(Body.Moon, time);
  const previousNewMoon = SearchMoonPhase(0, time, -35);
  const nextQuarter = SearchMoonQuarter(time);
  const values = [
    phaseLongitudeDeg,
    illumination.phase_angle,
    illumination.phase_fraction,
    previousNewMoon?.date.getTime(),
    nextQuarter.time.date.getTime(),
  ];
  if (
    !previousNewMoon ||
    !values.every((value) => Number.isFinite(value)) ||
    phaseLongitudeDeg < 0 ||
    phaseLongitudeDeg >= 360 ||
    illumination.phase_fraction < 0 ||
    illumination.phase_fraction > 1 ||
    ![0, 1, 2, 3].includes(nextQuarter.quarter)
  ) {
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Astronomy Engine returned an invalid Moon phase state.',
      Object.freeze({
        operation: 'getMoonPhaseState',
        actual: Object.freeze({
          phaseLongitudeDeg,
          phaseAngleDeg: illumination.phase_angle,
          illuminatedFraction: illumination.phase_fraction,
          previousNewMoonUtc: previousNewMoon?.date.toISOString(),
          nextPrincipalPhaseUtc: nextQuarter.time.date.toISOString(),
          nextPrincipalQuarter: nextQuarter.quarter,
        }),
      }),
    );
  }
  return Object.freeze({
    kind: 'VALID_MOON_PHASE_STATE',
    phaseLongitudeDeg,
    phaseAngleDeg: illumination.phase_angle,
    illuminatedFraction: illumination.phase_fraction,
    previousNewMoonUtc: previousNewMoon.date.toISOString(),
    nextPrincipalPhaseUtc: nextQuarter.time.date.toISOString(),
    nextPrincipalQuarter: nextQuarter.quarter as 0 | 1 | 2 | 3,
    provider: ASTRONOMY_ENGINE_PROVIDER,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
    simulationInstant: instant,
  });
}

/** Bounded provider-owned geocentric Sun-Moon ecliptic longitude difference. */
export function getMoonPhaseLongitudeDeg(instant: SimulationInstant): number {
  const value = MoonPhase(providerTime(instant));
  if (!Number.isFinite(value) || value < 0 || value >= 360) {
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Astronomy Engine returned an invalid Moon phase longitude.',
      Object.freeze({
        operation: 'getMoonPhaseLongitudeDeg',
        actual: Object.freeze({ phaseLongitudeDeg: value }),
      }),
    );
  }
  return value;
}

/**
 * Finds one authoritative geocentric phase-longitude event. Astronomy Engine
 * accepts every target in [0, 360), including the four intermediate 45-degree
 * phases used by the transit study.
 */
export function searchMoonPhaseEvent(
  targetPhaseLongitudeDeg: number,
  start: SimulationInstant,
  limitDays: number,
): MoonPhaseEventProviderResult | null {
  if (
    !Number.isFinite(targetPhaseLongitudeDeg)
    || targetPhaseLongitudeDeg < 0
    || targetPhaseLongitudeDeg >= 360
    || !Number.isFinite(limitDays)
    || limitDays === 0
  ) {
    throw new AstronomyContractError(
      'INVALID_ANGLE',
      'Moon phase-event search inputs are outside the provider contract.',
      Object.freeze({
        operation: 'searchMoonPhaseEvent',
        actual: Object.freeze({ targetPhaseLongitudeDeg, limitDays }),
      }),
    );
  }
  const event = SearchMoonPhase(targetPhaseLongitudeDeg, providerTime(start), limitDays);
  if (!event) return null;
  const eventInstant: SimulationInstant = Object.freeze({
    utcIso: event.date.toISOString(),
    unixMilliseconds: event.date.getTime(),
    source: 'frozen-test',
  });
  return Object.freeze({
    kind: 'VALID_MOON_PHASE_EVENT',
    targetPhaseLongitudeDeg,
    eventInstant,
    provider: ASTRONOMY_ENGINE_PROVIDER,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
  });
}

/**
 * Apparent topocentric Moon direction expressed in the provider's J2000 mean
 * equator/equinox (EQJ). This deliberately preserves parallax while avoiding
 * a sample-time horizontal transform.
 */
export function getApparentTopocentricEqjMoonDirection(
  instant: SimulationInstant,
  observer: ValidatedObserver,
): ApparentTopocentricEqjDirectionResult {
  const equatorial = Equator(
    Body.Moon,
    providerTime(instant),
    providerObserver(observer),
    false,
    true,
  );
  const direction = normalizeCartesianDirection(
    'EQJ_J2000',
    equatorial.vec.x,
    equatorial.vec.y,
    equatorial.vec.z,
  );
  if (
    ![
      equatorial.ra,
      equatorial.dec,
      equatorial.dist,
      direction.x,
      direction.y,
      direction.z,
    ].every(Number.isFinite)
    || equatorial.dist <= 0
  ) {
    throw new AstronomyContractError(
      'MALFORMED_PROVIDER_RESULT',
      'Astronomy Engine returned an invalid apparent topocentric EQJ Moon direction.',
      Object.freeze({
        operation: 'getApparentTopocentricEqjMoonDirection',
        actual: Object.freeze({
          rightAscensionHours: equatorial.ra,
          declinationDeg: equatorial.dec,
          distanceAu: equatorial.dist,
        }),
      }),
    );
  }
  return Object.freeze({
    kind: 'VALID_APPARENT_TOPOCENTRIC_EQJ_DIRECTION',
    body: 'Moon',
    center: 'TOPOCENTRIC',
    frame: 'EQJ_J2000',
    coordinateClass: 'PROVIDER_APPARENT_TOPOCENTRIC',
    rightAscensionHours: equatorial.ra,
    declinationDeg: equatorial.dec,
    distanceAu: equatorial.dist,
    direction,
    simulationInstant: instant,
    observer,
    provider: ASTRONOMY_ENGINE_PROVIDER,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
    aberration: 'included',
    lightTime: 'included',
    topocentricParallax: 'included',
  });
}
