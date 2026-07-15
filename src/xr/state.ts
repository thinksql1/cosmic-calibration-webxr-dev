export type XRStateKind =
  | 'insecure-context'
  | 'api-unavailable'
  | 'checking'
  | 'supported'
  | 'unsupported'
  | 'check-failed'
  | 'session-starting'
  | 'session-cleaning'
  | 'session-active'
  | 'session-ended'
  | 'session-denied-or-failed';

export interface XRState {
  kind: XRStateKind;
  message: string;
  detail?: string;
}

export interface XRCapabilityApi {
  isSessionSupported(mode: 'immersive-ar'): Promise<boolean>;
}

export interface CapabilityEnvironment {
  isSecureContext: boolean;
  xr?: XRCapabilityApi;
}

export const checkingState: XRState = {
  kind: 'checking',
  message: 'Checking immersive AR availability…',
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function detectImmersiveAr(
  environment: CapabilityEnvironment,
): Promise<XRState> {
  if (!environment.isSecureContext) {
    return {
      kind: 'insecure-context',
      message: 'A secure context is required for WebXR.',
      detail: 'Open this site over HTTPS or from localhost for development.',
    };
  }

  if (!environment.xr) {
    return {
      kind: 'api-unavailable',
      message: 'This browser does not expose the WebXR API.',
      detail: 'The desktop reference scene remains available.',
    };
  }

  try {
    const supported = await environment.xr.isSessionSupported('immersive-ar');
    return supported
      ? {
          kind: 'supported',
          message: 'Immersive AR is available.',
          detail: 'Enter AR to request a floor-relative session.',
        }
      : {
          kind: 'unsupported',
          message: 'Immersive AR is not supported in this browser.',
          detail: 'The desktop reference scene remains available.',
        };
  } catch (error) {
    return {
      kind: 'check-failed',
      message: 'The immersive AR capability check failed.',
      detail: errorMessage(error),
    };
  }
}

export interface ImmersiveArSession {
  addEventListener(
    type: 'end',
    listener: () => void,
    options?: { once?: boolean },
  ): void;
  end(): Promise<void>;
}

export interface XRSessionApi {
  requestSession(
    mode: 'immersive-ar',
    options: XRSessionInit,
  ): Promise<ImmersiveArSession>;
}

export type SessionBinder = (session: ImmersiveArSession) => Promise<void>;
export type StateListener = (state: XRState) => void;
export type SessionDiagnosticListener = (
  phase: 'binding' | 'cleanup',
  error: unknown,
) => void;

type SessionPhase =
  | 'idle'
  | 'requesting'
  | 'binding'
  | 'binding-ended'
  | 'active'
  | 'ending';

export class ImmersiveArSessionController {
  private phase: SessionPhase = 'idle';
  private ownedSession?: ImmersiveArSession;

  constructor(
    private readonly xr: XRSessionApi,
    private readonly bindSession: SessionBinder,
    private readonly onState: StateListener,
    private readonly onDiagnostic: SessionDiagnosticListener = () => {},
  ) {}

  async start(): Promise<void> {
    if (this.phase !== 'idle') return;

    this.phase = 'requesting';
    this.onState({
      kind: 'session-starting',
      message: 'Requesting an immersive AR session…',
      detail: 'A floor-relative reference space is required.',
    });

    try {
      const session = await this.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
      });

      // A successful request owns an immersive session before renderer setup finishes.
      this.ownedSession = session;
      this.phase = 'binding';
      session.addEventListener('end', () => this.handleSessionEnd(session), { once: true });

      await this.bindSession(session);

      if (this.phase !== 'binding' || this.ownedSession !== session) {
        this.finishBindingAfterSessionEnd();
        return;
      }

      this.phase = 'active';
      this.onState({
        kind: 'session-active',
        message: 'Immersive AR session active.',
        detail: 'Floor placement and passthrough still require physical Quest verification.',
      });
    } catch (error) {
      if (this.phase === 'requesting') {
        this.phase = 'idle';
        this.onState({
          kind: 'session-denied-or-failed',
          message: 'The immersive AR session was denied or could not start.',
          detail: errorMessage(error),
        });
        return;
      }

      await this.handleBindingFailure(error);
    }
  }

  private async handleBindingFailure(bindingError: unknown): Promise<void> {
    this.onDiagnostic('binding', bindingError);

    if (!this.ownedSession) {
      this.finishBindingAfterSessionEnd();
      return;
    }

    const session = this.ownedSession;
    this.phase = 'ending';
    this.onState({
      kind: 'session-cleaning',
      message: 'Renderer setup failed; ending the immersive AR session.',
      detail: 'Retry remains unavailable until cleanup completes.',
    });

    let cleanupError: unknown;
    try {
      await session.end();
    } catch (error) {
      cleanupError = error;
      this.onDiagnostic('cleanup', error);
    }

    if (this.ownedSession === session) this.ownedSession = undefined;
    this.phase = 'idle';

    this.onState({
      kind: 'session-denied-or-failed',
      message: 'The immersive AR session could not start.',
      detail: cleanupError
        ? `Renderer setup failed: ${errorMessage(bindingError)}. Session cleanup also failed: ${errorMessage(cleanupError)}.`
        : `Renderer setup failed: ${errorMessage(bindingError)}. The acquired session was ended.`,
    });
  }

  private handleSessionEnd(session: ImmersiveArSession): void {
    if (this.ownedSession !== session) return;

    this.ownedSession = undefined;

    if (this.phase === 'binding') {
      this.phase = 'binding-ended';
      this.onState({
        kind: 'session-cleaning',
        message: 'The immersive AR session ended while renderer setup was pending.',
        detail: 'Retry remains unavailable until renderer setup settles.',
      });
      return;
    }

    if (this.phase === 'ending') return;

    this.phase = 'idle';
    this.emitSessionEnded();
  }

  private finishBindingAfterSessionEnd(): void {
    if (this.phase !== 'binding-ended') return;

    this.phase = 'idle';
    this.emitSessionEnded();
  }

  private emitSessionEnded(): void {
    this.onState({
      kind: 'session-ended',
      message: 'Immersive AR session ended.',
      detail: 'The desktop reference scene is active again.',
    });
  }
}
