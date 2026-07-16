import {
  bearingDegreesToDirection,
  calculateSignedYaw,
  projectToHorizontal,
  type HorizontalDirection,
  type Vector3Value,
} from './math';

export interface CalibrationRecord {
  readonly yawRadians: number;
  readonly capturedDirection: HorizontalDirection;
  readonly controllerHandedness?: XRHandedness;
  readonly sourceIdentifier?: string;
  readonly timestamp: number;
  readonly simulated: boolean;
}

interface CalibrationAttemptState {
  readonly previousCalibration?: CalibrationRecord;
}

export type NorthCalibrationState =
  | { readonly kind: 'uncalibrated' }
  | ({ readonly kind: 'calibrating' } & CalibrationAttemptState)
  | { readonly kind: 'calibrated'; readonly calibration: CalibrationRecord }
  | ({ readonly kind: 'invalid-direction'; readonly message: string } & CalibrationAttemptState)
  | ({ readonly kind: 'controller-unavailable'; readonly message: string } & CalibrationAttemptState)
  | ({ readonly kind: 'capture-failed'; readonly message: string } & CalibrationAttemptState);

type ActiveCalibrationState = Extract<
  NorthCalibrationState,
  { readonly kind: 'calibrating' | 'invalid-direction' | 'controller-unavailable' | 'capture-failed' }
>;

export interface CaptureMetadata {
  readonly controllerHandedness?: XRHandedness;
  readonly sourceIdentifier?: string;
  readonly timestamp?: number;
  readonly simulated: boolean;
}

export type CalibrationStateListener = (state: NorthCalibrationState) => void;

export function isCalibrationActive(
  state: NorthCalibrationState,
): state is ActiveCalibrationState {
  return (
    state.kind === 'calibrating' ||
    state.kind === 'invalid-direction' ||
    state.kind === 'controller-unavailable' ||
    state.kind === 'capture-failed'
  );
}

function priorCalibration(state: NorthCalibrationState): CalibrationRecord | undefined {
  if (state.kind === 'calibrated') return state.calibration;
  if (isCalibrationActive(state)) return state.previousCalibration;
  return undefined;
}

export class NorthCalibrationController {
  private state: NorthCalibrationState = { kind: 'uncalibrated' };
  private readonly listeners = new Set<CalibrationStateListener>();

  get current(): NorthCalibrationState {
    return this.state;
  }

  subscribe(listener: CalibrationStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  begin(controllerAvailable: boolean): void {
    const previousCalibration = priorCalibration(this.state);
    this.setState(
      controllerAvailable
        ? { kind: 'calibrating', previousCalibration }
        : {
            kind: 'controller-unavailable',
            previousCalibration,
            message: 'Connect either tracked controller, then try again.',
          },
    );
  }

  noteControllerAvailable(): void {
    if (this.state.kind !== 'controller-unavailable') return;
    this.setState({
      kind: 'calibrating',
      previousCalibration: this.state.previousCalibration,
    });
  }

  noteControllerUnavailable(): void {
    if (!isCalibrationActive(this.state)) return;
    this.setState({
      kind: 'controller-unavailable',
      previousCalibration: priorCalibration(this.state),
      message: 'No usable tracked controller is connected.',
    });
  }

  capture(direction: Vector3Value, metadata: CaptureMetadata): boolean {
    if (!isCalibrationActive(this.state)) return false;

    const previousCalibration = priorCalibration(this.state);
    const projection = projectToHorizontal(direction);
    if (!projection.valid) {
      this.setState({
        kind: 'invalid-direction',
        previousCalibration,
        message:
          projection.reason === 'non-finite'
            ? 'The controller direction could not be read. Hold it steady and try again.'
            : 'Point the controller toward the north marker with the controller held approximately level.',
      });
      return false;
    }

    const yawRadians = calculateSignedYaw(projection.direction);
    if (!Number.isFinite(yawRadians)) {
      this.setState({
        kind: 'capture-failed',
        previousCalibration,
        message: 'North calibration could not be calculated. Try again.',
      });
      return false;
    }

    this.setState({
      kind: 'calibrated',
      calibration: {
        yawRadians,
        capturedDirection: projection.direction,
        controllerHandedness: metadata.controllerHandedness,
        sourceIdentifier: metadata.sourceIdentifier,
        timestamp: metadata.timestamp ?? Date.now(),
        simulated: metadata.simulated,
      },
    });
    return true;
  }

  captureFailed(message: string): void {
    if (!isCalibrationActive(this.state)) return;
    this.setState({
      kind: 'capture-failed',
      previousCalibration: priorCalibration(this.state),
      message,
    });
  }

  simulateBearing(degrees: number, timestamp = Date.now()): boolean {
    const direction = bearingDegreesToDirection(degrees);
    this.begin(true);
    return this.capture(direction, { simulated: true, timestamp });
  }

  cancel(): void {
    if (!isCalibrationActive(this.state)) return;
    const previousCalibration = priorCalibration(this.state);
    this.setState(
      previousCalibration
        ? { kind: 'calibrated', calibration: previousCalibration }
        : { kind: 'uncalibrated' },
    );
  }

  reset(): void {
    this.setState({ kind: 'uncalibrated' });
  }

  private setState(state: NorthCalibrationState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }
}
