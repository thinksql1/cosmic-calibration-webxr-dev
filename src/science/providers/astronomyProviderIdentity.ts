import {
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type CorrectionProfileId,
  type ObserverRelativeBody,
} from '../astronomy/types';

export const ASTRONOMY_ENGINE_PROVIDER = 'Astronomy Engine' as const;
export const ASTRONOMY_ENGINE_VERSION = '2.1.19' as const;
export const APPARENT_TOPOCENTRIC_ADAPTER_VERSION = '1.0.0' as const;
export const APPARENT_TOPOCENTRIC_PROVIDER_ID =
  'ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_V1' as const;
export const APPARENT_TOPOCENTRIC_BODY_SET_ID =
  'SUN_MOON_MERCURY_VENUS_MARS_JUPITER_SATURN_V1' as const;

export type ApparentTopocentricCorrectionProfile = Extract<
  CorrectionProfileId,
  | 'AE_APPARENT_TOPOCENTRIC_AIRLESS'
  | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'
>;

/**
 * Immutable identity and capability descriptor for the one validated body
 * adapter. Snapshots, registry calls, result provenance, and body-cache keys
 * must all agree on this complete value.
 */
export interface AstronomyProviderIdentity {
  readonly id: typeof APPARENT_TOPOCENTRIC_PROVIDER_ID;
  readonly provider: typeof ASTRONOMY_ENGINE_PROVIDER;
  readonly providerVersion: typeof ASTRONOMY_ENGINE_VERSION;
  readonly adapterVersion: typeof APPARENT_TOPOCENTRIC_ADAPTER_VERSION;
  readonly bodySetId: typeof APPARENT_TOPOCENTRIC_BODY_SET_ID;
  readonly supportedBodies: readonly ObserverRelativeBody[];
  readonly supportedCorrectionProfiles: readonly ApparentTopocentricCorrectionProfile[];
  readonly equatorialSourceFrame: 'EQD_TRUE';
  readonly equatorialOutputFrame: 'EQD_TRUE';
  readonly horizontalSourceFrame: 'EQD_TRUE';
  readonly horizontalOutputFrame: 'HORIZONTAL_ENU';
}

const SUPPORTED_PROFILES = Object.freeze([
  'AE_APPARENT_TOPOCENTRIC_AIRLESS',
  'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION',
] as const);

export const ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY: AstronomyProviderIdentity =
  Object.freeze({
    id: APPARENT_TOPOCENTRIC_PROVIDER_ID,
    provider: ASTRONOMY_ENGINE_PROVIDER,
    providerVersion: ASTRONOMY_ENGINE_VERSION,
    adapterVersion: APPARENT_TOPOCENTRIC_ADAPTER_VERSION,
    bodySetId: APPARENT_TOPOCENTRIC_BODY_SET_ID,
    supportedBodies: Object.freeze([...SUPPORTED_SOLAR_SYSTEM_BODIES]),
    supportedCorrectionProfiles: SUPPORTED_PROFILES,
    equatorialSourceFrame: 'EQD_TRUE',
    equatorialOutputFrame: 'EQD_TRUE',
    horizontalSourceFrame: 'EQD_TRUE',
    horizontalOutputFrame: 'HORIZONTAL_ENU',
  });

function sameOrderedValues<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function hasIdentityShape(value: unknown): value is AstronomyProviderIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.provider === 'string' &&
    typeof candidate.providerVersion === 'string' &&
    typeof candidate.adapterVersion === 'string' &&
    typeof candidate.bodySetId === 'string' &&
    typeof candidate.equatorialSourceFrame === 'string' &&
    typeof candidate.equatorialOutputFrame === 'string' &&
    typeof candidate.horizontalSourceFrame === 'string' &&
    typeof candidate.horizontalOutputFrame === 'string' &&
    Array.isArray(candidate.supportedBodies) &&
    Array.isArray(candidate.supportedCorrectionProfiles)
  );
}

export function sameAstronomyProviderIdentity(
  left: AstronomyProviderIdentity,
  right: AstronomyProviderIdentity,
): boolean {
  return (
    hasIdentityShape(left) &&
    hasIdentityShape(right) &&
    left.id === right.id &&
    left.provider === right.provider &&
    left.providerVersion === right.providerVersion &&
    left.adapterVersion === right.adapterVersion &&
    left.bodySetId === right.bodySetId &&
    left.equatorialSourceFrame === right.equatorialSourceFrame &&
    left.equatorialOutputFrame === right.equatorialOutputFrame &&
    left.horizontalSourceFrame === right.horizontalSourceFrame &&
    left.horizontalOutputFrame === right.horizontalOutputFrame &&
    sameOrderedValues(left.supportedBodies, right.supportedBodies) &&
    sameOrderedValues(left.supportedCorrectionProfiles, right.supportedCorrectionProfiles)
  );
}

export function supportsBodyCorrectionProfile(
  identity: AstronomyProviderIdentity,
  profile: ApparentTopocentricCorrectionProfile,
): boolean {
  return identity.supportedCorrectionProfiles.includes(profile);
}

export function isValidatedAstronomyProviderIdentity(
  identity: unknown,
): identity is AstronomyProviderIdentity {
  return (
    hasIdentityShape(identity) &&
    Object.isFrozen(identity) &&
    Object.isFrozen(identity.supportedBodies) &&
    Object.isFrozen(identity.supportedCorrectionProfiles) &&
    sameAstronomyProviderIdentity(
      identity as AstronomyProviderIdentity,
      ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
    )
  );
}
