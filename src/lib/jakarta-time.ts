const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns the UTC instants for the start and end of "today" as a calendar
 * day in Asia/Jakarta (fixed UTC+7, no DST), regardless of the server's
 * own timezone. Use this for any "is this today" date-range query instead
 * of `new Date().setHours(0,0,0,0)`, which uses the host's local timezone.
 */
export function jakartaDayBoundsUtc(reference: Date = new Date()) {
  const jakartaWallClock = new Date(reference.getTime() + JAKARTA_OFFSET_MS);
  const year = jakartaWallClock.getUTCFullYear();
  const month = jakartaWallClock.getUTCMonth();
  const day = jakartaWallClock.getUTCDate();

  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - JAKARTA_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - JAKARTA_OFFSET_MS);
  return { start, end };
}

export function isSameJakartaDay(a: Date, b: Date = new Date()) {
  const { start, end } = jakartaDayBoundsUtc(b);
  return a >= start && a <= end;
}

/** Monday-to-Sunday bounds for the Asia/Jakarta week containing `reference`. */
export function jakartaWeekBoundsUtc(reference: Date = new Date()) {
  const jakartaWallClock = new Date(reference.getTime() + JAKARTA_OFFSET_MS);
  const weekday = jakartaWallClock.getUTCDay(); // 0=Sunday..6=Saturday
  const daysSinceMonday = (weekday + 6) % 7;
  const { start: todayStart } = jakartaDayBoundsUtc(reference);
  const start = new Date(todayStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/** Calendar-month bounds for the Asia/Jakarta month containing `reference`. */
export function jakartaMonthBoundsUtc(reference: Date = new Date()) {
  const jakartaWallClock = new Date(reference.getTime() + JAKARTA_OFFSET_MS);
  const year = jakartaWallClock.getUTCFullYear();
  const month = jakartaWallClock.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - JAKARTA_OFFSET_MS);
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999) - JAKARTA_OFFSET_MS);
  return { start, end };
}
