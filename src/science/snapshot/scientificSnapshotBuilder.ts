import { AstronomyContractError } from '../astronomy/errors';
import { createMeanEquatorBasis } from '../frames/earthAxisState';
import {
  ASTRONOMY_ENGINE_PROVIDER,
  ASTRONOMY_ENGINE_VERSION,
} from '../astronomy/astronomyEngineAdapter';
import {
  P03_MEAN_POLE_PROVIDER,
  P03_MEAN_POLE_PROVIDER_VERSION,
} from '../astronomy/meanPoleProvider';
import { createObserver } from '../astronomy/observer';
import type { ValidatedObserver } from '../astronomy/types';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverState } from '../state/observerState';
import {
  validateSimulationClockState,
  type SimulationClockState,
} from '../state/simulationClock';
import {
  isSupportedScientificConfiguration,
  type ScientificConfiguration,
} from '../state/scientificConfiguration';
import type { ScientificRevisions } from '../state/scientificRevisions';
import { isValidScientificRevision } from '../state/runtimeValidation';
import type { ScientificIssue, ScientificSnapshot, ScientificSnapshotBuildResult, ScientificWarning } from './scientificSnapshot';
import { createScientificSnapshotKey } from './scientificSnapshotKey';

export interface ScientificSnapshotInput {
  readonly observer: ObserverState;
  readonly clock: SimulationClockState;
  readonly calibration: GeographicCalibrationState;
  readonly configuration: ScientificConfiguration;
  readonly providers: ScientificProviderRegistry;
  readonly creationSequence: number;
}

/**
 * Snapshot data is deliberately limited to finite JSON-like scientific values.
 * Clone before freezing so neither a provider nor a caller can retain a mutable
 * reference into a cached public result.
 */
function immutableClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => immutableClone(entry))) as T;
  }
  if (typeof value === 'object' && value !== null) {
    const clone = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        immutableClone(entry),
      ]),
    );
    return Object.freeze(clone) as T;
  }
  return value;
}

function baseWarnings(): readonly ScientificWarning[] {
  return Object.freeze([
    Object.freeze({ code: 'TIER_1_UTC_APPROXIMATES_UT1' as const, message: 'Tier 1 uses the validated Astronomy Engine UTC≈UT1 policy.' }),
    Object.freeze({ code: 'NO_LIVE_EOP' as const, message: 'No live Earth Orientation Parameters are used.' }),
    Object.freeze({ code: 'MEAN_AXIS_EXCLUDES_NUTATION' as const, message: 'The P03 mean axis excludes nutation.' }),
    Object.freeze({ code: 'NO_POLAR_MOTION' as const, message: 'The selected model excludes polar motion.' }),
    Object.freeze({ code: 'NO_PRECISION_CLAIM_BEYOND_TIER_1' as const, message: 'This foundation makes no claim beyond the documented Tier 1 contract.' }),
  ]);
}

function warnings(
  observer: ValidatedObserver | undefined,
  heightDatumWarningApplies: boolean,
): readonly ScientificWarning[] {
  const values = [...baseWarnings()];
  if (observer && heightDatumWarningApplies) {
    const observerProvenance = observer.source ?? 'unspecified';
    values.splice(4, 0, Object.freeze({
      code: 'HEIGHT_DATUM_REFERENCE_DIFFERENCE' as const,
      message: `The application retains the observer's declared ${observer.verticalDatum} elevation datum and ${observerProvenance} provenance. Astronomy Engine consumes elevation as meters above mean sea level, while independent references such as JPL Horizons may use reference-ellipsoid height; no equivalence is assumed, and the mismatch may contribute to small topocentric positional differences. This condition is non-fatal under Tier 1.`,
      metadata: Object.freeze({
        applicability: 'ACTIVE_OBSERVER_RELATIVE_PROFILE_PREPARED' as const,
        applicationVerticalDatum: observer.verticalDatum,
        observerProvenance,
        providerElevationConvention: 'MEAN_SEA_LEVEL_METERS' as const,
        comparisonReferenceConvention: 'REFERENCE_ELLIPSOID_HEIGHT_MAY_APPLY' as const,
        effectCategory: 'POSSIBLE_SMALL_TOPOCENTRIC_POSITION_DIFFERENCE' as const,
        precisionClassification: 'TIER_1_NON_FATAL' as const,
      }),
    }));
  }
  return Object.freeze(values);
}

function issue(code: ScientificIssue['code'], message: string): ScientificIssue {
  return Object.freeze({ code, message });
}

interface SnapshotInputValidation {
  readonly errors: readonly ScientificIssue[];
  readonly clock?: SimulationClockState;
  readonly observer?: ValidatedObserver;
  readonly configurationSupported: boolean;
  readonly providersSupported: boolean;
}

