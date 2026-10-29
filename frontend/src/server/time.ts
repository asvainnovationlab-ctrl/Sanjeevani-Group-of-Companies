// Nepal time (Asia/Kathmandu, UTC+05:45, no daylight saving). Dates are
// stored in UTC; deadlines and reference numbers follow the Nepal calendar day.

const OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
export const TIME_ZONE = "Asia/Kathmandu";

// The Nepal calendar date (y, m, d) of an instant.
export function kathmanduDate(instant: Date): { year: number; month: number; day: number } {
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

// 23:59:59.999 Nepal time on the Nepal date of `instant`, as a UTC instant.
export function endOfKathmanduDay(instant: Date): Date {
  const { year, month, day } = kathmanduDate(instant);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - OFFSET_MS);
}

// "2026-11-30" (a date picked in the admin) → midnight Nepal time that day.
export function kathmanduDateToInstant(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) - OFFSET_MS);
}

export function formatKathmandu(instant: Date, withTime = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}),
  }).format(instant);
}
