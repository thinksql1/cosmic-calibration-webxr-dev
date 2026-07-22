import {
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type CorrectionProfileId,
  type ObserverRelativeBody,
} from '../astronomy/types';

export const ASTRONOMY_ENGINE_PROVIDER = 'Astronomy Engine' as const;
export const ASTRONOMY_ENGINE_VERSION = '2.1.19' as const;
export const APPARENT_TOPOCENTRIC_ADAPTER_VERSION = '1.1.0' as const;
export const APPARENT_TOPOCENTRIC_PROVIDER_ID =
  'ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_V2' as const;
export const APPARENT_TOPOCENTRIC_BODY_SET_ID =
  'SUN_MOON_MERCURY_VENUS_MARS_JUPITER_SATURN_URANUS_NEPTUNE_PLUTO_V2' as const;

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

/**
 * Serializable, recursively immutable diagnostic copy. This deliberately
 * contains no registry function or provider implementation reference.
 */
export interface AstronomyProviderIdentityDiagnostic extends Readonly<Record<string, unknown>> {
  readonly id: string | undefined;
  readonly provider: string | undefined;
  readonly providerVersion: string | undefined;
  readonly adapterVersion: string | undefined;
  readonly bodySetId: string | undefined;
  readonly supportedBodies: readonly string[];
  readonly supportedCorrectionProfiles: readonly string[];
  readonly equatorialSourceFrame: string | undefined;
  readonly equatorialOutputFrame: string | undefined;
  readonly horizontalSourceFrame: string | undefined;
  readonly horizontalOutputFrame: string | undefined;
  readonly identityFrozen: boolean;
  readonly supportedBodiesFrozen: boolean;
  readonly supportedCorrectionProfilesFrozen: boolean;
}

export type AstronomyProviderIdentityMismatchField =
  | 'id'
  | 'provider'
  | 'providerVersion'
  | 'adapterVersion'
  | 'bodySetId'
  | 'supportedBodies'
  | 'supportedCorrectionProfiles'
  | 'equatorialSourceFrame'
  | 'equatorialOutputFrame'
  | 'horizontalSourceFrame'
  | 'horizontalOutputFrame'
  | 'identityFrozen'
  | 'supportedBodiesFrozen'
  | 'supportedCorrectionProfilesFrozen';

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

function diagnosticString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function diagnosticStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map((entry) =>
    typeof entry === 'string' ? entry : `[non-string:${typeof entry}]`));
}

/** Creates a detached immutable diagnostic copy from a provider descriptor. */
export function createAstronomyProviderIdentityDiagnostic(
  identity: unknown,
): AstronomyProviderIdentityDiagnostic {
  const candidate = typeof identity === 'object' && identity !== null
    ? identity as Record<string, unknown>
    : undefined;
  const supportedBodies = candidate?.supportedBodies;
  const supportedCorrectionProfiles = candidate?.supportedCorrectionProfiles;
  return Object.freeze({
    id: diagnosticString(candidate?.id),
    provider: diagnosticString(candidate?.provider),
    providerVersion: diagnosticString(candidate?.providerVersion),
    adapterVersion: diagnosticString(candidate?.adapterVersion),
    bodySetId: diagnosticString(candidate?.bodySetId),
    supportedBodies: diagnosticStringArray(supportedBodies),
    supportedCorrectionProfiles: diagnosticStringArray(supportedCorrectionProfiles),
    equatorialSourceFrame: diagnosticString(candidate?.equatorialSourceFrame),
    equatorialOutputFrame: diagnosticString(candidate?.equatorialOutputFrame),
    horizontalSourceFrame: diagnosticString(candidate?.horizontalSourceFrame),
    horizontalOutputFrame: diagnosticString(candidate?.horizontalOutputFrame),
    identityFrozen: Boolean(candidate && Object.isFrozen(identity)),
    supportedBodiesFrozen: Array.isArray(supportedBodies) && Object.isFrozen(supportedBodies),
    supportedCorrectionProfilesFrozen: Array.isArray(supportedCorrectionProfiles) &&
      Object.isFrozen(supportedCorrectionProfiles),
  });
}

/** Lists every semantic descriptor difference in a stable, duplicate-free order. */
export function findAstronomyProviderIdentityMismatches(
  expectedIdentity: unknown,
  actualIdentity: unknown,
): readonly AstronomyProviderIdentityMismatchField[] {
  const expected = createAstronomyProviderIdentityDiagnostic(expectedIdentity);
  const actual = createAstronomyProviderIdentityDiagnostic(actualIdentity);
  const fields: AstronomyProviderIdentityMismatchField[] = [];
  const scalarFields: readonly AstronomyProviderIdentityMismatchField[] = Object.freeze([
    'id',
    'provider',
    'providerVersion',
    'adapterVersion',
    'bodySetId',
    'equatorialSourceFrame',
    'equatorialOutputFrame',
    'horizontalSourceFrame',
    'horizontalOutputFrame',
    'identityFrozen',
    'supportedBodiesFrozen',
    'supportedCorrectionProfilesFrozen',
  ]);
  for (const field of scalarFields) {
    if (expected[field] !== actual[field]) fields.push(field);
  }
  if (!sameOrderedValues(expected.supportedBodies, actual.supportedBodies)) {
    fields.push('supportedBodies');
  }
  if (!sameOrderedValues(expected.supportedCorrectionProfiles, actual.supportedCorrectionProfiles)) {
    fields.push('supportedCorrectionProfiles');
  }
  return Object.freeze(fields);
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
