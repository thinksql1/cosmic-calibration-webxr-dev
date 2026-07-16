import type { MeanPoleResult } from '../astronomy/types';
import type { MeanEquatorBasis } from '../frames/earthAxisState';
import type { ScientificRevisions } from '../state/scientificRevisions';
import type { GeographicCalibrationState } from '../state/geographicCalibrationState';
import type { ObserverStateReady } from '../state/observerState';
import type { SimulationClockState } from '../state/simulationClock';
import type { ScientificConfiguration } from '../state/scientificConfiguration';

export type ScientificIssueCode =
  | 'OBSERVER_MISSING'
  | 'CALIBRATION_MISSING'
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_CONFIGURATION'
  | 'MODEL_DOMAIN'
  | 'PROVIDER_FAILURE'
  | 'NON_FINITE_RESULT'
  | 'INVARIANT_FAILURE';

export interface ScientificIssue {
  readonly code: ScientificIssueCode;
  readonly message: string;
}

export type ScientificWarningCode =
  | 'TIER_1_UTC_APPROXIMATES_UT1'
  | 'NO_LIVE_EOP'
  | 'MEAN_AXIS_EXCLUDES_NUTATION'
  | 'NO_POLAR_MOTION'
  | 'HEIGHT_DATUM_REFERENCE_DIFFERENCE'
  | 'NO_PRECISION_CLAIM_BEYOND_TIER_1';

export interface ScientificWarning {
  readonly code: ScientificWarningCode;
  readonly message: string;
}

export interface ScientificSnapshot {
  readonly kind: 'ready';
  readonly cacheKey: string;
  readonly creationSequence: number;
  readonly observer: ObserverStateReady;
  readonly clock: SimulationClockState;
  readonly geographicCalibration: Extract<GeographicCalibrationState, { readonly kind: 'ready' }>;
  readonly configuration: ScientificConfiguration;
  readonly revisions: ScientificRevisions;
  readonly frameContract: {
    readonly horizontal: 'HORIZONTAL_ENU_EAST_NORTH_UP';
    readonly applicationBasis: 'ENU_EAST_TO_X__UP_TO_Y__NORTH_TO_NEGATIVE_Z';
    readonly calibratedYawApplication: 'presentation-parent-only';
  };
  readonly earthAxis: MeanPoleResult;
  readonly equatorBasis: MeanEquatorBasis;
  readonly providers: {
    readonly astronomyEngineVersion: string;
    readonly meanPoleProviderVersion: string;
  };
  readonly warnings: readonly ScientificWarning[];
}

export type ScientificSnapshotBuildResult =
  | { readonly kind: 'ready'; readonly snapshot: ScientificSnapshot }
  | { readonly kind: 'not-ready'; readonly errors: readonly ScientificIssue[]; readonly warnings: readonly ScientificWarning[] };
