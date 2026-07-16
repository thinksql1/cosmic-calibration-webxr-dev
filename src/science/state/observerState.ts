import { AstronomyContractError } from '../astronomy/errors';
import { createObserver } from '../astronomy/observer';
import type { ObserverInput, ValidatedObserver } from '../astronomy/types';

export interface ObserverStateReady {
  readonly kind: 'ready';
  readonly observer: ValidatedObserver;
  readonly revision: number;
}

export interface ObserverStateNotReady {
  readonly kind: 'not-ready';
  readonly revision: number;
}

export type ObserverState = ObserverStateReady | ObserverStateNotReady;

export interface SerializedObserverState {
  readonly version: 1;
  readonly state: ObserverState;
}

function freezeState(state: ObserverState): ObserverState {
  return Object.freeze(state);
}

function observerEquals(
  left: ValidatedObserver | undefined,
  right: ValidatedObserver | undefined,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class ObserverStateStore {
  private state: ObserverState = freezeState({ kind: 'not-ready', revision: 0 });

  get current(): ObserverState {
    return this.state;
  }

  set(input: ObserverInput): ObserverState {
    const observer = createObserver(input);
    if (this.state.kind === 'ready' && observerEquals(this.state.observer, observer)) {
      return this.state;
    }
    this.state = freezeState({
      kind: 'ready',
      observer,
      revision: this.state.revision + 1,
    });
    return this.state;
  }

  clear(): ObserverState {
    if (this.state.kind === 'not-ready') return this.state;
    this.state = freezeState({ kind: 'not-ready', revision: this.state.revision + 1 });
    return this.state;
  }

  serialize(): SerializedObserverState {
    return Object.freeze({ version: 1, state: this.state });
  }

  restore(serialized: SerializedObserverState): ObserverState {
    if (serialized.version !== 1) {
      throw new AstronomyContractError('INVALID_OBSERVER', 'Unsupported observer-state serialization version.');
    }
    if (serialized.state.kind === 'not-ready') return this.clear();
    return this.set(serialized.state.observer);
  }
}
