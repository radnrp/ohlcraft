import { describe, expect, it } from "vitest";
import {
  anchoredPriceOffset,
  clampPriceOffset,
  clampToPlot,
  distanceToRay,
  panOffset,
  rayEndpoint,
  snapPriceToCandle,
  timestampAtIndex,
  verticallyPannedPriceOffset,
} from "../src/core/interactions";
import type { ChartGeometry } from "../src/core/scales";
import type { NormalizedOHLC } from "../src/types";

const geometry: ChartGeometry = {
  plotWidth: 800,
  plotHeight: 400,
  barSpacing: 10,
  rightOffset: 5,
  dataLength: 100,
  minPrice: 100,
  maxPrice: 200,
};

const candle: NormalizedOHLC = { time: 1, open: 140, high: 160, low: 130, close: 150 };

describe("drawing interactions", () => {
  it("clamps captured pointers to the plot", () => {
    expect(clampToPlot({ x: -20, y: 460 }, geometry)).toEqual({ x: 0, y: 400 });
  });

  it("snaps only when an OHLC value is visually close", () => {
    expect(snapPriceToCandle(151, candle, geometry, 12)).toBe(150);
    expect(snapPriceToCandle(180, candle, geometry, 12)).toBe(180);
  });

  it("hit-tests the forward part of a ray but not its back projection", () => {
    expect(distanceToRay({ x: 90, y: 90 }, { x: 10, y: 10 }, { x: 20, y: 20 })).toBeCloseTo(0);
    expect(distanceToRay({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 })).toBeGreaterThan(10);
  });

  it("keeps drawing time continuous between candles and into future space", () => {
    const data: NormalizedOHLC[] = [
      { time: 1_000, open: 1, high: 2, low: 0, close: 1 },
      { time: 2_000, open: 1, high: 2, low: 0, close: 1 },
    ];
    expect(timestampAtIndex(0.5, data)).toBe(1_500);
    expect(timestampAtIndex(2.5, data)).toBe(3_500);
    expect(timestampAtIndex(-0.5, data)).toBe(500);
  });

  it("moves content with the pointer and extends vertical rays to plot bounds", () => {
    expect(panOffset(5, 30, 10)).toBe(2);
    expect(rayEndpoint({ x: 50, y: 50 }, { x: 50, y: 60 }, 100, 120)).toEqual({ x: 50, y: 120 });
    expect(rayEndpoint({ x: 50, y: 50 }, { x: 40, y: 50 }, 100, 120)).toEqual({ x: 0, y: 50 });
  });

  it("keeps price zoom anchored and supports vertical price panning", () => {
    expect(anchoredPriceOffset(0, 1, 0.5, 0, 400)).toBe(0.25);
    expect(anchoredPriceOffset(0, 1, 0.5, 200, 400)).toBe(0);
    expect(verticallyPannedPriceOffset(0, 100, 400, 0.5)).toBe(0.125);
    expect(clampPriceOffset(99, 0.5)).toBeCloseTo(0.73);
    expect(clampPriceOffset(-99, 0.5)).toBeCloseTo(-0.73);
  });
});