function validateInput(input: ScientificSnapshotInput): SnapshotInputValidation {
  const errors: ScientificIssue[] = [];
  let observer: ValidatedObserver | undefined;
  let clock: SimulationClockState | undefined;
  if (input.observer.kind !== 'ready') {
    errors.push(issue('OBSERVER_MISSING', 'A validated observer is required.'));
  } else {
    try {
      if (
        !isValidScientificRevision(input.observer.revision) ||
        input.observer.observer.kind !== 'VALIDATED_OBSERVER'
      ) {
        throw new AstronomyContractError('INVALID_OBSERVER', 'Observer state has an invalid runtime contract.');
      }
      observer = createObserver(input.observer.observer);
    } catch (error) {
      errors.push(issue('INVALID_INPUT', error instanceof Error ? error.message : 'Observer state is invalid.'));
    }
  }
  if (input.calibration.kind !== 'ready') errors.push(issue('CALIBRATION_MISSING', 'A current geographic calibration is required for presentation mapping.'));
  const configurationSupported = isSupportedScientificConfiguration(input.configuration);
  if (!configurationSupported) {
    errors.push(issue('UNSUPPORTED_CONFIGURATION', 'Scientific configuration does not satisfy the complete validated Tier 1 contract.'));
  }
  const providersSupported =
    input.providers.astronomy.provider === ASTRONOMY_ENGINE_PROVIDER &&
    input.providers.astronomy.version === ASTRONOMY_ENGINE_VERSION &&
    input.providers.meanPole.provider === P03_MEAN_POLE_PROVIDER &&
    input.providers.meanPole.version === P03_MEAN_POLE_PROVIDER_VERSION &&
    typeof input.providers.meanPole.getMeanPole === 'function' &&
    typeof input.providers.astronomy.getObserverRelativePosition === 'function';
  if (!providersSupported) {
    errors.push(issue('UNSUPPORTED_CONFIGURATION', 'Scientific provider registry is not compatible with the validated Tier 1 provider contract.'));
  }
  try {
    clock = validateSimulationClockState(input.clock);
  } catch (error) {
    errors.push(issue('INVALID_INPUT', error instanceof Error ? error.message : 'Simulation clock state is invalid.'));
  }
  return Object.freeze({
    errors: Object.freeze(errors),
    ...(clock ? { clock } : {}),
    ...(observer ? { observer } : {}),
    configurationSupported,
    providersSupported,
  });
}

function verifyAxis(snapshot: { readonly earthAxis: ScientificSnapshot['earthAxis']; readonly equatorBasis: ScientificSnapshot['equatorBasis'] }): ScientificIssue | undefined {
  const { north, south } = snapshot.earthAxis;
  const vectors = [
    north.x, north.y, north.z,
    south.x, south.y, south.z,
    snapshot.equatorBasis.first.x, snapshot.equatorBasis.first.y, snapshot.equatorBasis.first.z,
    snapshot.equatorBasis.second.x, snapshot.equatorBasis.second.y, snapshot.equatorBasis.second.z,
    snapshot.equatorBasis.normal.x, snapshot.equatorBasis.normal.y, snapshot.equatorBasis.normal.z,
  ];
  if (!vectors.every(Number.isFinite)) return issue('NON_FINITE_RESULT', 'Provider returned a non-finite scientific vector.');
  if (south.x !== -north.x || south.y !== -north.y || south.z !== -north.z) return issue('INVARIANT_FAILURE', 'North and south mean poles must be exact antipodes.');
  const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
  const length = (vector: { x: number; y: number; z: number }) => Math.hypot(vector.x, vector.y, vector.z);
  const cross = {
    x: snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.z - snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.y,
    y: snapshot.equatorBasis.first.z * snapshot.equatorBasis.second.x - snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.z,
    z: snapshot.equatorBasis.first.x * snapshot.equatorBasis.second.y - snapshot.equatorBasis.first.y * snapshot.equatorBasis.second.x,
  };
  if (
    north.frame !== 'GCRS' ||
    south.frame !== 'GCRS' ||
    snapshot.equatorBasis.frame !== 'GCRS' ||
    snapshot.equatorBasis.model !== 'IAU_P03_PRECESSION_ONLY' ||
    snapshot.equatorBasis.normal.frame !== 'GCRS' ||
    snapshot.equatorBasis.handedness !== 'right-handed' ||
    Math.abs(length(north) - 1) > 1e-12 ||
    Math.abs(length(south) - 1) > 1e-12 ||
    Math.abs(length(snapshot.equatorBasis.first) - 1) > 1e-12 ||
    Math.abs(length(snapshot.equatorBasis.second) - 1) > 1e-12 ||
    Math.abs(length(snapshot.equatorBasis.normal) - 1) > 1e-12 ||
    Math.abs(dot(snapshot.equatorBasis.first, north)) > 1e-12 ||
    Math.abs(dot(snapshot.equatorBasis.second, north)) > 1e-12 ||
    Math.abs(dot(snapshot.equatorBasis.first, snapshot.equatorBasis.second)) > 1e-12 ||
    Math.abs(dot(snapshot.equatorBasis.normal, north) - 1) > 1e-12 ||
    Math.abs(dot(cross, snapshot.equatorBasis.normal) - 1) > 1e-12
  ) {
    return issue('INVARIANT_FAILURE', 'Equator basis must be perpendicular to the shared pole and internally orthogonal.');
  }
  return undefined;
}

