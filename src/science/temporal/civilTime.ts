import { AstronomyContractError } from '../astronomy/errors';
import { createSimulationInstant } from '../astronomy/time';
import type { SimulationInstant } from '../astronomy/types';

export const CIVIL_TIME_RESOLVER_VERSION = 'INTL_IANA_CIVIL_MINUTE_V1' as const;

export interface LocalCivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface ResolvedTimeZone {
  readonly kind: 'RESOLVED_IANA_TIME_ZONE';
  readonly ianaName: string;
  readonly source: 'browser-intl' | 'user-selected';
  readonly resolverVersion: typeof CIVIL_TIME_RESOLVER_VERSION;
  readonly tzdbVersion: 'unknown';
}

export interface LocalCivilFields extends LocalCivilDate {
  readonly hour: number;
  readonly minute: number;
  readonly utcOffsetMinutes: number;
  readonly utcOffsetLabel: string;
}

export interface CivilHourBoundary {
  readonly instant: SimulationInstant;
  readonly local: LocalCivilFields;
  readonly localLabel: string;
  readonly fold: 0 | 1;
  readonly gapAdjusted: false;
}

export interface LocalCivilDaySchedule {
  readonly kind: 'LOCAL_CIVIL_DAY_SCHEDULE';
  readonly date: LocalCivilDate;
  readonly timeZone: ResolvedTimeZone;
  readonly start: SimulationInstant;
  readonly end: SimulationInstant;
  readonly hourBoundaries: readonly CivilHourBoundary[];
}

const MINUTE_MS = 60_000;
const SCAN_BEFORE_NOMINAL_MIDNIGHT_MS = 18 * 60 * MINUTE_MS;
const SCAN_AFTER_NOMINAL_MIDNIGHT_MS = 42 * 60 * MINUTE_MS;

function reject(code: 'INVALID_TIME_ZONE' | 'CIVIL_TIME_RESOLUTION_FAILURE', message: string): never {
  throw new AstronomyContractError(code, message);
}

function isValidInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function partsByType(parts: readonly Intl.DateTimeFormatPart[]): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(parts
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value])));
}

function parseOffsetMinutes(value: string | undefined): number {
  if (value === 'GMT' || value === 'UTC') return 0;
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(value ?? '');
  if (!match) return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Intl did not provide a parseable UTC offset.');
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '+' ? minutes : -minutes;
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-CA-u-ca-iso8601', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    });
  } catch {
    return reject('INVALID_TIME_ZONE', `Unsupported IANA time zone: ${timeZone}`);
  }
}

function localFieldsAt(
  unixMilliseconds: number,
  activeFormatter: Intl.DateTimeFormat,
): LocalCivilFields {
  const parts = partsByType(activeFormatter.formatToParts(new Date(unixMilliseconds)));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  if (![year, month, day, hour, minute].every(Number.isSafeInteger)) {
    return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Intl returned incomplete local civil fields.');
  }
  return Object.freeze({
    year,
    month,
    day,
    hour,
    minute,
    utcOffsetMinutes: parseOffsetMinutes(parts.timeZoneName),
    utcOffsetLabel: parts.timeZoneName ?? 'GMT',
  });
}

function sameDate(left: LocalCivilDate, right: LocalCivilDate): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

