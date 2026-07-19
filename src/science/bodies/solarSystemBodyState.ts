import { AstronomyContractError } from '../astronomy/errors';
import {
  CORRECTION_PROFILES,
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type ApparentTopocentricBodyResult,
  type CorrectionProfile,
  type EquatorialPositionResult,
  type ObserverRelativeBody,
  type ObserverRelativePositionResult,
  type ResultProvenance,
  type SimulationInstant,
  type ValidatedObserver,
} from '../astronomy/types';
import {
  createAstronomyProviderIdentityDiagnostic,
  findAstronomyProviderIdentityMismatches,
  isValidatedAstronomyProviderIdentity,
  sameAstronomyProviderIdentity,
  supportsBodyCorrectionProfile,
  type AstronomyProviderIdentity,
  type ApparentTopocentricCorrectionProfile,
} from '../providers/astronomyProviderIdentity';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { ScientificSnapshot } from '../snapshot/scientificSnapshot';

export const VISIBLE_SOLAR_SYSTEM_BODIES = SUPPORTED_SOLAR_SYSTEM_BODIES;
const MAX_CACHED_FROZEN_STATES = 12;

export interface SolarSystemBodyState {
  readonly kind: 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE';
  readonly cacheKey: string;
  readonly bodies: readonly ApparentTopocentricBodyResult[];
  readonly correctionProfile: ApparentTopocentricCorrectionProfile;
  readonly provenance: {
    readonly identity: AstronomyProviderIdentity;
    readonly sourceFrame: 'EQD_TRUE';
    readonly outputFrame: 'HORIZONTAL_ENU';
    readonly simulationInstantUtc: string;
  };
  readonly snapshotIdentity: {
    readonly observerRevision: number;
    readonly timeRevision: number;
    readonly configurationRevision: number;
    readonly instantUtc: string;
  };
}

export function immutableClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => immutableClone(entry))) as T;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.freeze(Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        immutableClone(entry),
      ]),
    )) as T;
  }
  return value;
}

function providerMismatch(
  message: string,
  expected: AstronomyProviderIdentity,
  actual: unknown,
): never {
  throw new AstronomyContractError(
    'PROVIDER_IDENTITY_MISMATCH',
    message,
    Object.freeze({
      operation: 'SolarSystemBodyStateService.capture',
      expected: createAstronomyProviderIdentityDiagnostic(expected),
      actual: createAstronomyProviderIdentityDiagnostic(actual),
      mismatchedFields: findAstronomyProviderIdentityMismatches(expected, actual),
    }),
  );
}

function malformedResult(
  message: string,
  expected: Readonly<Record<string, unknown>>,
  actual: Readonly<Record<string, unknown>>,
): never {
  throw new AstronomyContractError(
    'MALFORMED_PROVIDER_RESULT',
    message,
    Object.freeze({
      operation: 'SolarSystemBodyStateService.capture',
      expected,
      actual,
    }),
  );
}

function sameInstant(left: SimulationInstant | undefined, right: SimulationInstant): boolean {
  return Boolean(
    left &&
    left.utcIso === right.utcIso &&
    left.unixMilliseconds === right.unixMilliseconds &&
    left.source === right.source,
  );
}

function sameObserver(left: ValidatedObserver | undefined, right: ValidatedObserver): boolean {
  return Boolean(
    left &&
    left.kind === right.kind &&
    left.latitudeDeg === right.latitudeDeg &&
    left.longitudeDegEast === right.longitudeDegEast &&
    left.elevationMeters === right.elevationMeters &&
    left.horizontalDatum === right.horizontalDatum &&
    left.verticalDatum === right.verticalDatum &&
    left.source === right.source &&
    left.uncertainty?.horizontalMeters === right.uncertainty?.horizontalMeters &&
    left.uncertainty?.verticalMeters === right.uncertainty?.verticalMeters,
  );
}

function sameCorrectionProfile(left: CorrectionProfile | undefined, right: CorrectionProfile): boolean {
  return Boolean(
    left &&
    left.id === right.id &&
    left.lightTime === right.lightTime &&
    left.topocentricParallax === right.topocentricParallax &&
    left.aberration === right.aberration &&
    left.gravitationalDeflection === right.gravitationalDeflection &&
    left.frameBias === right.frameBias &&
    left.precession === right.precession &&
    left.nutation === right.nutation &&
    left.refraction === right.refraction &&
    left.polarMotion === right.polarMotion,
  );
}

