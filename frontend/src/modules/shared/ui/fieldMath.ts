// Pure helpers behind NumberStepper and DateTimeField. No imports, so `frontend/test/*.mjs` can load this file.

/** `value` limited to `[min, max]`; a non-finite value becomes `min`. */
export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** The stepper's next value after moving `direction` (-1 or 1) by `step`, kept within bounds. */
export function stepValue(value: number, direction: -1 | 1, min: number, max: number, step = 1) {
  return clampNumber(clampNumber(value, min, max) + direction * step, min, max);
}

export function canStep(value: number, direction: -1 | 1, min: number, max: number) {
  return direction < 0 ? value > min : value < max;
}

const MINUTES_PER_DAY = 1440;

/** Local midnight of `date`. */
export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
  );
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Whole calendar days from `from` to `to` (local time, DST-safe). */
export function dayDifference(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** `day`'s calendar date with the time of day from `time`. */
export function withDay(day: Date, time: Date) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
  );
}

/** Moves the time of day by `minutes`, wrapping within the same calendar day. */
export function shiftTimeOfDay(date: Date, minutes: number) {
  const total =
    (((date.getHours() * 60 + date.getMinutes() + minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(total / 60),
    total % 60,
  );
}

/**
 * Weeks of the month containing `month` for a calendar grid starting on Sunday. Days outside the month are
 * `null`, so every row has exactly seven cells.
 */
export function monthGrid(month: Date): (Date | null)[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Value for `<input type="date">` (`YYYY-MM-DD`) or `datetime-local` (`YYYY-MM-DDTHH:mm`), in local time. */
export function toInputValue(date: Date | null, mode: 'date' | 'datetime') {
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === 'date' ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses an `<input>` date or datetime-local value as local time; null when empty or malformed. */
export function fromInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh ?? 0), Number(mm ?? 0));
  return Number.isNaN(date.getTime()) ? null : date;
}
