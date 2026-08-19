import { describe, expect, it } from "vitest";
import { inferPrecision, normalizeData, toHeikinAshi, toTimestamp } from "../src/core/data";

describe("market data", () => {
  it("normalizes seconds, dates and ordering", () => {
    const data = normalizeData([
      { time: "2026-01-02T00:00:00Z", open: 2, high: 4, low: 1, close: 3 },
      { time: 1_767_225_600, open: 1, high: 3, low: 0, close: 2 },
    ]);
    expect(data[0]!.time).toBe(1_767_225_600_000);
    expect(data[1]!.time).toBe(Date.parse("2026-01-02T00:00:00Z"));
    expect(toTimestamp(new Date("2026-01-03T00:00:00Z"))).toBe(Date.parse("2026-01-03T00:00:00Z"));
  });

  it("creates valid Heikin-Ashi candles", () => {
    const input = normalizeData([
      { time: 1, open: 100, high: 112, low: 94, close: 108, volume: 10 },
      { time: 2, open: 108, high: 116, low: 102, close: 110, volume: 12 },
    ]);
    const output = toHeikinAshi(input);
    expect(output).toHaveLength(2);
    expect(output[0]).toMatchObject({ open: 104, close: 103.5, high: 112, low: 94, volume: 10 });
    expect(output[1]!.high).toBeGreaterThanOrEqual(Math.max(output[1]!.open, output[1]!.close));
  });

  it("rejects malformed OHLC ranges", () => {
    expect(() => normalizeData([{ time: 1, open: 10, high: 9, low: 8, close: 11 }])).toThrow("Invalid OHLC range");
  });

  it("keeps useful price detail without exposing floating-point noise", () => {
    expect(inferPrecision(normalizeData([{ time: 1, open: 68_000, high: 68_002, low: 67_999, close: 68_001.123456 }]))).toBe(2);
    expect(inferPrecision(normalizeData([{ time: 1, open: 1, high: 2, low: 0.5, close: 1.2345 }]))).toBe(4);
  });
});
