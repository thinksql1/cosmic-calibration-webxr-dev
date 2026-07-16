import type { CalibrationRecord, NorthCalibrationState } from '../../calibration/state';

export interface GeographicCalibrationReady {
  readonly kind: 'ready';
  readonly yawRadians: number;
  readonly revision: number;
  readonly provenance: 'user-calibrated-true-north';
  readonly originIdentity?: string;
  readonly acceptedCalibrationRevision?: number;
}

export interface GeographicCalibrationNotReady {
  readonly kind: 'not-ready';
  readonly revision: number;
  readonly reason: 'uncalibrated' | 'invalidated';
}

export type GeographicCalibrationState = GeographicCalibrationReady | GeographicCalibrationNotReady;

function freezeState(state: GeographicCalibrationState): GeographicCalibrationState {
  return Object.freeze(state);
}

function acceptedCalibration(
  calibration: NorthCalibrationState,
): CalibrationRecord | undefined {
  if (calibration.kind === 'calibrated') return calibration.calibration;
  return 'previousCalibration' in calibration
    ? calibration.previousCalibration
    : undefined;
}

function readyState(
  calibration: CalibrationRecord,
  revision: number,
  originIdentity?: string,
): GeographicCalibrationReady {
  return Object.freeze({
    kind: 'ready',
    yawRadians: calibration.yawRadians,
    revision,
    provenance: 'user-calibrated-true-north',
    ...(originIdentity === undefined ? {} : { originIdentity }),
    ...(calibration.acceptedRevision === undefined
      ? {}
      : { acceptedCalibrationRevision: calibration.acceptedRevision }),
  }) as GeographicCalibrationReady;
}

export class GeographicCalibrationStateAdapter {
  private state: GeographicCalibrationState = freezeState({ kind: 'not-ready', revision: 0, reason: 'uncalibrated' });

  get current(): GeographicCalibrationState {
    return this.state;
  }

  update(calibration: NorthCalibrationState, originIdentity?: string): GeographicCalibrationState {
    const accepted = acceptedCalibration(calibration);
    if (accepted) {
      const hasAcceptedEventIdentity = accepted.acceptedRevision !== undefined;
      if (
        this.state.kind === 'ready' &&
        this.state.yawRadians === accepted.yawRadians &&
        this.state.originIdentity === originIdentity &&
        (!hasAcceptedEventIdentity ||
          this.state.acceptedCalibrationRevision === accepted.acceptedRevision)
      ) {
        return this.state;
      }
      const revision = accepted.acceptedRevision ?? this.state.revision + 1;
      const candidate = readyState(accepted, revision, originIdentity);
      this.state = candidate;
      return this.state;
    }

    if (this.state.kind === 'not-ready' && this.state.reason === 'uncalibrated') {
      return this.state;
    }
    this.state = freezeState({
      kind: 'not-ready',
      revision: this.state.revision + 1,
      reason: this.state.revision === 0 ? 'uncalibrated' : 'invalidated',
    });
    return this.state;
  }

  invalidate(): GeographicCalibrationState {
    if (this.state.kind === 'not-ready' && this.state.reason === 'invalidated') return this.state;
    this.state = freezeState({ kind: 'not-ready', revision: this.state.revision + 1, reason: 'invalidated' });
    return this.state;
  }
}
