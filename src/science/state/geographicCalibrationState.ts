import type { NorthCalibrationState } from '../../calibration/state';

export interface GeographicCalibrationReady {
  readonly kind: 'ready';
  readonly yawRadians: number;
  readonly revision: number;
  readonly provenance: 'user-calibrated-true-north';
  readonly originIdentity?: string;
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

function asScientificView(
  calibration: NorthCalibrationState,
  revision: number,
  originIdentity?: string,
): GeographicCalibrationState {
  if (calibration.kind !== 'calibrated') {
    return freezeState({ kind: 'not-ready', revision, reason: revision === 0 ? 'uncalibrated' : 'invalidated' });
  }
  return freezeState({
    kind: 'ready',
    yawRadians: calibration.calibration.yawRadians,
    revision,
    provenance: 'user-calibrated-true-north',
    ...(originIdentity === undefined ? {} : { originIdentity }),
  });
}

export class GeographicCalibrationStateAdapter {
  private state: GeographicCalibrationState = freezeState({ kind: 'not-ready', revision: 0, reason: 'uncalibrated' });

  get current(): GeographicCalibrationState {
    return this.state;
  }

  update(calibration: NorthCalibrationState, originIdentity?: string): GeographicCalibrationState {
    const candidate = asScientificView(calibration, this.state.revision, originIdentity);
    const unchanged = JSON.stringify({ ...candidate, revision: 0 }) === JSON.stringify({ ...this.state, revision: 0 });
    if (unchanged) return this.state;
    this.state = asScientificView(calibration, this.state.revision + 1, originIdentity);
    return this.state;
  }

  invalidate(): GeographicCalibrationState {
    if (this.state.kind === 'not-ready' && this.state.reason === 'invalidated') return this.state;
    this.state = freezeState({ kind: 'not-ready', revision: this.state.revision + 1, reason: 'invalidated' });
    return this.state;
  }
}
