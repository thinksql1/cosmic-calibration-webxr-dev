import { describe, expect, it } from 'vitest';
import { AstronomyContractError } from '../../src/science/astronomy/errors';
import { getApparentTopocentricBody } from '../../src/science/astronomy/astronomyEngineAdapter';
import { createObserver } from '../../src/science/astronomy/observer';
import { createSimulationInstant } from '../../src/science/astronomy/time';
import {
  CORRECTION_PROFILES,
  SUPPORTED_SOLAR_SYSTEM_BODIES,
  type ApparentTopocentricBodyResult,
} from '../../src/science/astronomy/types';
import {
  createSolarSystemBodyCacheKey,
  SolarSystemBodyStateService,
} from '../../src/science/bodies/solarSystemBodyState';
import {
  ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
  type AstronomyProviderIdentity,
} from '../../src/science/providers/astronomyProviderIdentity';
import {
  createScientificProviderRegistry,
  type ScientificProviderRegistry,
} from '../../src/science/providers/scientificProviderRegistry';
import { buildScientificSnapshot, type ScientificSnapshotInput } from '../../src/science/snapshot/scientificSnapshotBuilder';
import { GeographicCalibrationStateAdapter } from '../../src/science/state/geographicCalibrationState';
import { ObserverStateStore } from '../../src/science/state/observerState';
import { ScientificConfigurationStore } from '../../src/science/state/scientificConfiguration';
import { SimulationClock } from '../../src/science/state/simulationClock';

function readySnapshot(
  latitudeDeg = 42,
  instantUtc = '2025-06-21T16:00:00.000Z',
  correctionProfile: 'AE_APPARENT_TOPOCENTRIC_AIRLESS' | 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION' = 'AE_APPARENT_TOPOCENTRIC_AIRLESS',
) {
  const observer = new ObserverStateStore();
  observer.set({ latitudeDeg, longitudeDegEast: -83, elevationMeters: 250, source: 'body fixture' });
  const calibration = new GeographicCalibrationStateAdapter();
  calibration.update({
    kind: 'calibrated',
    calibration: { yawRadians: 0, capturedDirection: { x: 0, y: 0, z: -1 }, timestamp: 1, simulated: true },
  });
  const configuration = new ScientificConfigurationStore();
  if (correctionProfile === 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION') {
    configuration.replace({
      precisionTier: 'TIER_1',
      bodyCorrectionProfile: correctionProfile,
      meanPoleModel: 'IAU_P03_PRECESSION_ONLY',
      refractionPolicy: 'normal',
      enabledProviders: ['Astronomy Engine', 'P03 Mean Pole'],
    });
  }
  const input: ScientificSnapshotInput = {
    observer: observer.current,
    clock: new SimulationClock(createSimulationInstant(instantUtc, 'frozen-test')).current,
    calibration: calibration.current,
    configuration: configuration.current,
    providers: createScientificProviderRegistry(),
    creationSequence: 1,
  };
  const result = buildScientificSnapshot(input);
  if (result.kind !== 'ready') throw new Error('Expected ready fixture snapshot.');
  return result.snapshot;
}

function registryWith(
  identity: AstronomyProviderIdentity,
  transform?: (result: ApparentTopocentricBodyResult) => ApparentTopocentricBodyResult,
): ScientificProviderRegistry {
  const registry = createScientificProviderRegistry();
  return Object.freeze({
    ...registry,
    astronomy: Object.freeze({
      ...registry.astronomy,
      identity,
      getApparentTopocentricBody: transform
        ? (...args) => transform(registry.astronomy.getApparentTopocentricBody(...args))
        : registry.astronomy.getApparentTopocentricBody,
    }),
  }) as unknown as ScientificProviderRegistry;
}

function changedIdentity(
  changes: Partial<AstronomyProviderIdentity>,
): AstronomyProviderIdentity {
  return Object.freeze({
    ...ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
    ...changes,
  }) as AstronomyProviderIdentity;
}

function expectContractError(operation: () => unknown, code: AstronomyContractError['code']): AstronomyContractError {
  try {
    operation();
    throw new Error('Expected astronomy contract error.');
  } catch (error) {
    expect(error).toBeInstanceOf(AstronomyContractError);
    expect((error as AstronomyContractError).code).toBe(code);
    return error as AstronomyContractError;
  }
}

