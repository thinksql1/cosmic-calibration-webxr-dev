import type { ApplicationBasisDirection, ApplicationBasisPosition } from './mapEnuToApplicationBasis';
import type { ObserverOffsetGeocentricPresentation } from './observerOffsetGeocentricPresentation';

export const FINITE_CORE_PARALLAX_MODE = 'finite-parallax' as const;
export const FINITE_CORE_PARALLAX_DEFAULT_DISTANCE_METERS = 2.5;
/** The Quest-selected normal development presentation distance. */
export const FINITE_CORE_PARALLAX_NORMAL_DISTANCE_METERS = 4.0;
export const FINITE_CORE_PARALLAX_PROXY_RADIUS_METERS = 0.06;
export const FINITE_CORE_PARALLAX_DISTANCE_PRESETS = Object.freeze({
  near: 1.5,
  medium: FINITE_CORE_PARALLAX_DEFAULT_DISTANCE_METERS,
  far: 4.0,
} as const);

export type FiniteCoreParallaxDistancePreset = keyof typeof FINITE_CORE_PARALLAX_DISTANCE_PRESETS;
export type EarthCorePresentation = 'none' | 'scientific-marker' | 'finite-proxy';

/**
 * The Earth Core setting is the final visibility authority. A study may select
 * the retained scientific comparison marker, but it cannot bypass Core OFF.
 */
export function selectEarthCorePresentation(
  earthCoreEnabled: boolean,
  requestedMode: string,
): EarthCorePresentation {
  if (!earthCoreEnabled) return 'none';
  return requestedMode === 'baseline' ? 'scientific-marker' : 'finite-proxy';
}

export interface FiniteCoreParallaxLaunch {
  readonly enabled: boolean;
  readonly explicitlyRequested: boolean;
  readonly mode: 'baseline' | typeof FINITE_CORE_PARALLAX_MODE;
  readonly distancePreset: FiniteCoreParallaxDistancePreset;
  readonly distanceMeters: number;
}

export interface FiniteCoreParallaxModel {
  readonly kind: 'FINITE_CORE_PARALLAX_MODEL';
  readonly sourceContract: ObserverOffsetGeocentricPresentation;
  readonly scientificEarthCore: ApplicationBasisPosition;
  readonly scientificObserver: ApplicationBasisPosition;
  readonly scientificObserverToCoreDirection: ApplicationBasisDirection;
  readonly scientificObserverToCoreDistanceMeters: number;
  readonly proxyPositionMeters: ApplicationBasisPosition;
  readonly proxyDistanceMeters: number;
  readonly proxyRadiusMeters: number;
}

export interface FiniteCoreParallaxFailure {
  readonly kind: 'not-ready';
  readonly reason: 'INVALID_CONTRACT' | 'INVALID_DIRECTION' | 'INVALID_DISTANCE' | 'INVALID_POSITION';
  readonly detail: string;
}

export type FiniteCoreParallaxModelResult = FiniteCoreParallaxModel | FiniteCoreParallaxFailure;

function finite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function failure(
  reason: FiniteCoreParallaxFailure['reason'],
  detail: string,
): FiniteCoreParallaxFailure {
  return Object.freeze({ kind: 'not-ready', reason, detail });
}

function presetFrom(raw: string | null): FiniteCoreParallaxDistancePreset {
  if (raw && Object.hasOwn(FINITE_CORE_PARALLAX_DISTANCE_PRESETS, raw)) {
    return raw as FiniteCoreParallaxDistancePreset;
  }
  const numeric = raw === null ? Number.NaN : Number(raw);
  const matched = (Object.entries(FINITE_CORE_PARALLAX_DISTANCE_PRESETS) as Array<
    [FiniteCoreParallaxDistancePreset, number]
  >).find(([, distance]) => numeric === distance);
  return matched?.[0] ?? 'medium';
}

export function parseFiniteCoreParallaxLaunch(search: string): FiniteCoreParallaxLaunch {
  const params = new URLSearchParams(search);
  const requestedMode = params.get('coreStudy');
  const enabled = requestedMode === FINITE_CORE_PARALLAX_MODE;
  const distancePreset = presetFrom(params.get('coreDistance'));
  return Object.freeze({
    enabled,
    explicitlyRequested: requestedMode === 'baseline' || enabled,
    mode: enabled ? FINITE_CORE_PARALLAX_MODE : 'baseline',
    distancePreset,
    distanceMeters: FINITE_CORE_PARALLAX_DISTANCE_PRESETS[distancePreset],
  });
}

export function finiteCoreParallaxDistancePreset(
  value: string,
): FiniteCoreParallaxDistancePreset {
  return presetFrom(value);
}

/**
 * Builds a deliberately compressed, local-meter proxy. The direction comes
 * exclusively from the scientific observer-to-core vector; the resulting
 * point is a presentation aid and is not the scientific Earth-core position.
 */
export function createFiniteCoreParallaxModel(
  contract: ObserverOffsetGeocentricPresentation,
  distanceMeters: number,
): FiniteCoreParallaxModelResult {
  if (contract.kind !== 'OBSERVER_OFFSET_GEOCENTRIC_PRESENTATION' || contract.validity !== 'VALIDATED') {
    return failure('INVALID_CONTRACT', 'Finite core parallax requires the validated observer-offset contract.');
  }
  if (!Object.values(FINITE_CORE_PARALLAX_DISTANCE_PRESETS).includes(distanceMeters as 1.5 | 2.5 | 4)) {
    return failure('INVALID_DISTANCE', 'Finite core parallax distance must be a supported bounded preset.');
  }
  const vector = contract.scientificObserverToCore;
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (!finite([vector.x, vector.y, vector.z, length]) || length <= 0) {
    return failure('INVALID_DIRECTION', 'Scientific observer-to-core direction must be finite and non-zero.');
  }
  const direction = Object.freeze({
    frame: 'APPLICATION_BASIS' as const,
    units: 'unitless' as const,
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  });
  const observer = contract.scientificObserver;
  const position = Object.freeze({
    frame: 'APPLICATION_BASIS' as const,
    units: 'meters' as const,
    x: observer.x + direction.x * distanceMeters,
    y: observer.y + direction.y * distanceMeters,
    z: observer.z + direction.z * distanceMeters,
  });
  if (!finite([position.x, position.y, position.z])) {
    return failure('INVALID_POSITION', 'Finite core parallax proxy position must remain finite.');
  }
  return Object.freeze({
    kind: 'FINITE_CORE_PARALLAX_MODEL',
    sourceContract: contract,
    scientificEarthCore: contract.scientificEarthCore,
    scientificObserver: observer,
    scientificObserverToCoreDirection: direction,
    scientificObserverToCoreDistanceMeters: contract.scientificObserverToCoreDistanceMeters,
    proxyPositionMeters: position,
    proxyDistanceMeters: distanceMeters,
    proxyRadiusMeters: FINITE_CORE_PARALLAX_PROXY_RADIUS_METERS,
  });
}
