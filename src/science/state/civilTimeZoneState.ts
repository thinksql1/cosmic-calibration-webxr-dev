import { AstronomyContractError } from '../astronomy/errors';
import {
  resolveTimeZone,
  type ResolvedTimeZone,
} from '../temporal/civilTime';
import { isValidScientificRevision } from './runtimeValidation';

export interface CivilTimeZoneStateReady {
  readonly kind: 'ready';
  readonly timeZone: ResolvedTimeZone;
  readonly revision: number;
}

export interface CivilTimeZoneStateNotReady {
  readonly kind: 'not-ready';
  readonly revision: number;
}

export type CivilTimeZoneState = CivilTimeZoneStateReady | CivilTimeZoneStateNotReady;

function freezeState(state: CivilTimeZoneState): CivilTimeZoneState {
  return Object.freeze(state);
}

export class CivilTimeZoneStateStore {
  private state: CivilTimeZoneState = freezeState({ kind: 'not-ready', revision: 0 });

  get current(): CivilTimeZoneState {
    return this.state;
  }

  set(ianaName: string, source: ResolvedTimeZone['source']): CivilTimeZoneStateReady {
    const timeZone = resolveTimeZone(ianaName, source);
    if (
      this.state.kind === 'ready' &&
      this.state.timeZone.ianaName === timeZone.ianaName &&
      this.state.timeZone.source === timeZone.source
    ) return this.state as CivilTimeZoneStateReady;
    const next: CivilTimeZoneStateReady = Object.freeze({
      kind: 'ready',
      timeZone,
      revision: this.state.revision + 1,
    });
    this.state = next;
    return next;
  }

  clear(): CivilTimeZoneState {
    if (this.state.kind === 'not-ready') return this.state;
    this.state = freezeState({ kind: 'not-ready', revision: this.state.revision + 1 });
    return this.state;
  }

  restore(value: unknown): CivilTimeZoneState {
    if (typeof value !== 'object' || value === null) {
      throw new AstronomyContractError('INVALID_TIME_ZONE', 'Civil time-zone state must be an object.');
    }
    const candidate = value as Record<string, unknown>;
    if (!isValidScientificRevision(candidate.revision)) {
      throw new AstronomyContractError('INVALID_REVISION', 'Civil time-zone revision is invalid.');
    }
    if (candidate.kind === 'not-ready') return this.clear();
    if (candidate.kind !== 'ready' || typeof candidate.timeZone !== 'object' || candidate.timeZone === null) {
      throw new AstronomyContractError('INVALID_TIME_ZONE', 'Civil time-zone state is malformed.');
    }
    const timeZone = candidate.timeZone as Record<string, unknown>;
    if (typeof timeZone.ianaName !== 'string' || (timeZone.source !== 'browser-intl' && timeZone.source !== 'user-selected')) {
      throw new AstronomyContractError('INVALID_TIME_ZONE', 'Civil time-zone state has no valid IANA identity.');
    }
    return this.set(timeZone.ianaName, timeZone.source);
  }
}