function alteredEquatorial(
  alter: (result: ApparentTopocentricBodyResult) => Record<string, unknown>,
): (result: ApparentTopocentricBodyResult) => ApparentTopocentricBodyResult {
  return (result) => Object.freeze({
    ...result,
    equatorial: Object.freeze({
      ...result.equatorial,
      ...alter(result),
    }),
  }) as ApparentTopocentricBodyResult;
}

function alteredHorizontal(
  alter: (result: ApparentTopocentricBodyResult) => Record<string, unknown>,
): (result: ApparentTopocentricBodyResult) => ApparentTopocentricBodyResult {
  return (result) => Object.freeze({
    ...result,
    horizontal: Object.freeze({
      ...result.horizontal,
      ...alter(result),
    }),
  }) as ApparentTopocentricBodyResult;
}

describe('actual solar-system body state', () => {
  it('supports exactly the bounded Sun, Moon, and major-planet list with typed immutable provenance', () => {
    expect(SUPPORTED_SOLAR_SYSTEM_BODIES).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    ]);
    const service = new SolarSystemBodyStateService(createScientificProviderRegistry());
    const result = service.capture(readySnapshot());
    expect(result.bodies.map((body) => body.body)).toEqual(SUPPORTED_SOLAR_SYSTEM_BODIES);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.provenance.identity)).toBe(true);
    for (const body of result.bodies) {
      expect(body.validity).toBe('VALID');
      expect(body.equatorial.frame).toBe('EQD_TRUE');
      expect(body.horizontal.frame).toBe('HORIZONTAL_ENU');
      expect(body.horizontal.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(body.horizontal.azimuthDeg).toBeLessThanOrEqual(360);
      expect(Number.isFinite(body.horizontal.altitudeDeg)).toBe(true);
      expect(Math.hypot(body.horizontal.direction.east, body.horizontal.direction.north, body.horizontal.direction.up)).toBeCloseTo(1, 13);
      expect(body.horizontal.provenance.correctionProfile.id).toBe('AE_APPARENT_TOPOCENTRIC_AIRLESS');
      expect(body.equatorial.provenance).toMatchObject({
        provider: body.horizontal.provenance.provider,
        providerVersion: body.horizontal.provenance.providerVersion,
        simulationInstant: body.horizontal.provenance.simulationInstant,
        observer: body.horizontal.provenance.observer,
        correctionProfile: body.horizontal.provenance.correctionProfile,
        sourceFrame: 'EQD_TRUE',
        outputFrame: 'EQD_TRUE',
      });
      expect(body.horizontal.provenance.outputFrame).toBe('HORIZONTAL_ENU');
    }
  });

  it('is deterministic for frozen observer/time inputs, caches those inputs, and changes with observer or instant', () => {
    const service = new SolarSystemBodyStateService(createScientificProviderRegistry());
    const fixture = readySnapshot(42, '2025-06-21T16:00:00.000Z');
    const first = service.capture(fixture);
    expect(service.capture(fixture)).toBe(first);
    expect(service.cacheSize).toBe(1);
    const later = service.capture(readySnapshot(42, '2025-12-21T16:00:00.000Z'));
    const south = service.capture(readySnapshot(-42, '2025-06-21T16:00:00.000Z'));
    const refracted = service.capture(readySnapshot(42, '2025-06-21T16:00:00.000Z', 'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION'));
    expect(later.bodies.find(({ body }) => body === 'Sun')!.horizontal.direction)
      .not.toEqual(first.bodies.find(({ body }) => body === 'Sun')!.horizontal.direction);
    expect(south.bodies.find(({ body }) => body === 'Moon')!.horizontal.direction)
      .not.toEqual(first.bodies.find(({ body }) => body === 'Moon')!.horizontal.direction);
    expect(refracted.cacheKey).not.toBe(first.cacheKey);
    expect(refracted.correctionProfile).toBe('AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION');
    expect(refracted.bodies[0]!.equatorial.provenance.correctionProfile.id).toBe('AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION');
    const realtimeSnapshot = Object.freeze({
      ...fixture,
      clock: Object.freeze({ ...fixture.clock, mode: 'realtime' as const, paused: false }),
    });
    expect(service.capture(realtimeSnapshot)).not.toBe(service.capture(realtimeSnapshot));
  });

  it('preserves below-horizon and celestial-equator truth without clamping or projecting', () => {
    const observer = createObserver({ latitudeDeg: -33.8688, longitudeDegEast: 151.2093, elevationMeters: 58 });
    const instant = createSimulationInstant('2025-10-15T10:00:00.000Z', 'frozen-test');
    const moon = getApparentTopocentricBody('Moon', instant, observer, 'AE_APPARENT_TOPOCENTRIC_AIRLESS');
    expect(moon.horizontal.altitudeDeg).toBeLessThan(0);
    expect(moon.aboveHorizon).toBe(false);
    expect(moon.horizontal.direction.up).toBeLessThan(0);
    expect(moon.celestialEquatorRelation).toBe(
      moon.equatorial.declinationDeg > 0 ? 'NORTH' : moon.equatorial.declinationDeg < 0 ? 'SOUTH' : 'ON',
    );
  });

  it('rejects active provider name, version, or adapter identity that differs from the snapshot before cache lookup', () => {
    const snapshot = readySnapshot();
    const service = new SolarSystemBodyStateService(createScientificProviderRegistry());
    service.capture(snapshot);
    const mismatchedService = new SolarSystemBodyStateService(
      registryWith(changedIdentity({ provider: 'Unexpected provider' as never })),
    );
    const nameMismatch = expectContractError(
      () => mismatchedService.capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(nameMismatch.context).toMatchObject({
      operation: 'SolarSystemBodyStateService.capture',
      expected: { provider: 'Astronomy Engine', providerVersion: '2.1.19' },
      actual: { provider: 'Unexpected provider', providerVersion: '2.1.19' },
    });
    expect(nameMismatch.context?.mismatchedFields).toEqual(['provider']);
    expect(mismatchedService.cacheSize).toBe(0);
    const versionMismatch = expectContractError(
      () => new SolarSystemBodyStateService(registryWith(changedIdentity({ providerVersion: '9.9.9' as never }))).capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(versionMismatch.context?.mismatchedFields).toEqual(['providerVersion']);
    const adapterMismatch = expectContractError(
      () => new SolarSystemBodyStateService(registryWith(changedIdentity({ adapterVersion: '9.9.9' as never }))).capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(adapterMismatch.context?.mismatchedFields).toEqual(['adapterVersion']);
    const registryWithoutIdentity = createScientificProviderRegistry();
    const missingIdentity = Object.freeze({
      ...registryWithoutIdentity,
      astronomy: Object.freeze({ ...registryWithoutIdentity.astronomy, identity: undefined }),
    }) as unknown as ScientificProviderRegistry;
    expectContractError(
      () => new SolarSystemBodyStateService(missingIdentity).capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    const registryWithMutableIdentity = createScientificProviderRegistry();
    const mutableIdentity = { ...ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY };
    const mutableIdentityRegistry = Object.freeze({
      ...registryWithMutableIdentity,
      astronomy: Object.freeze({ ...registryWithMutableIdentity.astronomy, identity: mutableIdentity }),
    }) as unknown as ScientificProviderRegistry;
    expectContractError(
      () => new SolarSystemBodyStateService(mutableIdentityRegistry).capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(service.cacheSize).toBe(1);
  });

  it.each([
    ['source frame', { equatorialSourceFrame: 'GCRS' as never }, 'equatorialSourceFrame'],
    ['equatorial output frame', { equatorialOutputFrame: 'GCRS' as never }, 'equatorialOutputFrame'],
    ['horizontal source frame', { horizontalSourceFrame: 'GCRS' as never }, 'horizontalSourceFrame'],
    ['output frame', { horizontalOutputFrame: 'EQD_TRUE' as never }, 'horizontalOutputFrame'],
    [
      'correction-profile capability',
      { supportedCorrectionProfiles: Object.freeze(['AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION']) as never },
      'supportedCorrectionProfiles',
    ],
    ['body-set identity', { bodySetId: 'DIFFERENT_BODY_SET' as never }, 'bodySetId'],
    [
      'supported-body capability',
      { supportedBodies: Object.freeze(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter']) as never },
      'supportedBodies',
    ],
  ] as const)('preserves full immutable context for a %s-only provider mismatch', (_name, change, field) => {
    const error = expectContractError(
      () => new SolarSystemBodyStateService(registryWith(changedIdentity(change))).capture(readySnapshot()),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    const context = error.context!;
    const expected = context.expected as Readonly<Record<string, unknown>>;
    const actual = context.actual as Readonly<Record<string, unknown>>;
    expect(context.mismatchedFields).toEqual([field]);
    expect(expected[field]).not.toEqual(actual[field]);
    expect(expected).toMatchObject({
      provider: 'Astronomy Engine',
      providerVersion: '2.1.19',
      adapterVersion: '1.1.0',
      bodySetId: 'SUN_MOON_MERCURY_VENUS_MARS_JUPITER_SATURN_URANUS_NEPTUNE_PLUTO_V2',
      supportedBodies: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'],
      supportedCorrectionProfiles: [
        'AE_APPARENT_TOPOCENTRIC_AIRLESS',
        'AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION',
      ],
      equatorialSourceFrame: 'EQD_TRUE',
      equatorialOutputFrame: 'EQD_TRUE',
      horizontalSourceFrame: 'EQD_TRUE',
      horizontalOutputFrame: 'HORIZONTAL_ENU',
    });
    expect(Object.isFrozen(expected)).toBe(true);
    expect(Object.isFrozen(actual)).toBe(true);
    expect(Object.isFrozen(context.mismatchedFields)).toBe(true);
  });

  it('makes mismatch diagnostics deterministic, serializable, and deeply immutable', () => {
    const mismatch = changedIdentity({
      horizontalSourceFrame: 'GCRS' as never,
      supportedBodies: Object.freeze(['Sun', 'Moon']) as never,
      supportedCorrectionProfiles: Object.freeze(['AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION']) as never,
    });
    const first = expectContractError(
      () => new SolarSystemBodyStateService(registryWith(mismatch)).capture(readySnapshot()),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    const second = expectContractError(
      () => new SolarSystemBodyStateService(registryWith(mismatch)).capture(readySnapshot()),
      'PROVIDER_IDENTITY_MISMATCH',
    );
    expect(first.context).toEqual(second.context);
    expect(first.context?.mismatchedFields).toEqual([
      'horizontalSourceFrame',
      'supportedBodies',
      'supportedCorrectionProfiles',
    ]);
    expect(JSON.parse(JSON.stringify(first.context))).toMatchObject({
      mismatchedFields: ['horizontalSourceFrame', 'supportedBodies', 'supportedCorrectionProfiles'],
      expected: { horizontalSourceFrame: 'EQD_TRUE' },
      actual: { horizontalSourceFrame: 'GCRS' },
    });
    expect(Object.isFrozen(first.context)).toBe(true);
    const expected = first.context!.expected as { supportedBodies: string[] };
    const actual = first.context!.actual as { supportedCorrectionProfiles: string[] };
    expect(Object.isFrozen(expected.supportedBodies)).toBe(true);
    expect(Object.isFrozen(actual.supportedCorrectionProfiles)).toBe(true);
    expect(() => expected.supportedBodies.push('Neptune')).toThrow();
    expect(() => actual.supportedCorrectionProfiles.push('mutated')).toThrow();
    expect(() => (first.context!.mismatchedFields as string[]).push('mutated')).toThrow();
    expect(() => {
      (first.context as { operation: string }).operation = 'mutated';
    }).toThrow();
  });

  it('retains unsupported-provider capability rejection before cache lookup', () => {
    const base = createScientificProviderRegistry();
    const withoutBodyCapability = Object.freeze({
      ...base,
      astronomy: Object.freeze({ ...base.astronomy, getApparentTopocentricBody: undefined }),
    }) as unknown as ScientificProviderRegistry;
    const service = new SolarSystemBodyStateService(withoutBodyCapability);
    const error = expectContractError(
      () => service.capture(readySnapshot()),
      'UNSUPPORTED_PROVIDER_CAPABILITY',
    );
    expect(error.context).toMatchObject({
      operation: 'SolarSystemBodyStateService.capture',
      actual: { hasBodyOperation: false },
    });
    expect(service.cacheSize).toBe(0);
  });

  it('builds cache identity from the active provider descriptor and isolates provider changes', () => {
    const snapshot = readySnapshot();
    const base = createSolarSystemBodyCacheKey(snapshot, ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY);
    const renamed = createSolarSystemBodyCacheKey(snapshot, changedIdentity({ provider: 'Unexpected provider' as never }));
    const reversioned = createSolarSystemBodyCacheKey(snapshot, changedIdentity({ providerVersion: '9.9.9' as never }));
    const readapted = createSolarSystemBodyCacheKey(snapshot, changedIdentity({ adapterVersion: '9.9.9' as never }));
    expect(renamed).not.toBe(base);
    expect(reversioned).not.toBe(base);
    expect(readapted).not.toBe(base);
    expectContractError(
      () => new SolarSystemBodyStateService(registryWith(changedIdentity({ provider: 'Unexpected provider' as never }))).capture(snapshot),
      'PROVIDER_IDENTITY_MISMATCH',
    );
  });

  it.each([
    ['provider name', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, provider: 'Unexpected provider' }) }))],
    ['provider version', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, providerVersion: '9.9.9' }) }))],
    ['adapter version', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, adapterVersion: '9.9.9' }) }))],
    ['correction profile', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, correctionProfile: CORRECTION_PROFILES.AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION }) }))],
    ['source frame', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, sourceFrame: 'GCRS' as const }) }))],
    ['output frame', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, outputFrame: 'HORIZONTAL_ENU' as const }) }))],
    ['body', alteredEquatorial(() => ({ body: 'Moon' as const }))],
    ['observer', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, observer: Object.freeze({ ...result.equatorial.provenance.observer!, latitudeDeg: 1 }) }) }))],
    ['instant', alteredEquatorial((result) => ({ provenance: Object.freeze({ ...result.equatorial.provenance, simulationInstant: Object.freeze({ ...result.equatorial.provenance.simulationInstant, utcIso: '2025-06-22T16:00:00.000Z' }) }) }))],
    ['missing provenance', alteredEquatorial(() => ({ provenance: undefined }))],
    ['non-finite coordinate', alteredEquatorial(() => ({ rightAscensionHours: Number.NaN }))],
  ])('rejects malformed equatorial %s', (_case, transform) => {
    const service = new SolarSystemBodyStateService(registryWith(ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY, transform));
    expectContractError(() => service.capture(readySnapshot()), 'MALFORMED_PROVIDER_RESULT');
  });

  it.each([
    ['provider name', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, provider: 'Unexpected provider' }) }))],
    ['provider version', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, providerVersion: '9.9.9' }) }))],
    ['adapter version', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, adapterVersion: '9.9.9' }) }))],
    ['correction profile', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, correctionProfile: CORRECTION_PROFILES.AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION }) }))],
    ['source frame', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, sourceFrame: 'GCRS' as const }) }))],
    ['output frame', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, outputFrame: 'EQD_TRUE' as const }) }))],
    ['body', alteredHorizontal(() => ({ body: 'Moon' as const }))],
    ['observer', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, observer: Object.freeze({ ...result.horizontal.provenance.observer!, latitudeDeg: 1 }) }) }))],
    ['instant', alteredHorizontal((result) => ({ provenance: Object.freeze({ ...result.horizontal.provenance, simulationInstant: Object.freeze({ ...result.horizontal.provenance.simulationInstant, utcIso: '2025-06-22T16:00:00.000Z' }) }) }))],
    ['missing provenance', alteredHorizontal(() => ({ provenance: undefined }))],
    ['non-finite direction', alteredHorizontal((result) => ({ direction: Object.freeze({ ...result.horizontal.direction, east: Number.NaN }) }))],
  ])('rejects malformed horizontal %s', (_case, transform) => {
    const service = new SolarSystemBodyStateService(registryWith(ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY, transform));
    expectContractError(() => service.capture(readySnapshot()), 'MALFORMED_PROVIDER_RESULT');
  });

  it('rejects cross-result provenance disagreement and protects cached nested values from mutation', () => {
    const disagreement = registryWith(
      ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_IDENTITY,
      alteredEquatorial((result) => ({
        provenance: Object.freeze({ ...result.equatorial.provenance, providerVersion: '9.9.9' }),
      })),
    );
    expectContractError(
      () => new SolarSystemBodyStateService(disagreement).capture(readySnapshot()),
      'MALFORMED_PROVIDER_RESULT',
    );
    const state = new SolarSystemBodyStateService(createScientificProviderRegistry()).capture(readySnapshot());
    expect(Object.isFrozen(state.bodies[0]!.equatorial.provenance)).toBe(true);
    expect(() => {
      (state.bodies[0]!.equatorial.provenance as { provider: string }).provider = 'Unexpected provider';
    }).toThrow();
  });
});