function unitLength(direction: { readonly x?: number; readonly y?: number; readonly z?: number; readonly east?: number; readonly north?: number; readonly up?: number }): number {
  if ('east' in direction) {
    return Math.hypot(direction.east ?? Number.NaN, direction.north ?? Number.NaN, direction.up ?? Number.NaN);
  }
  return Math.hypot(direction.x ?? Number.NaN, direction.y ?? Number.NaN, direction.z ?? Number.NaN);
}

function assertProvenance(
  provenance: ResultProvenance | undefined,
  identity: AstronomyProviderIdentity,
  observer: ValidatedObserver,
  instant: SimulationInstant,
  profile: CorrectionProfile,
  outputFrame: 'EQD_TRUE' | 'HORIZONTAL_ENU',
  operation: 'equatorial' | 'horizontal',
): void {
  const actual = provenance;
  if (
    !actual ||
    actual.provider !== identity.provider ||
    actual.providerVersion !== identity.providerVersion ||
    actual.adapterVersion !== identity.adapterVersion ||
    actual.sourceFrame !== identity.equatorialSourceFrame ||
    actual.outputFrame !== outputFrame ||
    !sameInstant(actual.simulationInstant, instant) ||
    !sameObserver(actual.observer, observer) ||
    !sameCorrectionProfile(actual.correctionProfile, profile)
  ) {
    malformedResult(
      `Solar-system ${operation} provenance does not match the requested provider contract.`,
      Object.freeze({
        provider: identity.provider,
        providerVersion: identity.providerVersion,
        adapterVersion: identity.adapterVersion,
        sourceFrame: identity.equatorialSourceFrame,
        outputFrame,
        instantUtc: instant.utcIso,
        correctionProfile: profile.id,
      }),
      Object.freeze({
        provider: actual?.provider,
        providerVersion: actual?.providerVersion,
        adapterVersion: actual?.adapterVersion,
        sourceFrame: actual?.sourceFrame,
        outputFrame: actual?.outputFrame,
        instantUtc: actual?.simulationInstant?.utcIso,
        correctionProfile: actual?.correctionProfile?.id,
      }),
    );
  }
}

function assertEquatorialResult(
  result: EquatorialPositionResult,
  body: ObserverRelativeBody,
  identity: AstronomyProviderIdentity,
  observer: ValidatedObserver,
  instant: SimulationInstant,
  profile: CorrectionProfile,
): void {
  if (
    result.body !== body ||
    result.center !== 'TOPOCENTRIC' ||
    result.frame !== identity.equatorialOutputFrame ||
    result.coordinateClass !== 'PROVIDER_APPARENT_TOPOCENTRIC' ||
    result.coordinateEpoch !== 'OF_DATE' ||
    result.units.rightAscension !== 'sidereal-hours' ||
    result.units.declination !== 'degrees' ||
    result.units.distance !== 'AU' ||
    result.units.direction !== 'unitless' ||
    result.direction.frame !== identity.equatorialOutputFrame ||
    result.direction.units !== 'unitless' ||
    ![
      result.rightAscensionHours,
      result.declinationDeg,
      result.distanceAu,
      result.direction.x,
      result.direction.y,
      result.direction.z,
    ].every(Number.isFinite) ||
    result.distanceAu < 0 ||
    Math.abs(result.declinationDeg) > 90 ||
    Math.abs(unitLength(result.direction) - 1) > 1e-10
  ) {
    malformedResult(
      'Solar-system equatorial result violates the EQD_TRUE body contract.',
      Object.freeze({ body, frame: identity.equatorialOutputFrame, units: 'sidereal-hours/degrees/AU/unitless' }),
      Object.freeze({ body: result.body, frame: result.frame }),
    );
  }
  assertProvenance(result.provenance, identity, observer, instant, profile, 'EQD_TRUE', 'equatorial');
}

