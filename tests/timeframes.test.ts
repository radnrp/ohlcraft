import { describe, expect, it } from "vitest";
import { aggregateOHLC, timeframeToMilliseconds } from "../src/core/timeframes";
import type { NormalizedOHLC } from "../src/types";

const minute = 60_000;
const data: NormalizedOHLC[] = [
  { time: 0, open: 10, high: 13, low: 9, close: 12, volume: 10 },
  { time: minute, open: 12, high: 14, low: 11, close: 13, volume: 20 },
  { time: 2 * minute, open: 13, high: 15, low: 8, close: 9, volume: 30 },
  { time: 5 * minute, open: 9, high: 11, low: 7, close: 10, volume: 40 },
];

describe("timeframe aggregation", () => {
  it("builds OHLCV buckets without losing market semantics", () => {
    expect(aggregateOHLC(data, "5m")).toEqual([
      { time: 0, open: 10, high: 15, low: 8, close: 9, volume: 60 },
      { time: 5 * minute, open: 9, high: 11, low: 7, close: 10, volume: 40 },
    ]);
  });

  it("keeps source candles in auto mode", () => {
    expect(aggregateOHLC(data, "auto")).toEqual(data);
    expect(aggregateOHLC(data, "auto")).not.toBe(data);
  });

  it("maps supported intervals to milliseconds", () => {
    expect(timeframeToMilliseconds("4h")).toBe(4 * 60 * minute);
    expect(timeframeToMilliseconds("1w")).toBe(7 * 24 * 60 * minute);
  });
});
