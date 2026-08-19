import type { ChartLocale } from "../types";

export function createPriceFormatter(precision: number, locale?: ChartLocale): (value: number) => string {
  if (locale?.priceFormatter) return locale.priceFormatter;
  const formatter = new Intl.NumberFormat(locale?.locale ?? "en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return (value) => formatter.format(value);
}

export function createTimeFormatter(locale?: ChartLocale): (value: number) => string {
  if (locale?.timeFormatter) return locale.timeFormatter;
  const formatter = new Intl.DateTimeFormat(locale?.locale ?? "en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(locale?.timezone ? { timeZone: locale.timezone } : {}),
  });
  return (value) => formatter.format(value);
}

export function createTimelineFormatter(locale?: ChartLocale): (value: number, visibleDuration: number) => string {
  if (locale?.timeFormatter) return (value) => locale.timeFormatter!(value);
  const shared = locale?.timezone ? { timeZone: locale.timezone } : {};
  const intraday = new Intl.DateTimeFormat(locale?.locale ?? "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...shared,
  });
  const daily = new Intl.DateTimeFormat(locale?.locale ?? "en-US", {
    month: "short",
    day: "2-digit",
    ...shared,
  });
  const longRange = new Intl.DateTimeFormat(locale?.locale ?? "en-US", {
    month: "short",
    year: "2-digit",
    ...shared,
  });
  return (value, visibleDuration) => {
    if (visibleDuration <= 3 * 24 * 60 * 60 * 1000) return intraday.format(value);
    if (visibleDuration <= 180 * 24 * 60 * 60 * 1000) return daily.format(value);
    return longRange.format(value);
  };
}

export function compactNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
