/**
 * Scheduling utilities. All dates are handled in UTC.
 * The default weekend follows the Israeli work week (Friday + Saturday).
 */

export const DEFAULT_WEEKEND = [5, 6];

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * @param {Date} date
 * @param {{ weekend?: number[], holidays?: string[] }} options holidays are 'YYYY-MM-DD' strings
 */
export function isWorkingDay(date, { weekend = DEFAULT_WEEKEND, holidays = [] } = {}) {
  if (weekend.includes(date.getUTCDay())) {
    return false;
  }
  return !holidays.includes(toDateKey(date));
}

/**
 * Moves `days` working days forward (or backward, if negative) from `start`.
 * The start day itself is never counted.
 */
export function addWorkingDays(start, days, options = {}) {
  if (!Number.isInteger(days)) {
    throw new TypeError('days must be an integer');
  }

  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  const current = new Date(start.getTime());

  while (remaining > 0) {
    current.setUTCDate(current.getUTCDate() + step);
    if (isWorkingDay(current, options)) {
      remaining--;
    }
  }

  return current;
}

/**
 * Counts working days between two dates, inclusive of both ends.
 */
export function countWorkingDays(start, end, options = {}) {
  if (end < start) {
    throw new RangeError('end must not be before start');
  }

  const current = startOfUtcDay(start);
  const last = startOfUtcDay(end);
  let count = 0;

  while (current <= last) {
    if (isWorkingDay(current, options)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * @param {{ start: Date, end: Date }} slot
 */
export function slotDurationMinutes(slot) {
  if (!(slot.end > slot.start)) {
    throw new RangeError('slot end must be after start');
  }
  return (slot.end - slot.start) / MS_PER_MINUTE;
}

/**
 * Two slots overlap if they share any time. Back-to-back slots do not overlap.
 */
export function slotsOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Returns every pair of conflicting slots as [indexA, indexB] (indexes into
 * the original array, lower index first), sorted by first index.
 */
export function findConflicts(slots) {
  const sorted = slots
    .map((slot, index) => ({ ...slot, index }))
    .sort((a, b) => a.start - b.start);

  const conflicts = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].start >= sorted[i].end) {
        break;
      }
      const pair = [sorted[i].index, sorted[j].index].sort((x, y) => x - y);
      conflicts.push(pair);
    }
  }

  return conflicts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/**
 * Formats a number of minutes as a compact human string, e.g. "1d 3h 5m".
 */
export function formatDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    throw new RangeError('totalMinutes must be a non-negative number');
  }

  const minutes = Math.round(totalMinutes);
  if (minutes === 0) {
    return '0m';
  }

  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;

  return [days && `${days}d`, hours && `${hours}h`, mins && `${mins}m`]
    .filter(Boolean)
    .join(' ');
}
