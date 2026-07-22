import {
  AstroTime,
  Body,
  DeltaT_EspenakMeeus,
  Equator,
  Horizon,
  Observer,
  SetDeltaTFunction,
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
  type EquatorialPositionResult,
  type ObserverRelativeBody,
  type ObserverRelativePositionResult,
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
