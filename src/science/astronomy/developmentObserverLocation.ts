import type { ObserverInput } from './types';

/**
 * Development-only initial observer location. Longitude is east-positive, so
 * Swartz Creek, Michigan is negative (west); elevation is meters MSL.
 * This is intentionally an initial-session default, not geolocation or
 * persisted user preference.
 */
export const DEVELOPMENT_DEFAULT_OBSERVER_LOCATION = Object.freeze({
  latitudeDeg: 42.9572,
  longitudeDegEast: -83.8308,
  elevationMeters: 240,
  horizontalDatum: 'WGS84',
  verticalDatum: 'MEAN_SEA_LEVEL',
} satisfies Pick<ObserverInput, 'latitudeDeg' | 'longitudeDegEast' | 'elevationMeters' | 'horizontalDatum' | 'verticalDatum'>);

export function developmentObserverLocationInput(source: string): ObserverInput {
  return Object.freeze({ ...DEVELOPMENT_DEFAULT_OBSERVER_LOCATION, source });
}
