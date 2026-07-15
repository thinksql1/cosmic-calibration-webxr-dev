import { describe, expect, it, vi } from 'vitest';
import {
  detectImmersiveAr,
  ImmersiveArSessionController,
  type ImmersiveArSession,
  type SessionBinder,
  type XRSessionApi,
  type XRState,
} from '../src/xr/state';

interface Deferred<Value> {
  promise: Promise<Value>;
  resolve(value: Value): void;
  reject(error: unknown): void;
}

function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

class FakeSession implements ImmersiveArSession {
  private readonly endListeners = new Set<() => void>();
  endCalls = 0;
  endImplementation: () => Promise<void> = async () => {
    this.emitEnd();
  };

  addEventListener(type: 'end', listener: () => void): void {
    if (type === 'end') this.endListeners.add(listener);
  }

  async end(): Promise<void> {
    this.endCalls += 1;
    await this.endImplementation();
  }

  emitEnd(): void {
    const listeners = [...this.endListeners];
    this.endListeners.clear();
    listeners.forEach((listener) => listener());
  }
}

function createController(
  xr: XRSessionApi,
  bindSession: SessionBinder,
  states: XRState[],
  diagnostics = vi.fn(),
): ImmersiveArSessionController {
  return new ImmersiveArSessionController(
    xr,
    bindSession,
    (state) => states.push(state),
    diagnostics,
  );
}

describe('detectImmersiveAr', () => {
  it('reports an insecure context before probing WebXR', async () => {
    const isSessionSupported = vi.fn();
    const state = await detectImmersiveAr({
      isSecureContext: false,
      xr: { isSessionSupported },
    });

    expect(state.kind).toBe('insecure-context');
    expect(isSessionSupported).not.toHaveBeenCalled();
  });

  it('reports a missing WebXR API', async () => {
    const state = await detectImmersiveAr({ isSecureContext: true });
    expect(state.kind).toBe('api-unavailable');
  });

  it('reports immersive AR support', async () => {
    const isSessionSupported = vi.fn().mockResolvedValue(true);
    const state = await detectImmersiveAr({
      isSecureContext: true,
      xr: { isSessionSupported },
    });

    expect(state.kind).toBe('supported');
    expect(isSessionSupported).toHaveBeenCalledWith('immersive-ar');
  });

  it('reports immersive AR as unsupported', async () => {
    const state = await detectImmersiveAr({
      isSecureContext: true,
      xr: { isSessionSupported: vi.fn().mockResolvedValue(false) },
    });
    expect(state.kind).toBe('unsupported');
  });

  it('maps capability-check rejection to a readable state', async () => {
    const state = await detectImmersiveAr({
      isSecureContext: true,
      xr: {
        isSessionSupported: vi.fn().mockRejectedValue(new Error('probe failed')),
      },
    });
    expect(state).toMatchObject({ kind: 'check-failed', detail: 'probe failed' });
  });
});

