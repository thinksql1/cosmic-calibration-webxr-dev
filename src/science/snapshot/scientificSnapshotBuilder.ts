import { AstronomyContractError } from '../astronomy/errors';
import { createMeanEquatorBasis } from '../frames/earthAxisState';
import type { ScientificProviderRegistry } from '../providers/scientificProviderRegistry';
import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverState } from '../state/observerState';
import type { SimulationClockState } from '../state/simulationClock';
import type { ScientificConfiguration } from '../state/scientificConfiguration';
import type { ScientificRevisions } from '../state/scientificRevisions';
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

function warnings(): readonly ScientificWarning[] {
  return Object.freeze([
    Object.freeze({ code: 'TIER_1_UTC_APPROXIMATES_UT1' as const, message: 'Tier 1 uses the validated Astronomy Engine UTC≈UT1 policy.' }),
    Object.freeze({ code: 'NO_LIVE_EOP' as const, message: 'No live Earth Orientation Parameters are used.' }),
    Object.freeze({ code: 'MEAN_AXIS_EXCLUDES_NUTATION' as const, message: 'The P03 mean axis excludes nutation.' }),
    Object.freeze({ code: 'NO_POLAR_MOTION' as const, message: 'The selected model excludes polar motion.' }),
    Object.freeze({ code: 'NO_PRECISION_CLAIM_BEYOND_TIER_1' as const, message: 'This foundation makes no claim beyond the documented Tier 1 contract.' }),
  ]);
}

function issue(code: ScientificIssue['code'], message: string): ScientificIssue {
  return Object.freeze({ code, message });
}

function validateInput(input: ScientificSnapshotInput): readonly ScientificIssue[] {
  const errors: ScientificIssue[] = [];
  if (input.observer.kind !== 'ready') errors.push(issue('OBSERVER_MISSING', 'A validated observer is required.'));
  if (input.calibration.kind !== 'ready') errors.push(issue('CALIBRATION_MISSING', 'A current geographic calibration is required for presentation mapping.'));
  if (input.configuration.precisionTier !== 'TIER_1' || input.configuration.meanPoleModel !== 'IAU_P03_PRECESSION_ONLY') {
    errors.push(issue('UNSUPPORTED_CONFIGURATION', 'Only the validated Tier 1 P03 configuration is supported.'));
  }
  if (!Number.isFinite(input.clock.instant.unixMilliseconds)) errors.push(issue('INVALID_INPUT', 'Simulation instant is invalid.'));
  return Object.freeze(errors);
}

function verifyAxis(snapshot: { readonly earthAxis: ScientificSnapshot['earthAxis']; readonly equatorBasis: ScientificSnapshot['equatorBasis'] }): ScientificIssue | undefined {
  const { north, south } = snapshot.earthAxis;
  const vectors = [north.x, north.y, north.z, south.x, south.y, south.z, snapshot.equatorBasis.first.x, snapshot.equatorBasis.second.y];
  if (!vectors.every(Number.isFinite)) return issue('NON_FINITE_RESULT', 'Provider returned a non-finite scientific vector.');
  if (south.x !== -north.x || south.y !== -north.y || south.z !== -north.z) return issue('INVARIANT_FAILURE', 'North and south mean poles must be exact antipodes.');
  const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
  if (Math.abs(dot(snapshot.equatorBasis.first, north)) > 1e-12 || Math.abs(dot(snapshot.equatorBasis.second, north)) > 1e-12 || Math.abs(dot(snapshot.equatorBasis.first, snapshot.equatorBasis.second)) > 1e-12) {
    return issue('INVARIANT_FAILURE', 'Equator basis must be perpendicular to the shared pole and internally orthogonal.');
  }
  return undefined;
}

export function buildScientificSnapshot(input: ScientificSnapshotInput): ScientificSnapshotBuildResult {
  const snapshotWarnings = warnings();
  const errors = validateInput(input);
  if (errors.length > 0 || input.observer.kind !== 'ready' || input.calibration.kind !== 'ready') {
    return Object.freeze({ kind: 'not-ready', errors, warnings: snapshotWarnings });
  }
  try {
    const earthAxis = input.providers.meanPole.getMeanPole({
      instant: input.clock.instant,
      sourceFrame: 'GCRS',
      modelReferenceEpoch: 'J2000.0',
      outputFrame: 'P03_MEAN_EQUATOR_OF_DATE',
    });
    const equatorBasis = createMeanEquatorBasis(earthAxis.north);
    const revisions: ScientificRevisions = Object.freeze({
      observer: input.observer.revision,
      time: input.clock.revision,
      geographicCalibration: input.calibration.revision,
      configuration: input.configuration.revision,
    });
    const candidate = {
      earthAxis,
      equatorBasis,
    };
    const invariantFailure = verifyAxis(candidate);
    if (invariantFailure) return Object.freeze({ kind: 'not-ready', errors: Object.freeze([invariantFailure]), warnings: snapshotWarnings });
    const cacheKey = createScientificSnapshotKey(input);
    const snapshot: ScientificSnapshot = Object.freeze({
      kind: 'ready',
      cacheKey,
      creationSequence: input.creationSequence,
      observer: input.observer,
      clock: input.clock,
      geographicCalibration: input.calibration,
      configuration: input.configuration,
      revisions,
      frameContract: Object.freeze({
        horizontal: 'HORIZONTAL_ENU_EAST_NORTH_UP',
        applicationBasis: 'ENU_EAST_TO_X__UP_TO_Y__NORTH_TO_NEGATIVE_Z',
        calibratedYawApplication: 'presentation-parent-only',
      }),
      earthAxis,
      equatorBasis,
      providers: Object.freeze({
        astronomyEngineVersion: input.providers.astronomy.version,
        meanPoleProviderVersion: input.providers.meanPole.version,
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
