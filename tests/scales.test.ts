import { describe, expect, it } from "vitest";
import { indexToX, niceStep, paddedPriceRange, priceToY, xToIndex, yToPrice, type ChartGeometry } from "../src/core/scales";
import { timeToIndex } from "../src/core/render";
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

describe("chart scales", () => {
  it("round-trips indexes", () => {
    expect(xToIndex(indexToX(64, geometry), geometry)).toBeCloseTo(64);
  });

  it("round-trips prices", () => {
    expect(yToPrice(priceToY(142.5, geometry), geometry)).toBeCloseTo(142.5);
  });

  it("chooses human-friendly grid steps", () => {
    expect(niceStep(0.34)).toBe(0.5);
    expect(niceStep(37)).toBe(50);
    expect(niceStep(0)).toBe(1);
  });

  it("pads meme-token prices relative to their magnitude", () => {
    const range = paddedPriceRange(0.000000872, 0.000000872);
    expect(range.min).toBeGreaterThan(0.0000008);
    expect(range.max).toBeLessThan(0.0000009);
    expect(range.max - range.min).toBeCloseTo(0.000000001744, 18);
  });

  it("maps drawing timestamps outside the loaded range without collapsing them", () => {
    const data: NormalizedOHLC[] = [
      { time: 1_000, open: 1, high: 2, low: 0, close: 1 },
      { time: 2_000, open: 1, high: 2, low: 0, close: 1 },
    ];
    expect(timeToIndex(500, data)).toBe(-0.5);
    expect(timeToIndex(3_500, data)).toBe(2.5);
  });
});
