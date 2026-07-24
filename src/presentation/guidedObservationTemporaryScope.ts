/** Narrow, synchronous scope used to prevent temporary guided-observation changes from persisting user appearance preferences. */
export class GuidedObservationTemporaryScope {
  private active = false;
  get isActive(): boolean { return this.active; }
  run<T>(operation: () => T): T { this.active = true; try { return operation(); } finally { this.active = false; } }
}