describe('ImmersiveArSessionController', () => {
  it('maps request-session rejection to a readable state', async () => {
    const states: XRState[] = [];
    const requestSession = vi.fn().mockRejectedValue(new Error('permission denied'));
    const controller = createController(
      { requestSession },
      vi.fn(),
      states,
    );

    await controller.start();

    expect(states.map((state) => state.kind)).toEqual([
      'session-starting',
      'session-denied-or-failed',
    ]);
    expect(states.at(-1)?.detail).toBe('permission denied');
  });

  it('requires local-floor and does not report active until renderer binding succeeds', async () => {
    const session = new FakeSession();
    const binding = deferred<void>();
    const states: XRState[] = [];
    const requestSession = vi.fn().mockResolvedValue(session);
    const bindSession = vi.fn().mockReturnValue(binding.promise);
    const controller = createController({ requestSession }, bindSession, states);

    const start = controller.start();
    await flushMicrotasks();

    expect(requestSession).toHaveBeenCalledWith('immersive-ar', {
      requiredFeatures: ['local-floor'],
    });
    expect(bindSession).toHaveBeenCalledWith(session);
    expect(states.map((state) => state.kind)).toEqual(['session-starting']);

    binding.resolve();
    await start;

    expect(states.map((state) => state.kind)).toEqual([
      'session-starting',
      'session-active',
    ]);
  });

  it('blocks duplicate starts while the session request is pending', async () => {
    const requestedSession = deferred<ImmersiveArSession>();
    const session = new FakeSession();
    const states: XRState[] = [];
    const requestSession = vi.fn().mockReturnValue(requestedSession.promise);
    const controller = createController({ requestSession }, vi.fn(), states);

    const start = controller.start();
    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(1);

    requestedSession.resolve(session);
    await start;
  });

  it('blocks duplicate starts while renderer binding is pending', async () => {
    const session = new FakeSession();
    const binding = deferred<void>();
    const states: XRState[] = [];
    const requestSession = vi.fn().mockResolvedValue(session);
    const bindSession = vi.fn().mockReturnValue(binding.promise);
    const controller = createController({ requestSession }, bindSession, states);

    const start = controller.start();
    await flushMicrotasks();
    await controller.start();

    expect(requestSession).toHaveBeenCalledTimes(1);
    expect(bindSession).toHaveBeenCalledTimes(1);

    binding.resolve();
    await start;
  });

  it('blocks duplicate starts while a renderer-bound session is active', async () => {
    const session = new FakeSession();
    const states: XRState[] = [];
    const requestSession = vi.fn().mockResolvedValue(session);
    const bindSession = vi.fn().mockResolvedValue(undefined);
    const controller = createController({ requestSession }, bindSession, states);

    await controller.start();
    await controller.start();

    expect(requestSession).toHaveBeenCalledTimes(1);
    expect(bindSession).toHaveBeenCalledTimes(1);
    expect(states.at(-1)?.kind).toBe('session-active');
  });

  it('ends an acquired session when renderer binding rejects', async () => {
    const session = new FakeSession();
    const states: XRState[] = [];
    const diagnostics = vi.fn();
    const controller = createController(
      { requestSession: vi.fn().mockResolvedValue(session) },
      vi.fn().mockRejectedValue(new Error('reference space failed')),
      states,
      diagnostics,
    );

    await controller.start();

    expect(session.endCalls).toBe(1);
    expect(diagnostics).toHaveBeenCalledWith('binding', expect.any(Error));
    expect(states.map((state) => state.kind)).toEqual([
      'session-starting',
      'session-cleaning',
      'session-denied-or-failed',
    ]);
    expect(states.at(-1)?.detail).toContain('reference space failed');
  });

  it('blocks retry during cleanup and permits it after successful cleanup', async () => {
    const firstSession = new FakeSession();
    const cleanup = deferred<void>();
    firstSession.endImplementation = () => cleanup.promise;
    const secondSession = new FakeSession();
    const states: XRState[] = [];
    const requestSession = vi
      .fn()
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);
    const bindSession = vi
      .fn()
      .mockRejectedValueOnce(new Error('renderer rejected'))
      .mockResolvedValueOnce(undefined);
    const controller = createController({ requestSession }, bindSession, states);

    const failedStart = controller.start();
    await flushMicrotasks();
    expect(firstSession.endCalls).toBe(1);

    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(1);

    cleanup.resolve();
    await failedStart;

    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(2);
    expect(states.at(-1)?.kind).toBe('session-active');
  });

  it('handles a session end during renderer binding without reporting false active state', async () => {
    const firstSession = new FakeSession();
    const secondSession = new FakeSession();
    const binding = deferred<void>();
    const states: XRState[] = [];
    const requestSession = vi
      .fn()
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);
    const bindSession = vi
      .fn()
      .mockReturnValueOnce(binding.promise)
      .mockResolvedValueOnce(undefined);
    const controller = createController({ requestSession }, bindSession, states);

    const firstStart = controller.start();
    await flushMicrotasks();
    firstSession.emitEnd();
    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(1);

    binding.resolve();
    await firstStart;

    expect(states.map((state) => state.kind)).toEqual([
      'session-starting',
      'session-cleaning',
      'session-ended',
    ]);
    expect(states.some((state) => state.kind === 'session-active')).toBe(false);

    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(2);
  });

  it('returns to an ended state and allows retry after an active session ends', async () => {
    const firstSession = new FakeSession();
    const secondSession = new FakeSession();
    const states: XRState[] = [];
    const requestSession = vi
      .fn()
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);
    const controller = createController(
      { requestSession },
      vi.fn().mockResolvedValue(undefined),
      states,
    );

    await controller.start();
    firstSession.emitEnd();
    await controller.start();

    expect(requestSession).toHaveBeenCalledTimes(2);
    expect(states.map((state) => state.kind)).toEqual([
      'session-starting',
      'session-active',
      'session-ended',
      'session-starting',
      'session-active',
    ]);
  });

  it('surfaces cleanup failure without retaining stale internal ownership', async () => {
    const firstSession = new FakeSession();
    firstSession.endImplementation = () => Promise.reject(new Error('end rejected'));
    const secondSession = new FakeSession();
    const states: XRState[] = [];
    const diagnostics = vi.fn();
    const requestSession = vi
      .fn()
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);
    const bindSession = vi
      .fn()
      .mockRejectedValueOnce(new Error('binding rejected'))
      .mockResolvedValueOnce(undefined);
    const controller = createController({ requestSession }, bindSession, states, diagnostics);

    await controller.start();

    expect(firstSession.endCalls).toBe(1);
    expect(diagnostics).toHaveBeenCalledWith('cleanup', expect.any(Error));
    expect(states.at(-1)).toMatchObject({
      kind: 'session-denied-or-failed',
      detail: expect.stringContaining('Session cleanup also failed: end rejected'),
    });

    await controller.start();
    expect(requestSession).toHaveBeenCalledTimes(2);
    expect(states.at(-1)?.kind).toBe('session-active');
  });
});
