import { AstronomyContractError } from '../astronomy/errors';
import { createSimulationInstant } from '../astronomy/time';
import type { SimulationInstant, SimulationInstantSource } from '../astronomy/types';

export type SimulationClockMode = 'frozen' | 'realtime';

export interface SimulationClockState {
  readonly version: 1;
  readonly mode: SimulationClockMode;
  readonly paused: boolean;
  readonly timeRate: number;
  readonly instant: SimulationInstant;
  readonly revision: number;
}

export interface SerializedSimulationClock {
  readonly version: 1;
  readonly state: SimulationClockState;
}

function freezeState(state: SimulationClockState): SimulationClockState {
  return Object.freeze(state);
}

function updateInstant(
  instant: SimulationInstant,
  milliseconds: number,
  source: SimulationInstantSource,
): SimulationInstant {
  return createSimulationInstant(new Date(instant.unixMilliseconds + milliseconds).toISOString(), source);
}

export class SimulationClock {
  private state: SimulationClockState;

  constructor(initial: SimulationInstant) {
    this.state = freezeState({
      version: 1,
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
    this.state = freezeState({ ...this.state, mode: 'frozen', paused: true, instant, revision: this.state.revision + 1 });
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
    if (!Number.isFinite(timeRate)) {
      throw new AstronomyContractError('INVALID_INSTANT', 'Simulation time rate must be finite.');
    }
    if (this.state.timeRate === timeRate) return this.state;
    this.state = freezeState({ ...this.state, timeRate, revision: this.state.revision + 1 });
    return this.state;
  }

  tick(elapsedMilliseconds: number): SimulationClockState {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
      throw new AstronomyContractError('INVALID_INSTANT', 'Clock tick elapsed milliseconds must be finite and non-negative.');
    }
    if (this.state.mode !== 'realtime' || this.state.paused || elapsedMilliseconds === 0 || this.state.timeRate === 0) {
      return this.state;
    }
    this.state = freezeState({
      ...this.state,
      instant: updateInstant(this.state.instant, elapsedMilliseconds * this.state.timeRate, 'system-selected'),
      revision: this.state.revision + 1,
    });
    return this.state;
  }

  serialize(): SerializedSimulationClock {
    return Object.freeze({ version: 1, state: this.state });
  }

  restore(serialized: SerializedSimulationClock): SimulationClockState {
    if (serialized.version !== 1 || serialized.state.version !== 1) {
      throw new AstronomyContractError('INVALID_INSTANT', 'Unsupported simulation-clock serialization version.');
    }
    if (!Number.isFinite(serialized.state.timeRate)) {
      throw new AstronomyContractError('INVALID_INSTANT', 'Serialized simulation clock has an invalid time rate.');
    }
    const instant = createSimulationInstant(serialized.state.instant.utcIso, serialized.state.instant.source);
    this.state = freezeState({
      ...serialized.state,
      instant,
      revision: this.state.revision + 1,
    });
    return this.state;
  }
}
