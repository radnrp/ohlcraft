# OHLCraft

> Craft financial charts your way.

[Live demo & theme studio](https://radnrp.github.io/ohlcraft/) · [GitHub](https://github.com/radnrp/ohlcraft)

OHLCraft is a release-ready, canvas-based financial chart for React and Next.js. It is small, responsive, fully typed, SSR-safe, and has no runtime dependency beyond React.

## Features

- Candles, hollow candles, Heikin-Ashi, OHLC bars, line, area, and baseline charts
- Real OHLCV aggregation for Auto, 1m, 5m, 15m, 30m, 1H, 4H, 1D, and 1W timeframes
- Hardware-friendly Canvas rendering with capped device-pixel ratio
- Wheel/pinch zoom anchored under the pointer, one-finger pan, fit-content, and realtime navigation
- Crosshair, proximity-based magnetic OHLC snapping, responsive price/time scales, and volume
- Trend line, directional arrow, infinite ray, horizontal/vertical line, rectangle, Fibonacci, range measurement, and long/short position tools
- Draggable/wheel-zoomable price scale with detailed ticks and double-click auto reset
- SMA, EMA, and Bollinger overlays
- A distinctive floating creative dock, custom SVG icons, animated chart reveals, and dark/light themes
- Controlled or uncontrolled drawings, imperative ref API, image export, and typed events
- React 18/19 and Next.js App Router support

## Install

```bash
npm install ohlcraft
```

## React

```tsx
import { TradingChart, type OHLCData } from "ohlcraft";
import "ohlcraft/styles.css";

const data: OHLCData[] = [
  { time: "2026-08-16T10:00:00Z", open: 64120, high: 64800, low: 63950, close: 64620, volume: 1240 },
  { time: "2026-08-16T11:00:00Z", open: 64620, high: 65140, low: 64410, close: 64980, volume: 1560 },
];

export function MarketChart() {
  return (
    <TradingChart
      data={data}
      height={600}
      theme="dark"
      defaultTimeframe="1h"
      showVolume
      watermark="BTCUSD · 1H"
      indicators={[
        { type: "ema", period: 21, color: "#f59e0b" },
        { type: "bollinger", period: 20, deviation: 2, color: "#8295ff" },
      ]}
    />
  );
}
```

## Next.js App Router

The package output contains a `use client` boundary. Import its stylesheet from `app/layout.tsx` and use the component normally from a Client Component.

```tsx
// app/layout.tsx
import "ohlcraft/styles.css";

// components/market-chart.tsx
"use client";

import { TradingChart } from "ohlcraft";

export default function MarketChart({ candles }) {
  return <TradingChart data={candles} height="70vh" />;
}
```

If your data source or wrapper cannot render on the server, use a dynamic import:

```tsx
import dynamic from "next/dynamic";

const TradingChart = dynamic(
  () => import("ohlcraft").then((module) => module.TradingChart),
  { ssr: false },
);
```

## Controlled drawings

```tsx
const [drawings, setDrawings] = useState<ChartDrawing[]>([]);

<TradingChart
  data={data}
  drawings={drawings}
  onDrawingsChange={setDrawings}
  activeTool="crosshair"
/>
```

Drawings store timestamp/price coordinates instead of pixels, so they remain correct after resize, zoom, and pan. Persist the `drawings` array as JSON to restore a workspace.

### In-chart drawing settings

Click any drawing while the cursor or crosshair tool is active to open its floating settings toolbar inside the chart. Color, thickness, solid/dashed/dotted style, visibility, lock state, and deletion are applied immediately and persisted on the drawing object.

```tsx
<TradingChart
  data={data}
  defaultDrawingStyle={{ color: "#38bdf8", lineWidth: 2, lineStyle: "dashed" }}
  drawingSettingsColors={["#38bdf8", "#22c55e", "#f59e0b", "#f43f5e", "#ffffff"]}
  showDrawingSettings
/>
```

Each `ChartDrawing` accepts `color`, `lineWidth`, `lineStyle` (`solid`, `dashed`, or `dotted`), and `visible`. The top-right drawing toolbar provides undo, redo, hide/show all, restore individually hidden objects, and undoable clear-all actions. Keyboard shortcuts are `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, and `Ctrl/Cmd+Y`. Set `showDrawingSettings={false}` or `showDrawingHistoryControls={false}` when providing custom editing UI.

## Imperative API

```tsx
const chart = useRef<TradingChartHandle>(null);

chart.current?.fitContent();
chart.current?.scrollToRealtime();
chart.current?.setVisibleRange({ from: startTimestamp, to: endTimestamp });
chart.current?.undo();
chart.current?.redo();
chart.current?.clearDrawings();
chart.current?.setDrawingsVisible(false);
const png = chart.current?.exportImage();
```

## Main props

| Prop | Type | Default |
| --- | --- | --- |
| `data` | `readonly OHLCData[]` | required |
| `chartType` | `ChartType` | `candles` |
| `timeframe` / `defaultTimeframe` | `ChartTimeframe` | `auto` |
| `timeframes` | `readonly ChartTimeframe[]` | all built-ins |
| `height` / `width` | `number \| string` | `560` / `100%` |
| `theme` | `dark \| light \| DeepPartial<ChartTheme>` | `dark` |
| `indicators` | `IndicatorDefinition[]` | `[]` |
| `drawings` / `defaultDrawings` | `ChartDrawing[]` | `[]` |
| `defaultDrawingStyle` | `Partial<ChartDrawingStyle>` | `{}` |
| `showDrawingSettings` | `boolean` | `true` |
| `drawingSettingsColors` | `readonly string[]` | built-in palette |
| `drawingsVisible` / `defaultDrawingsVisible` | `boolean` | `true` |
| `showDrawingHistoryControls` | `boolean` | `true` |
| `activeTool` / `defaultTool` | `DrawingTool` | `crosshair` |
| `showToolbar` / `showLegend` / `showVolume` | `boolean` | `true` |
| `layout` | `auto \| compact \| full` | `auto` |
| `minBarSpacing` / `maxBarSpacing` | `number` | `2` / `48` |
| `magnet` | `boolean` | `true` |
| `animate` / `animationDuration` | `boolean` / `number` | `true` / `520` |

All callback, theme, locale, event, and ref types are exported from the package entry point.

Two-point tools support both press-drag-release and click-first-point/click-second-point workflows. Press `Escape` to cancel a draft, and select an existing drawing to move it or edit an anchor.

Timeframe aggregation expects the finest available source candles. For example, pass 1-minute candles to generate every built-in interval accurately. Selecting a timeframe finer than the source data cannot manufacture missing market detail.

## Small screens and meme-token prices

The default `layout="auto"` is driven by the chart container width, not the browser viewport. Narrow cards therefore get larger touch targets, a horizontally scrollable tool dock, a compact two-row OHLCV legend, fewer axis ticks, and smaller time-scale chrome. Pinch with two fingers to zoom around the gesture midpoint and drag with one finger to pan.

The price scale also measures the formatted price length. Values such as `0.00000008720` receive enough room without taking an excessive share of a small chart. You can still force `layout="compact"` or `layout="full"`, or override `priceScaleWidth` and `timeScaleHeight` explicitly.

```tsx
<div className="min-w-0 h-[clamp(280px,70vw,420px)]">
  <TradingChart
    data={candles}
    height="100%"
    layout="auto"
    defaultTimeframe="1m"
    initialBarSpacing={7}
    showVolume
    watermark={`${symbol} · 1M`}
  />
</div>
```

For a detailed meme-coin chart, pass real OHLCV candles at the finest interval you need. A single current-price point can only render one bar; neither responsive layout nor timeframe aggregation can reconstruct missing high, low, volume, or intrabar history.

Drag vertically or use the mouse wheel over the right price scale to inspect a tighter/wider price range. Double-click that scale or call `ref.current?.resetPriceScale()` to return to automatic scaling. Long/short drawings expose separate editable Entry, Target, and Stop anchors with exact prices, percentages, and risk/reward ratio.

Price zoom is anchored under the pointer, so the inspected level stays in place. Once the price scale is in manual mode, drag inside an empty part of the plot vertically to move the visible price window up or down; the same drag can pan time horizontally. The `MANUAL` marker on the right indicates this state, and Fit Content or a price-scale double-click resets both zoom and vertical offset.

The bottom time scale is interactive as well: drag it horizontally to change candle density, use the wheel to zoom around the pointer, and double-click to fit all content. Its labels adapt between intraday time, calendar dates, and month/year based on the visible duration. Drawing timestamps use continuous interpolation, so moving an object is smooth and drawings can extend into future chart space.

## Custom theme and Persian locale

```tsx
<TradingChart
  data={data}
  theme={{ background: "#07111f", accent: "#9b87f5", bullish: "#14b8a6" }}
  locale={{
    locale: "fa-IR",
    timezone: "Asia/Tehran",
    labels: { reset: "نمایش همه", fullscreen: "تمام‌صفحه" },
  }}
/>
```

### Advanced visual customization

Every visual group can be overridden independently. Nested theme objects are deep-merged with the dark preset, so you only need to provide the values you want to change.

```tsx
<TradingChart
  data={data}
  theme={{
    backgroundStyle: {
      type: "gradient",       // "solid" | "gradient" | "image"
      color: "#050816",
      colorTo: "#172554",
      angle: 145,
      texture: "dots",       // "none" | "dots" | "grid" | "diagonal" | "noise"
      textureColor: "#93c5fd",
      textureOpacity: 0.08,
      textureSize: 20,
    },
    candlestick: {
      bullishBody: "#22c55e",
      bearishBody: "#f43f5e",
      bullishWick: "#86efac",
      bearishWick: "#fda4af",
      bullishBorder: "#bbf7d0",
      bearishBorder: "#fecdd3",
      bodyWidth: 0.78,         // fraction of bar spacing
      bodyRadius: 2,
      wickWidth: 1.5,
      borderWidth: 1,
    },
    gridStyle: {
      horizontal: { color: "#293452", width: 1, dash: [3, 6] },
      vertical: { visible: false },
      axis: { color: "#405071", width: 1 },
    },
    series: {
      lineColor: "#a78bfa",
      lineWidth: 3,
      lineDash: [],
      areaTopColor: "rgba(167, 139, 250, .4)",
      areaBottomColor: "rgba(167, 139, 250, 0)",
    },
    crosshairStyle: { color: "#c4b5fd", width: 1, dash: [5, 4], labelRadius: 4 },
    volume: { bullish: "rgba(34, 197, 94, .28)", bearish: "rgba(244, 63, 94, .28)", heightRatio: 0.2 },
    axis: { fontSize: 12, fontWeight: 500, background: "rgba(5, 8, 22, .72)" },
    watermarkStyle: { color: "#64748b", opacity: 0.16, fontSize: "auto" },
  }}
/>
```

For a custom image background, set `backgroundStyle.type` to `"image"` and pass `image`, `imageOpacity`, `imageSize` (`cover`, `contain`, `stretch`, or `repeat`), and optionally `overlayColor`. Remote images need CORS headers if the chart will be exported through `exportImage()`.

The legacy flat tokens (`background`, `bullish`, `bearish`, `grid`, `accent`, and others) remain supported and automatically feed the corresponding advanced settings unless a nested value explicitly overrides them.

## Performance notes

- Pass a stable `data` array; avoid rebuilding it on every parent render.
- Append or replace batches rather than changing thousands of points one-by-one.
- The renderer only paints the visible bars, while indicator calculations are memoized.
- Device pixel ratio is capped at `2.5` to keep high-DPI canvases from consuming excessive memory.

## Development and release

```bash
npm install
npm run dev       # interactive playground
npm run check     # types + tests + production bundle
npm pack --dry-run
npm publish
```

Before publishing, confirm the author and repository metadata, then verify the tarball with `npm run pack:check`. The public package name is `ohlcraft`.

## Browser support

Modern evergreen browsers with Canvas 2D, Pointer Events, `ResizeObserver`, and CSS `color-mix()` support. The chart module is safe to import during SSR; canvas work starts only after mount.

OHLCraft is MIT licensed. © 2026 Radin
