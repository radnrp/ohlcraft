import { describe, expect, it } from "vitest";
import { renderChart, type RenderOptions } from "../src/core/render";
import { yToPrice } from "../src/core/scales";
import { resolveTheme } from "../src/core/theme";

type Rect = { x: number; y: number; width: number; height: number };

// Track canvas clipping state so drawing text outside the plot is not
// mistaken for a visible axis label (the original regression).
function recordingContext() {
  let clips: Rect[] = [];
  const stack: Rect[][] = [];
  let path: Rect | null = null;
  const text: { value: string; x: number; y: number; clips: Rect[] }[] = [];
  const fills: { rect: Rect; color: unknown; clips: Rect[] }[] = [];
  const methods: Record<string, unknown> = {
    save: () => stack.push([...clips]),
    restore: () => { clips = stack.pop() ?? []; },
    beginPath: () => { path = null; },
    rect: (x: number, y: number, width: number, height: number) => { path = { x, y, width, height }; },
    roundRect: (x: number, y: number, width: number, height: number) => { path = { x, y, width, height }; },
    clip: () => { if (path) clips.push(path); },
    fill: () => { if (path) fills.push({ rect: path, color: methods.fillStyle, clips: [...clips] }); },
    fillText: (value: string, x: number, y: number) => text.push({ value, x, y, clips: [...clips] }),
    measureText: (value: string) => ({ width: value.length * 6 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };
  const ctx = new Proxy(methods, {
    get: (target, key: string) => target[key] ?? (() => {}),
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, text, fills };
}

function options(overrides: Partial<RenderOptions> = {}): RenderOptions {
  return {
    width: 600, height: 400, priceScaleWidth: 90, timeScaleHeight: 32,
    data: [{ time: 1_700_000_000_000, open: 100, high: 120, low: 80, close: 100 }],
    chartType: "candles", theme: resolveTheme("dark"), barSpacing: 9, rightOffset: 5,
    showVolume: false, showWatermark: false, watermark: "", drawings: [],
    drawingsVisible: true, selectedDrawingId: null, draftDrawing: null, indicators: [],
    formatPrice: (price) => price.toFixed(3), formatTime: () => "cursor time",
    formatTimeline: () => "axis time", timeframe: "auto", timezone: "UTC", locale: "en-US",
    crosshair: { x: 465, y: 184 }, animationProgress: 1,
    priceScaleFactor: 1, priceScaleOffset: 0, compact: false,
    ...overrides,
  };
}

describe("crosshair axis labels", () => {
  it.each(["dark", "light"] as const)("draws the exact cursor price and time outside the plot clip in %s mode", (theme) => {
    const recording = recordingContext();
    const config = options({ theme: resolveTheme(theme) });
    const { geometry } = renderChart(recording.ctx, config);
    const price = recording.text[recording.text.length - 2]!;
    expect(price.value).toBe(config.formatPrice(yToPrice(config.crosshair!.y, geometry)));
    expect(price.x).toBeGreaterThan(geometry.plotWidth);
    expect(price.clips).toEqual([]);
    expect(recording.text[recording.text.length - 1]).toMatchObject({ value: "cursor time", clips: [] });
    // Cursor price wins when its label overlaps the last close price.
    const closeLabels = recording.text.filter((label) => label.value === "100.000" && label.x === geometry.plotWidth + 8);
    expect(closeLabels).toHaveLength(2);
    expect(closeLabels[1]).toBe(price);
  });

  it.each([0, 60, 368])("keeps the price badge visible at y=%s using the zoomed and panned scale", (y) => {
    const recording = recordingContext();
    const config = options({ crosshair: { x: 500, y }, priceScaleFactor: 0.4, priceScaleOffset: 0.8 });
    const { geometry } = renderChart(recording.ctx, config);
    const price = recording.text[recording.text.length - 2]!;
    expect(price.value).toBe(config.formatPrice(yToPrice(y, geometry)));
    const badge = recording.fills.find((fill) => fill.color === config.theme.crosshairStyle.labelBackground && fill.rect.x > geometry.plotWidth)!;
    expect(badge.clips).toEqual([]);
    expect(badge.rect.y).toBeGreaterThanOrEqual(0);
    expect(badge.rect.y + badge.rect.height).toBeLessThanOrEqual(geometry.plotHeight);
    expect(price.y).toBeGreaterThanOrEqual(badge.rect.y);
    expect(price.y).toBeLessThanOrEqual(badge.rect.y + badge.rect.height);
  });

  it.each([null, { x: 520, y: 100 }, { x: 100, y: 380 }])("hides cursor badges when the pointer is absent or outside the plot: %j", (crosshair) => {
    const recording = recordingContext();
    const config = options({ crosshair });
    renderChart(recording.ctx, config);
    expect(recording.text.some((label) => label.value === "cursor time")).toBe(false);
    expect(recording.fills.some((fill) => fill.color === config.theme.crosshairStyle.labelBackground)).toBe(false);
  });
});
