import type { ScientificSnapshot, ScientificSnapshotBuildResult } from './scientificSnapshot';

export interface ScientificSnapshotCacheDiagnostics {
  readonly hits: number;
  readonly misses: number;
  readonly entries: number;
}

/** A small exact-key LRU cache. Running, unpaused clocks deliberately bypass it. */
export class ScientificSnapshotCache {
  private readonly entries = new Map<string, ScientificSnapshot>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly maximumEntries = 32) {
    if (!Number.isInteger(maximumEntries) || maximumEntries < 1) throw new Error('Scientific snapshot cache must have a positive integer maximum size.');
  }

  getOrBuild(
    key: string,
    cacheable: boolean,
    build: () => ScientificSnapshotBuildResult,
  ): ScientificSnapshotBuildResult {
    if (cacheable) {
      const existing = this.entries.get(key);
      if (existing) {
        this.hits += 1;
        this.entries.delete(key);
        this.entries.set(key, existing);
        return Object.freeze({ kind: 'ready', snapshot: existing });
      }
    }
    this.misses += 1;
    const result = build();
    if (cacheable && result.kind === 'ready') {
      this.entries.set(key, result.snapshot);
      if (this.entries.size > this.maximumEntries) this.entries.delete(this.entries.keys().next().value as string);
    }
    return result;
  }

  clear(): void {
    this.entries.clear();
  }

  get diagnostics(): ScientificSnapshotCacheDiagnostics {
    return Object.freeze({ hits: this.hits, misses: this.misses, entries: this.entries.size });
  }
}
