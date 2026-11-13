import { SITE } from "./site";

const money = new Intl.NumberFormat(SITE.locale, {
  style: "currency",
  currency: SITE.currency,
  maximumFractionDigits: 0,
});

/** Format an amount held in minor units (cents). */
export function formatPrice(minor: number) {
  return money.format(minor / 100);
}

const number = new Intl.NumberFormat(SITE.locale, { maximumFractionDigits: 1 });

export function formatNumber(value: number) {
  return number.format(value);
}

/**
 * Appointment dates and times are wall-clock values at the atelier
 * ("2026-11-20", "10:30"), so they are formatted in UTC to avoid the
 * visitor's time zone shifting them.
 */
export function dateFromISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

const longDate = new Intl.DateTimeFormat(SITE.locale, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatLongDate(iso: string) {
  return longDate.format(dateFromISO(iso));
}

const monthYear = new Intl.DateTimeFormat(SITE.locale, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonth(date: Date) {
  return monthYear.format(date);
}

const clock = new Intl.DateTimeFormat(SITE.locale, {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "10:30" → "10:30 AM" in the site locale. */
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return clock.format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

const weekdayShort = new Intl.DateTimeFormat(SITE.locale, { weekday: "short", timeZone: "UTC" });
const weekdayLong = new Intl.DateTimeFormat(SITE.locale, { weekday: "long", timeZone: "UTC" });

/** Weekday names starting on Monday. */
export function weekdayNames() {
  // 2024-01-01 was a Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i));
    return { short: weekdayShort.format(d), long: weekdayLong.format(d) };
  });
}
