import { describe, expect, it } from "vitest";
import { bollinger, ema, sma } from "../src/core/indicators";

describe("indicators", () => {
  it("computes SMA with a warm-up window", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("seeds EMA with an SMA", () => {
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("computes Bollinger bands", () => {
    const result = bollinger([1, 2, 3], 3, 2);
    expect(result.middle[2]).toBe(2);
    expect(result.upper[2]).toBeCloseTo(3.632993, 5);
    expect(result.lower[2]).toBeCloseTo(0.367006, 5);
  });

  it("validates periods", () => {
    expect(() => sma([1], 0)).toThrow();
    expect(() => ema([1], 1.5)).toThrow();
  });
});
