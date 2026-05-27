/**
 * Pure date helpers — no side-effects, fully unit-testable.
 * The real API uses "M/D/YYYY" format (e.g. "9/12/2027").
 */

/** Parse an API date string ("M/D/YYYY") into a JS Date (local time). */
export function parseApiDate(value: string): Date | null {
  const parts = value.split('/').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [month, day, year] = parts;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

/** Format a JS Date into the API-expected "M/D/YYYY" string. */
export function formatApiDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/** Format an API date string for display, e.g. "12 Sep 2027". */
export function formatDisplayDate(value: string): string {
  const d = parseApiDate(value);
  if (!d) return value;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Returns true if the given Date is strictly after today (ignoring time). */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(date);
  cmp.setHours(0, 0, 0, 0);
  return cmp.getTime() > today.getTime();
}

/** Convert an API date string to a numeric timestamp for sort comparisons. */
export function asTimestamp(value: string): number {
  return parseApiDate(value)?.getTime() ?? 0;
}
