/** YYYY-MM-DD for "today" — used as the default date for attendance registers. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
