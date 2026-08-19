import type { NormalizedOHLC, OHLCData } from "../types";

export function toTimestamp(value: OHLCData["time"]): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid chart time: ${value}`);
    return parsed;
  }
  // Values below 10^11 are conventionally unix seconds.
  return value < 100_000_000_000 ? value * 1_000 : value;
}

export function normalizeData(data: readonly OHLCData[]): NormalizedOHLC[] {
  const normalized = data.map((item) => ({ ...item, time: toTimestamp(item.time) }));
  normalized.sort((a, b) => a.time - b.time);
  for (const candle of normalized) {
    if (![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) {
      throw new Error("OHLC values must be finite numbers.");
    }
    if (candle.low > Math.min(candle.open, candle.close) || candle.high < Math.max(candle.open, candle.close)) {
      throw new Error(`Invalid OHLC range at ${new Date(candle.time).toISOString()}.`);
    }
  }
  return normalized;
}

export function toHeikinAshi(data: readonly NormalizedOHLC[]): NormalizedOHLC[] {
  if (data.length === 0) return [];
  const result: NormalizedOHLC[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const candle = data[index]!;
    const close = (candle.open + candle.high + candle.low + candle.close) / 4;
    const previous = result[index - 1];
    const open = previous ? (previous.open + previous.close) / 2 : (candle.open + candle.close) / 2;
    result.push({
      time: candle.time,
      open,
      close,
      high: Math.max(candle.high, open, close),
      low: Math.min(candle.low, open, close),
      ...(candle.volume === undefined ? {} : { volume: candle.volume }),
    });
  }
  return result;
}

export function inferPrecision(data: readonly NormalizedOHLC[]): number {
  if (data.length === 0) return 2;
  let observedPrecision = 0;
  for (const candle of data.slice(-100)) {
    const text = candle.close.toFixed(8).replace(/0+$/, "");
    observedPrecision = Math.max(observedPrecision, text.split(".")[1]?.length ?? 0);
  }
  const magnitude = Math.abs(data[data.length - 1]!.close);
  if (magnitude >= 100) return 2;
  if (magnitude >= 1) return Math.min(4, Math.max(2, observedPrecision));
  if (magnitude >= 0.01) return Math.min(6, Math.max(4, observedPrecision));
  return 8;
}
