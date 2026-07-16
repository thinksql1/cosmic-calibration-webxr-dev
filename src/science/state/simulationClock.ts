import { AstronomyContractError } from '../astronomy/errors';
import { createSimulationInstant } from '../astronomy/time';
import type { SimulationInstant, SimulationInstantSource } from '../astronomy/types';

export const SIMULATION_CLOCK_VERSION = 1 as const;
export type SimulationClockMode = 'frozen' | 'realtime';

export interface SimulationClockState {
  readonly version: typeof SIMULATION_CLOCK_VERSION;
  readonly mode: SimulationClockMode;
  readonly paused: boolean;
  readonly timeRate: number;
  readonly instant: SimulationInstant;
  readonly revision: number;
}

export interface SerializedSimulationClock {
  readonly version: typeof SIMULATION_CLOCK_VERSION;
  readonly state: SimulationClockState;
}

function freezeState(state: SimulationClockState): SimulationClockState {
  return Object.freeze(state);
}

function reject(message: string): never {
  throw new AstronomyContractError('INVALID_INSTANT', message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sameInstant(left: SimulationInstant, right: SimulationInstant): boolean {
  return (
    left.utcIso === right.utcIso &&
    left.unixMilliseconds === right.unixMilliseconds &&
    left.source === right.source
  );
}

function updateInstant(
  instant: SimulationInstant,
  milliseconds: number,
  source: SimulationInstantSource,
): SimulationInstant {
  if (!Number.isFinite(milliseconds)) {
    return reject('Clock tick produced a non-finite simulation-time change.');
  }
  const nextMilliseconds = instant.unixMilliseconds + milliseconds;
  if (!Number.isFinite(nextMilliseconds)) {
    return reject('Clock tick produced an invalid simulation instant.');
  }
  return createSimulationInstant(new Date(nextMilliseconds).toISOString(), source);
}

function normalizeSerializedState(value: unknown): Omit<SimulationClockState, 'revision'> {
  if (!isRecord(value)) return reject('Serialized simulation clock state must be an object.');
  if (value.version !== SIMULATION_CLOCK_VERSION) {
    return reject('Unsupported simulation-clock state serialization version.');
  }
  if (value.mode !== 'frozen' && value.mode !== 'realtime') {
    return reject('Serialized simulation clock has an unsupported mode.');
  }
  if (typeof value.paused !== 'boolean') {
    return reject('Serialized simulation clock paused state must be boolean.');
  }
  if (value.mode === 'frozen' && value.paused !== true) {
    return reject('Frozen simulation clocks must be paused.');
  }
  if (typeof value.timeRate !== 'number' || !Number.isFinite(value.timeRate)) {
    return reject('Serialized simulation clock has an invalid time rate.');
  }
  if (!Number.isInteger(value.revision) || (value.revision as number) < 0) {
    return reject('Serialized simulation clock has an invalid revision.');
  }
  if (!isRecord(value.instant) || typeof value.instant.utcIso !== 'string') {
    return reject('Serialized simulation clock has an invalid instant.');
  }
  if (
    value.instant.source !== 'frozen-test' &&
    value.instant.source !== 'user-selected' &&
    value.instant.source !== 'system-selected'
  ) {
    return reject('Serialized simulation clock has an invalid instant source.');
  }
  if (!Number.isFinite(value.instant.unixMilliseconds)) {
    return reject('Serialized simulation clock instant milliseconds must be finite.');
  }
  const instant = createSimulationInstant(value.instant.utcIso, value.instant.source);
  if (instant.unixMilliseconds !== value.instant.unixMilliseconds) {
    return reject('Serialized simulation clock instant fields disagree.');
  }
  return Object.freeze({
    version: SIMULATION_CLOCK_VERSION,
    mode: value.mode,
    paused: value.paused,
    timeRate: value.timeRate,
    instant,
  });
}

export class SimulationClock {
  private state: SimulationClockState;

  constructor(initial: SimulationInstant) {
    this.state = freezeState({
      version: SIMULATION_CLOCK_VERSION,
      mode: 'frozen',
      paused: true,
      timeRate: 1,
      instant: initial,
      revision: 0,
    });
  }

  get current(): SimulationClockState {
    return this.state;
  }

  selectFrozen(instant: SimulationInstant): SimulationClockState {
    if (
      this.state.mode === 'frozen' &&
      this.state.paused &&
      sameInstant(this.state.instant, instant)
    ) {
      return this.state;
    }
    this.state = freezeState({
      ...this.state,
      mode: 'frozen',
      paused: true,
      instant,
      revision: this.state.revision + 1,
    });
    return this.state;
  }

  startRealtime(): SimulationClockState {
    if (this.state.mode === 'realtime' && !this.state.paused) return this.state;
    this.state = freezeState({ ...this.state, mode: 'realtime', paused: false, revision: this.state.revision + 1 });
    return this.state;
  }

  pause(): SimulationClockState {
    if (this.state.paused) return this.state;
    this.state = freezeState({ ...this.state, paused: true, revision: this.state.revision + 1 });
    return this.state;
  }

  setRate(timeRate: number): SimulationClockState {
    if (!Number.isFinite(timeRate)) return reject('Simulation time rate must be finite.');
    if (this.state.timeRate === timeRate) return this.state;
    this.state = freezeState({ ...this.state, timeRate, revision: this.state.revision + 1 });
    return this.state;
  }

  tick(elapsedMilliseconds: number): SimulationClockState {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
      return reject('Clock tick elapsed milliseconds must be finite and non-negative.');
    }
    if (this.state.mode !== 'realtime' || this.state.paused || elapsedMilliseconds === 0 || this.state.timeRate === 0) {
      return this.state;
    }
    const instant = updateInstant(
      this.state.instant,
      elapsedMilliseconds * this.state.timeRate,
      'system-selected',
    );
    if (sameInstant(instant, this.state.instant)) return this.state;
    this.state = freezeState({ ...this.state, instant, revision: this.state.revision + 1 });
    return this.state;
  }

  serialize(): SerializedSimulationClock {
    return Object.freeze({ version: SIMULATION_CLOCK_VERSION, state: this.state });
  }

  restore(serialized: unknown): SimulationClockState {
    if (!isRecord(serialized) || serialized.version !== SIMULATION_CLOCK_VERSION) {
      return reject('Unsupported simulation-clock serialization version.');
    }
    const next = normalizeSerializedState(serialized.state);
    if (
      this.state.mode === next.mode &&
      this.state.paused === next.paused &&
      this.state.timeRate === next.timeRate &&
      sameInstant(this.state.instant, next.instant)
    ) {
      return this.state;
    }
    this.state = freezeState({ ...next, revision: this.state.revision + 1 });
    return this.state;
  }
}