function assertHorizontalResult(
  result: ObserverRelativePositionResult,
  body: ObserverRelativeBody,
  identity: AstronomyProviderIdentity,
  observer: ValidatedObserver,
  instant: SimulationInstant,
  profile: CorrectionProfile,
): void {
  if (
    result.body !== body ||
    result.center !== 'TOPOCENTRIC' ||
    result.frame !== identity.horizontalOutputFrame ||
    result.units.azimuth !== 'degrees' ||
    result.units.altitude !== 'degrees' ||
    result.units.direction !== 'unitless' ||
    result.direction.frame !== identity.horizontalOutputFrame ||
    result.direction.units !== 'unitless' ||
    ![
      result.azimuthDeg,
      result.altitudeDeg,
      result.direction.east,
      result.direction.north,
      result.direction.up,
    ].every(Number.isFinite) ||
    result.azimuthDeg < 0 || result.azimuthDeg > 360 ||
    result.altitudeDeg < -90 || result.altitudeDeg > 90 ||
    Math.abs(unitLength(result.direction) - 1) > 1e-10
  ) {
    malformedResult(
      'Solar-system horizontal result violates the HORIZONTAL_ENU body contract.',
      Object.freeze({ body, frame: identity.horizontalOutputFrame, units: 'degrees/degrees/unitless' }),
      Object.freeze({ body: result.body, frame: result.frame }),
    );
  }
  assertProvenance(result.provenance, identity, observer, instant, profile, 'HORIZONTAL_ENU', 'horizontal');
}

export function assertValidApparentTopocentricBodyResult(
  result: ApparentTopocentricBodyResult,
  body: ObserverRelativeBody,
  identity: AstronomyProviderIdentity,
  snapshot: ScientificSnapshot,
): void {
  try {
    const profile = CORRECTION_PROFILES[snapshot.configuration.bodyCorrectionProfile];
    const equatorial = result.equatorial;
    const horizontal = result.horizontal;
    const relation = equatorial.declinationDeg > 0
      ? 'NORTH'
      : equatorial.declinationDeg < 0
        ? 'SOUTH'
        : 'ON';
    if (
      result.kind !== 'VALID_APPARENT_TOPOCENTRIC_BODY' ||
      result.validity !== 'VALID' ||
      result.body !== body ||
      !sameCorrectionProfile(result.correctionProfile, profile) ||
      result.aboveHorizon !== (horizontal.altitudeDeg >= 0) ||
      result.celestialEquatorRelation !== relation ||
      !Array.isArray(result.warnings) ||
      result.warnings.length !== 0
    ) {
      malformedResult(
        'Solar-system body wrapper does not agree with its requested operation.',
        Object.freeze({ body, correctionProfile: profile.id }),
        Object.freeze({ body: result.body, correctionProfile: result.correctionProfile?.id }),
      );
    }
    assertEquatorialResult(
      equatorial,
      body,
      identity,
      snapshot.observer.observer,
      snapshot.clock.instant,
      profile,
    );
    assertHorizontalResult(
      horizontal,
      body,
      identity,
      snapshot.observer.observer,
      snapshot.clock.instant,
      profile,
    );
  } catch (error) {
    if (error instanceof AstronomyContractError) throw error;
    malformedResult(
      'Solar-system provider returned an incomplete or malformed body result.',
      Object.freeze({ body }),
      Object.freeze({ error: error instanceof Error ? error.message : String(error) }),
    );
  }
}

export function assertActiveProviderIdentity(
  snapshot: ScientificSnapshot,
  providers: ScientificProviderRegistry,
): AstronomyProviderIdentity {
  const expected = snapshot.providers.astronomy;
  const actual: unknown = providers.astronomy.identity;
  if (!isValidatedAstronomyProviderIdentity(expected)) {
    malformedResult(
      'Scientific snapshot has no validated astronomy provider identity.',
      Object.freeze({ identity: 'validated Astronomy Engine apparent-topocentric identity' }),
      Object.freeze({ identity: expected }),
    );
  }
  if (!isValidatedAstronomyProviderIdentity(actual) || !sameAstronomyProviderIdentity(actual, expected)) {
    providerMismatch(
      'Active astronomy provider identity must match the immutable scientific snapshot identity.',
      expected,
      actual,
    );
  }
  const activeProvider = actual;
  if (
    !snapshot.configuration.enabledProviders.includes(activeProvider.provider) ||
    !supportsBodyCorrectionProfile(activeProvider, snapshot.configuration.bodyCorrectionProfile) ||
    typeof providers.astronomy.getApparentTopocentricBody !== 'function'
  ) {
    throw new AstronomyContractError(
      'UNSUPPORTED_PROVIDER_CAPABILITY',
      'Active astronomy provider does not support the configured actual-body operation.',
      Object.freeze({
        operation: 'SolarSystemBodyStateService.capture',
        expected: Object.freeze({
          provider: activeProvider.provider,
          correctionProfile: snapshot.configuration.bodyCorrectionProfile,
          bodySetId: activeProvider.bodySetId,
        }),
        actual: Object.freeze({
          configuredProviders: snapshot.configuration.enabledProviders,
          supportedCorrectionProfiles: activeProvider.supportedCorrectionProfiles,
          hasBodyOperation: typeof providers.astronomy.getApparentTopocentricBody === 'function',
        }),
      }),
    );
  }
  return activeProvider;
}

