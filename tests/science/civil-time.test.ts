import { describe, expect, it } from 'vitest';
import { AstronomyContractError } from '../../src/science/astronomy/errors';
import {
  createLocalCivilDaySchedule,
  resolveTimeZone,
} from '../../src/science/temporal/civilTime';
import { CivilTimeZoneStateStore } from '../../src/science/state/civilTimeZoneState';

const detroit = resolveTimeZone('America/Detroit', 'user-selected');

function date(year: number, month: number, day: number) {
  return Object.freeze({ year, month, day });
}

describe('IANA local civil-day schedule', () => {
  it('generates exactly the actual 24 local civil hour boundaries for an ordinary day', () => {
    const schedule = createLocalCivilDaySchedule(date(2025, 6, 21), detroit);
    expect(schedule.hourBoundaries).toHaveLength(24);
    expect(schedule.hourBoundaries[0]!.localLabel).toBe('2025-06-21 00:00');
    expect(schedule.hourBoundaries.at(-1)!.localLabel).toBe('2025-06-21 23:00');
    expect(schedule.end.unixMilliseconds - schedule.start.unixMilliseconds).toBe(24 * 60 * 60_000);
  });

  it('preserves the skipped civil hour on Detroit spring-forward day', () => {
    const schedule = createLocalCivilDaySchedule(date(2025, 3, 9), detroit);
    expect(schedule.hourBoundaries).toHaveLength(23);
    expect(schedule.hourBoundaries.map((hour) => hour.localLabel)).not.toContain('2025-03-09 02:00');
    expect(schedule.end.unixMilliseconds - schedule.start.unixMilliseconds).toBe(23 * 60 * 60_000);
  });

  it('preserves repeated local-hour instants and offsets on Detroit fall-back day', () => {
    const schedule = createLocalCivilDaySchedule(date(2025, 11, 2), detroit);
    const repeated = schedule.hourBoundaries.filter((hour) => hour.localLabel === '2025-11-02 01:00');
    expect(schedule.hourBoundaries).toHaveLength(25);
    expect(repeated).toHaveLength(2);
    expect(repeated.map((hour) => hour.fold)).toEqual([0, 1]);
    expect(repeated.map((hour) => hour.local.utcOffsetLabel)).toEqual(['GMT-04:00', 'GMT-05:00']);
    expect(repeated[0]!.instant.unixMilliseconds).toBeLessThan(repeated[1]!.instant.unixMilliseconds);
  });

  it('uses monotonic UTC instants and rejects unsupported IANA names', () => {
    const schedule = createLocalCivilDaySchedule(date(2025, 11, 2), detroit);
    for (let index = 1; index < schedule.hourBoundaries.length; index += 1) {
      expect(schedule.hourBoundaries[index - 1]!.instant.unixMilliseconds)
        .toBeLessThan(schedule.hourBoundaries[index]!.instant.unixMilliseconds);
    }
    expect(() => resolveTimeZone('Not/A_Real_Zone', 'user-selected')).toThrow(AstronomyContractError);
  });

  it('keeps an explicit immutable time-zone identity separate from observer longitude', () => {
    const state = new CivilTimeZoneStateStore();
    const ready = state.set('America/Detroit', 'user-selected');
    expect(ready.timeZone.ianaName).toBe('America/Detroit');
    expect(Object.isFrozen(ready.timeZone)).toBe(true);
    expect(() => { (ready.timeZone as { ianaName: string }).ianaName = 'UTC'; }).toThrow();
    expect(state.clear().kind).toBe('not-ready');
  });
});
