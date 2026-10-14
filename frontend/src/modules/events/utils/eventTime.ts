/**
 * The next date (local time) that falls on `weekday` (0 = Sunday … 6 = Saturday) at `hour`:00, strictly after
 * `now`; today counts only when that time is still ahead. `weeksAhead` skips further weeks (1 = the one after).
 */
export function nextWeekday(weekday: number, hour: number, now = new Date(), weeksAhead = 0): Date {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  let diff = (weekday - date.getDay() + 7) % 7;
  if (diff === 0 && date.getTime() <= now.getTime()) diff = 7;
  date.setDate(date.getDate() + diff + weeksAhead * 7);
  return date;
}

/** A sensible default start: the next Saturday at 6 pm local. */
export function defaultEventStart(now = new Date()) {
  return nextWeekday(6, 18, now);
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Validation for the create form; returns a message per bad field. */
export function eventTimeErrors(start: Date | null, end: Date | null, now = new Date()) {
  const errors: { start?: string; end?: string } = {};
  if (!start) errors.start = 'Pick a start date and time.';
  else if (start.getTime() <= now.getTime()) errors.start = 'Start must be in the future.';
  if (!end) errors.end = 'Pick an end time.';
  else if (start && end.getTime() <= start.getTime()) errors.end = 'End must be after the start.';
  return errors;
}

/** Case-insensitive RSVP status comparison (stored lowercase). */
export function rsvpIs(status: string | null | undefined, expected: string) {
  return (status ?? '').toLowerCase() === expected.toLowerCase();
}
