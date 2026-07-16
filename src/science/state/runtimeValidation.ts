/** Shared runtime contract for revision counters that participate in scientific identity. */
export function isValidScientificRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