export function buildScientificSnapshot(input: ScientificSnapshotInput): ScientificSnapshotBuildResult {
  const validation = validateInput(input);
  const snapshotWarnings = warnings(
    validation.observer,
    validation.configurationSupported &&
      validation.providersSupported &&
      validation.observer?.verticalDatum === 'MEAN_SEA_LEVEL',
  );
  if (
    validation.errors.length > 0 ||
    !validation.clock ||
    !validation.observer ||
    input.observer.kind !== 'ready' ||
    input.calibration.kind !== 'ready'
  ) {
    return Object.freeze({ kind: 'not-ready', errors: validation.errors, warnings: snapshotWarnings });
  }
  const readyObserver = Object.freeze({
    ...input.observer,
    observer: validation.observer,
  });
  const readyCalibration = input.calibration;
  const normalizedInput: ScientificSnapshotInput = Object.freeze({
    ...input,
    observer: readyObserver,
    clock: validation.clock,
  });
  try {
    const providerAxis = normalizedInput.providers.meanPole.getMeanPole({
      instant: normalizedInput.clock.instant,
      sourceFrame: 'GCRS',
      modelReferenceEpoch: 'J2000.0',
      outputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
    });
    if (
      providerAxis.provenance.provider !== normalizedInput.providers.meanPole.provider ||
      providerAxis.provenance.providerVersion !== normalizedInput.providers.meanPole.version
    ) {
      return Object.freeze({
        kind: 'not-ready',
        errors: Object.freeze([issue('INVARIANT_FAILURE', 'P03 result provenance must match the registered provider identity.')]),
        warnings: snapshotWarnings,
      });
    }
    const earthAxis = immutableClone(providerAxis);
    const equatorBasis = immutableClone(createMeanEquatorBasis(earthAxis.north));
    const revisions: ScientificRevisions = Object.freeze({
      observer: readyObserver.revision,
      time: normalizedInput.clock.revision,
      geographicCalibration: readyCalibration.revision,
      configuration: normalizedInput.configuration.revision,
    });
    const candidate = {
      earthAxis,
      equatorBasis,
    };
    const invariantFailure = verifyAxis(candidate);
    if (invariantFailure) return Object.freeze({ kind: 'not-ready', errors: Object.freeze([invariantFailure]), warnings: snapshotWarnings });
    const cacheKey = createScientificSnapshotKey(normalizedInput);
    const snapshot: ScientificSnapshot = immutableClone({
      kind: 'ready',
      cacheKey,
      creationSequence: normalizedInput.creationSequence,
      observer: readyObserver,
      clock: normalizedInput.clock,
      geographicCalibration: readyCalibration,
      configuration: normalizedInput.configuration,
      revisions,
      frameContract: Object.freeze({
        horizontal: 'HORIZONTAL_ENU_EAST_NORTH_UP',
        applicationBasis: 'ENU_EAST_TO_X__UP_TO_Y__NORTH_TO_NEGATIVE_Z',
        calibratedYawApplication: 'presentation-parent-only',
      }),
      earthAxis,
      equatorBasis,
      providers: Object.freeze({
        astronomyEngineVersion: normalizedInput.providers.astronomy.version,
        meanPoleProviderVersion: normalizedInput.providers.meanPole.version,
      }),
      warnings: snapshotWarnings,
    });
    return Object.freeze({ kind: 'ready', snapshot });
  } catch (error) {
    const mapped = error instanceof AstronomyContractError && error.code === 'MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN'
      ? issue('MODEL_DOMAIN', error.message)
      : issue('PROVIDER_FAILURE', error instanceof Error ? error.message : 'Scientific provider failed.');
    return Object.freeze({ kind: 'not-ready', errors: Object.freeze([mapped]), warnings: snapshotWarnings });
  }
}
