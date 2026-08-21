import { describe, expect, it } from "vitest";
import { resolveChartLayout } from "../src/core/layout";

describe("responsive chart layout", () => {
  it("uses container width to enter compact and micro layouts", () => {
    expect(resolveChartLayout({
      width: 344,
      height: 260,
      layout: "auto",
      formattedPrices: ["0.00000001000"],
      axisFontSize: 11,
    }).mode).toBe("compact");

    expect(resolveChartLayout({
      width: 280,
      height: 420,
      layout: "auto",
      formattedPrices: ["12.00"],
      axisFontSize: 11,
    }).mode).toBe("micro");
  });

  it("widens the automatic scale for long meme-token prices without starving the plot", () => {
    const metrics = resolveChartLayout({
      width: 344,
      height: 260,
      layout: "auto",
      formattedPrices: ["0.00000001000", "0.00000008720"],
      axisFontSize: 11,
    });

    expect(metrics.priceScaleWidth).toBeGreaterThan(76);
    expect(metrics.priceScaleWidth).toBeLessThanOrEqual(104);
    expect(344 - metrics.priceScaleWidth).toBeGreaterThanOrEqual(140);
    expect(metrics.timeScaleHeight).toBe(36);
  });

  it("honors forced full layout and explicit scale sizes", () => {
    expect(resolveChartLayout({
      width: 320,
      height: 240,
      layout: "full",
      formattedPrices: ["1.00"],
      axisFontSize: 11,
      priceScaleWidth: 82,
      timeScaleHeight: 40,
    })).toEqual({ mode: "full", priceScaleWidth: 82, timeScaleHeight: 40 });
  });
});
