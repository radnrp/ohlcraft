import type { ChartTimeframe, NormalizedOHLC } from "../types";

const timeframeMilliseconds: Record<Exclude<ChartTimeframe, "auto">, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000,
};

export const defaultTimeframes: readonly ChartTimeframe[] = [
  "auto",
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
];

export function timeframeToMilliseconds(timeframe: Exclude<ChartTimeframe, "auto">): number {
  return timeframeMilliseconds[timeframe];
}

export function aggregateOHLC(
  data: readonly NormalizedOHLC[],
  timeframe: ChartTimeframe,
): NormalizedOHLC[] {
  if (timeframe === "auto" || data.length < 2) return [...data];
  const duration = timeframeToMilliseconds(timeframe);
  const result: NormalizedOHLC[] = [];
  let currentBucket = Number.NaN;
  for (const candle of data) {
    const bucket = Math.floor(candle.time / duration) * duration;
    const current = result[result.length - 1];
    if (!current || bucket !== currentBucket) {
      result.push({
        time: bucket,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        ...(candle.volume === undefined ? {} : { volume: candle.volume }),
      });
      currentBucket = bucket;
      continue;
    }
    current.high = Math.max(current.high, candle.high);
    current.low = Math.min(current.low, candle.low);
    current.close = candle.close;
    if (candle.volume !== undefined) current.volume = (current.volume ?? 0) + candle.volume;
  }
  return result;
}

export function timeframeLabel(timeframe: ChartTimeframe): string {
  if (timeframe === "auto") return "AUTO";
  return timeframe.replace("h", "H").replace("d", "D").replace("w", "W");
}