/** Builds cache identity from the actively validated provider, never stale snapshot strings. */
export function createSolarSystemBodyCacheKey(
  snapshot: ScientificSnapshot,
  activeProvider: AstronomyProviderIdentity,
): string {
  return JSON.stringify({
    observer: snapshot.observer.observer,
    observerRevision: snapshot.revisions.observer,
    instantUtc: snapshot.clock.instant.utcIso,
    instantSource: snapshot.clock.instant.source,
    clockVersion: snapshot.clock.version,
    clockMode: snapshot.clock.mode,
    clockPaused: snapshot.clock.paused,
    timeRate: snapshot.clock.timeRate,
    timeRevision: snapshot.revisions.time,
    configurationRevision: snapshot.revisions.configuration,
    correctionProfile: snapshot.configuration.bodyCorrectionProfile,
    activeProvider,
    bodySetId: activeProvider.bodySetId,
    bodies: VISIBLE_SOLAR_SYSTEM_BODIES,
    framePolicy: Object.freeze({
      equatorialSourceFrame: activeProvider.equatorialSourceFrame,
      equatorialOutputFrame: activeProvider.equatorialOutputFrame,
      horizontalSourceFrame: activeProvider.horizontalSourceFrame,
      horizontalOutputFrame: activeProvider.horizontalOutputFrame,
    }),
  });
}

function isCacheable(snapshot: ScientificSnapshot): boolean {
  return snapshot.clock.mode === 'frozen' || snapshot.clock.paused;
}

/**
 * Derived body state deliberately lives outside the structural P03 snapshot:
 * it has its own bounded, explicit observer/time/configuration/provider cache
 * identity and never reads ambient time or rendering state.
 */
export class SolarSystemBodyStateService {
  private readonly frozenCache = new Map<string, SolarSystemBodyState>();

  constructor(private readonly providers: ScientificProviderRegistry) {}

  capture(snapshot: ScientificSnapshot): SolarSystemBodyState {
    const activeProvider = assertActiveProviderIdentity(snapshot, this.providers);
    const cacheKey = createSolarSystemBodyCacheKey(snapshot, activeProvider);
    if (isCacheable(snapshot)) {
      const cached = this.frozenCache.get(cacheKey);
      if (cached) return cached;
    }

    const bodies = Object.freeze(VISIBLE_SOLAR_SYSTEM_BODIES.map((body) => {
      const result = this.providers.astronomy.getApparentTopocentricBody(
        body,
        snapshot.clock.instant,
        snapshot.observer.observer,
        snapshot.configuration.bodyCorrectionProfile,
      );
      assertValidApparentTopocentricBodyResult(result, body, activeProvider, snapshot);
      return immutableClone(result);
    }));
    const state = immutableClone({
      kind: 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE' as const,
      cacheKey,
      bodies,
      correctionProfile: snapshot.configuration.bodyCorrectionProfile,
      provenance: {
        identity: activeProvider,
        sourceFrame: 'EQD_TRUE' as const,
        outputFrame: 'HORIZONTAL_ENU' as const,
        simulationInstantUtc: snapshot.clock.instant.utcIso,
      },
      snapshotIdentity: {
        observerRevision: snapshot.revisions.observer,
        timeRevision: snapshot.revisions.time,
        configurationRevision: snapshot.revisions.configuration,
        instantUtc: snapshot.clock.instant.utcIso,
      },
    });
    if (isCacheable(snapshot)) {
      this.frozenCache.set(cacheKey, state);
      if (this.frozenCache.size > MAX_CACHED_FROZEN_STATES) {
        const oldest = this.frozenCache.keys().next().value as string | undefined;
        if (oldest) this.frozenCache.delete(oldest);
      }
    }
    return state;
  }

  clearCache(): void {
    this.frozenCache.clear();
  }

  get cacheSize(): number {
    return this.frozenCache.size;
  }
}
