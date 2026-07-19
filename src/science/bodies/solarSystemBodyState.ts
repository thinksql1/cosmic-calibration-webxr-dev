import {
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type ApparentTopocentricBodyResult,
  type ObserverRelativeBody,
} from '../astronomy/types';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { ScientificSnapshot } from '../snapshot/scientificSnapshot';

export const VISIBLE_SOLAR_SYSTEM_BODIES = SUPPORTED_SOLAR_SYSTEM_BODIES;
const MAX_CACHED_FROZEN_STATES = 12;

export interface SolarSystemBodyState {
  readonly kind: 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE';
  readonly cacheKey: string;
  readonly bodies: readonly ApparentTopocentricBodyResult[];
  readonly correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION';
  readonly provenance: {
    readonly provider: string;
    readonly providerVersion: string;
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

function createCacheKey(snapshot: ScientificSnapshot): string {
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
    astronomyProvider: snapshot.providers.astronomyEngineVersion,
    bodies: VISIBLE_SOLAR_SYSTEM_BODIES,
  });
}

function isCacheable(snapshot: ScientificSnapshot): boolean {
  return snapshot.clock.mode === 'frozen' || snapshot.clock.paused;
}

function assertBodyResult(
  result: ApparentTopocentricBodyResult,
  body: ObserverRelativeBody,
  snapshot: ScientificSnapshot,
): void {
  const horizontal = result.horizontal;
  const equatorial = result.equatorial;
  if (
    result.kind !== 'VALID_APPARENT_TOPOCENTRIC_BODY' ||
    result.validity !== 'VALID' ||
    result.body !== body ||
    equatorial.body !== body ||
    horizontal.body !== body ||
    equatorial.frame !== 'EQD_TRUE' ||
    horizontal.frame !== 'HORIZONTAL_ENU' ||
    result.correctionProfile.id !== snapshot.configuration.bodyCorrectionProfile ||
    horizontal.provenance.provider !== 'Astronomy Engine' ||
    horizontal.provenance.providerVersion !== snapshot.providers.astronomyEngineVersion ||
    horizontal.provenance.simulationInstant.utcIso !== snapshot.clock.instant.utcIso ||
    ![
      horizontal.azimuthDeg,
      horizontal.altitudeDeg,
      equatorial.rightAscensionHours,
      equatorial.declinationDeg,
      horizontal.direction.east,
      horizontal.direction.north,
      horizontal.direction.up,
    ].every(Number.isFinite)
  ) {
    throw new Error('Solar-system body state requires validated finite Astronomy Engine results.');
  }
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
    const cacheKey = createCacheKey(snapshot);
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
      assertBodyResult(result, body, snapshot);
      return result;
    }));
    const state = Object.freeze({
      kind: 'READY_ACTUAL_SOLAR_SYSTEM_BODY_STATE' as const,
      cacheKey,
      bodies,
      correctionProfile: snapshot.configuration.bodyCorrectionProfile,
      provenance: Object.freeze({
        provider: 'Astronomy Engine',
        providerVersion: snapshot.providers.astronomyEngineVersion,
        sourceFrame: 'EQD_TRUE' as const,
        outputFrame: 'HORIZONTAL_ENU' as const,
        simulationInstantUtc: snapshot.clock.instant.utcIso,
      }),
      snapshotIdentity: Object.freeze({
        observerRevision: snapshot.revisions.observer,
        timeRevision: snapshot.revisions.time,
        configurationRevision: snapshot.revisions.configuration,
        instantUtc: snapshot.clock.instant.utcIso,
      }),
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