function nextDate(date: LocalCivilDate): LocalCivilDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  return Object.freeze({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

function validateDate(date: LocalCivilDate): LocalCivilDate {
  if (!isValidInteger(date.year) || !isValidInteger(date.month) || !isValidInteger(date.day)) {
    return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Local civil date requires safe integer fields.');
  }
  const canonical = new Date(Date.UTC(date.year, date.month - 1, date.day));
  if (
    canonical.getUTCFullYear() !== date.year ||
    canonical.getUTCMonth() + 1 !== date.month ||
    canonical.getUTCDate() !== date.day
  ) {
    return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Local civil date is not a valid ISO calendar date.');
  }
  return Object.freeze({ year: date.year, month: date.month, day: date.day });
}

function findStartOfDate(
  date: LocalCivilDate,
  activeFormatter: Intl.DateTimeFormat,
): number {
  const nominalMidnight = Date.UTC(date.year, date.month - 1, date.day);
  const lower = nominalMidnight - SCAN_BEFORE_NOMINAL_MIDNIGHT_MS;
  const upper = nominalMidnight + SCAN_AFTER_NOMINAL_MIDNIGHT_MS;
  for (let unixMilliseconds = lower; unixMilliseconds <= upper; unixMilliseconds += MINUTE_MS) {
    const local = localFieldsAt(unixMilliseconds, activeFormatter);
    if (sameDate(local, date) && local.hour === 0 && local.minute === 0) {
      return unixMilliseconds;
    }
  }
  return reject(
    'CIVIL_TIME_RESOLUTION_FAILURE',
    `Unable to resolve the first valid local midnight for ${formatDate(date)}.`,
  );
}

export function formatDate(date: LocalCivilDate): string {
  return `${String(date.year).padStart(4, '0')}-${pad(date.month)}-${pad(date.day)}`;
}

export function resolveTimeZone(
  ianaName: string,
  source: ResolvedTimeZone['source'],
): ResolvedTimeZone {
  if (typeof ianaName !== 'string' || ianaName.trim().length === 0) {
    return reject('INVALID_TIME_ZONE', 'An explicit IANA time-zone identifier is required.');
  }
  const activeFormatter = formatter(ianaName.trim());
  const canonical = activeFormatter.resolvedOptions().timeZone;
  if (!canonical) return reject('INVALID_TIME_ZONE', 'Intl did not resolve an IANA time-zone identifier.');
  return Object.freeze({
    kind: 'RESOLVED_IANA_TIME_ZONE',
    ianaName: canonical,
    source,
    resolverVersion: CIVIL_TIME_RESOLVER_VERSION,
    tzdbVersion: 'unknown',
  });
}

export function browserResolvedTimeZone(): ResolvedTimeZone {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolveTimeZone(timeZone, 'browser-intl');
}

export function localCivilDateAt(
  instant: SimulationInstant,
  timeZone: ResolvedTimeZone,
): LocalCivilDate {
  const local = localFieldsAt(instant.unixMilliseconds, formatter(timeZone.ianaName));
  return Object.freeze({ year: local.year, month: local.month, day: local.day });
}

/**
 * Resolves a local calendar day through the browser's IANA-zone implementation.
 * UTC remains authoritative for astronomy. Scanning valid UTC minute boundaries
 * preserves skipped and repeated civil hours without maintaining a private DST table.
 */
export function createLocalCivilDaySchedule(
  requestedDate: LocalCivilDate,
  timeZone: ResolvedTimeZone,
): LocalCivilDaySchedule {
  const date = validateDate(requestedDate);
  const activeFormatter = formatter(timeZone.ianaName);
  const startMilliseconds = findStartOfDate(date, activeFormatter);
  const endMilliseconds = findStartOfDate(nextDate(date), activeFormatter);
  if (endMilliseconds <= startMilliseconds) {
    return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Local civil-day end must follow its start.');
  }
  const occurrences = new Map<string, number>();
  const hourBoundaries: CivilHourBoundary[] = [];
  for (let unixMilliseconds = startMilliseconds; unixMilliseconds < endMilliseconds; unixMilliseconds += MINUTE_MS) {
    const local = localFieldsAt(unixMilliseconds, activeFormatter);
    if (!sameDate(local, date) || local.minute !== 0) continue;
    const localLabel = `${formatDate(local)} ${pad(local.hour)}:00`;
    const count = occurrences.get(localLabel) ?? 0;
    occurrences.set(localLabel, count + 1);
    hourBoundaries.push(Object.freeze({
      instant: createSimulationInstant(new Date(unixMilliseconds).toISOString(), 'frozen-test'),
      local,
      localLabel,
      fold: count === 0 ? 0 : 1,
      gapAdjusted: false,
    }));
  }
  if (hourBoundaries.length === 0) {
    return reject('CIVIL_TIME_RESOLUTION_FAILURE', 'Local civil day has no valid hour boundaries.');
  }
  return Object.freeze({
    kind: 'LOCAL_CIVIL_DAY_SCHEDULE',
    date,
    timeZone,
    start: createSimulationInstant(new Date(startMilliseconds).toISOString(), 'frozen-test'),
    end: createSimulationInstant(new Date(endMilliseconds).toISOString(), 'frozen-test'),
    hourBoundaries: Object.freeze(hourBoundaries),
  });
}
