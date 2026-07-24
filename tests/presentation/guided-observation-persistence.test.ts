import { describe, expect, it } from 'vitest';
import { GuidedObservationTemporaryScope } from '../../src/presentation/guidedObservationTemporaryScope';

describe('guided observation temporary persistence scope', () => {
  it('suppresses a temporary write while preserving the exact stored string', () => { const scope = new GuidedObservationTemporaryScope(); const stored = '{"sentinel":"must-survive-byte-for-byte","appearance":"custom"}'; let value = stored; const persist = (next: string) => { if (!scope.isActive) value = next; }; scope.run(() => persist('{"preset":"orange"}')); expect(value).toBe(stored); persist('{"manual":"persisted"}'); expect(value).toBe('{"manual":"persisted"}'); });
  it('clears the guard after write and refresh failures', () => { const scope = new GuidedObservationTemporaryScope(); expect(() => scope.run(() => { throw new Error('write failure'); })).toThrow('write failure'); expect(scope.isActive).toBe(false); expect(() => scope.run(() => { throw new Error('refresh failure'); })).toThrow('refresh failure'); expect(scope.isActive).toBe(false); });
});
