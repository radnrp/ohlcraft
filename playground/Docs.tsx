import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

const reactQuickStart = `import { TradingChart, type OHLCData } from "ohlcraft";
import "ohlcraft/styles.css";

export function MarketChart({ data }: { data: OHLCData[] }) {
  return (
    <TradingChart
      data={data}
      height={560}
      defaultTimeframe="1h"
      showVolume
      indicators={[{ type: "ema", period: 21, color: "#f59e0b" }]}
      watermark="BTCUSD · 1H"
    />
  );
}`;

const nextQuickStart = `// components/market-chart.tsx
"use client";

import { TradingChart, type OHLCData } from "ohlcraft";

export default function MarketChart({ data }: { data: OHLCData[] }) {
  return <TradingChart data={data} height="70vh" defaultTimeframe="1h" />;
}

// app/layout.tsx
import "ohlcraft/styles.css";`;

const themeExample = `const theme: ChartThemeInput = {
  backgroundStyle: {
    type: "gradient",
    color: "#050816",
    colorTo: "#172554",
    texture: "dots",
    textureOpacity: 0.06,
  },
  candlestick: {
    bullishBody: "#22c55e",
    bearishBody: "#f43f5e",
    bodyWidth: 0.76,
    bodyRadius: 2,
    wickWidth: 1.5,
  },
  gridStyle: {
    horizontal: { color: "#293452", dash: [3, 6] },
    vertical: { visible: false },
  },
};`;

const drawingsExample = `const [drawings, setDrawings] = useState<ChartDrawing[]>([]);

<TradingChart
  data={data}
  drawings={drawings}
  onDrawingsChange={setDrawings}
  defaultDrawingStyle={{
    color: "#38bdf8",
    lineWidth: 2,
    lineStyle: "dashed",
  }}
/>

// Store this array as JSON to restore the complete workspace.
localStorage.setItem("drawings", JSON.stringify(drawings));`;

const refExample = `const chart = useRef<TradingChartHandle>(null);

chart.current?.fitContent();
chart.current?.resetPriceScale();
chart.current?.scrollToRealtime();
chart.current?.setVisibleRange({ from, to });
chart.current?.undo();
chart.current?.redo();
chart.current?.clearDrawings();
chart.current?.setDrawingsVisible(false);
const image = chart.current?.exportImage("image/png");`;

const apiRows = [
  ["data", "readonly OHLCData[]", "—", "Timestamped OHLCV market data."],
  ["chartType", "ChartType", "candles", "Candles, bars, line, area, baseline and more."],
  ["theme", "ChartThemeInput", "dark", "Preset name or deeply partial visual theme."],
  ["timeframe", "ChartTimeframe", "auto", "Controlled aggregation timeframe."],
  ["indicators", "IndicatorDefinition[]", "[]", "SMA, EMA and Bollinger overlays."],
  ["drawings", "ChartDrawing[]", "[]", "Controlled drawing collection."],
  ["showToolbar", "boolean", "true", "Show the floating analysis toolbar."],
  ["showDrawingSettings", "boolean", "true", "Show selected drawing style controls."],
  ["showDrawingHistoryControls", "boolean", "true", "Show undo, redo, visibility and clear actions."],
  ["drawingsVisible", "boolean", "true", "Control global drawing visibility."],
  ["showVolume", "boolean", "true", "Render volume at the bottom of the plot."],
  ["locale", "ChartLocale", "en-US", "Formatting, timezone and translated labels."],
  ["onCrosshairMove", "(event) => void", "—", "Receive live time, price and candle data."],
  ["onVisibleRangeChange", "(range) => void", "—", "Observe viewport range changes."],
];

export function Docs() {
  const [framework, setFramework] = useState<"react" | "next">("react");
  return (
    <section className="docs-section site-section" id="docs">
      <div className="section-heading docs-intro">
        <div><span className="section-kicker">Documentation</span><h2>From install to production in minutes.</h2></div>
        <p>OHLCraft gives you a compact API with practical defaults, complete TypeScript definitions, and no runtime dependencies beyond React.</p>
      </div>

      <div className="docs-shell">
        <aside className="docs-nav">
          <div className="docs-nav-title">Getting started</div>
          <a href="#docs-installation">Installation</a>
          <a href="#docs-quick-start">Quick start</a>
          <a href="#docs-data">Data format</a>
          <div className="docs-nav-title">Guides</div>
          <a href="#docs-theme">Advanced themes</a>
          <a href="#docs-drawings">Drawings</a>
          <a href="#docs-ref">Imperative API</a>
          <div className="docs-nav-title">Reference</div>
          <a href="#docs-props">Component props</a>
          <a href="#docs-performance">Performance</a>
        </aside>

        <article className="docs-content">
          <section id="docs-installation">
            <span className="docs-step">01</span><h3>Installation</h3>
            <p>Install the package with your preferred package manager. React and React DOM are peer dependencies.</p>
            <div className="install-grid">
              <CodeBlock compact language="bash" title="npm" code="npm install ohlcraft" />
              <CodeBlock compact language="bash" title="pnpm" code="pnpm add ohlcraft" />
            </div>
            <div className="docs-callout"><strong>Requirements</strong><span>React 18 or 19 · Modern evergreen browser · Next.js App Router supported</span></div>
          </section>

          <section id="docs-quick-start">
            <span className="docs-step">02</span><h3>Quick start</h3>
            <p>Import the component and its stylesheet, then pass a stable OHLC data array.</p>
            <div className="docs-code-tabs"><button type="button" className={framework === "react" ? "is-active" : ""} onClick={() => setFramework("react")}>React</button><button type="button" className={framework === "next" ? "is-active" : ""} onClick={() => setFramework("next")}>Next.js App Router</button></div>
            <CodeBlock code={framework === "react" ? reactQuickStart : nextQuickStart} title={framework === "react" ? "MarketChart.tsx" : "components/market-chart.tsx"} />
          </section>

          <section id="docs-data">
            <span className="docs-step">03</span><h3>Data format</h3>
            <p>Time accepts Unix timestamps, ISO strings, or JavaScript dates. Supply the finest available candles when using built-in aggregation.</p>
            <CodeBlock language="ts" title="types.ts" code={`interface OHLCData {
  time: number | string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}`} />
          </section>

          <section id="docs-theme">
            <span className="docs-step">04</span><h3>Advanced themes</h3>
            <p>Nested theme values are deep-merged with the dark preset. Override only what your design system needs.</p>
            <CodeBlock code={themeExample} title="theme.ts" />
            <div className="docs-feature-row"><span><i>●</i> Solid, gradient and image backgrounds</span><span><i>●</i> Independent body, wick and border colors</span><span><i>●</i> Custom grid, axis, crosshair and volume styles</span></div>
          </section>

          <section id="docs-drawings">
            <span className="docs-step">05</span><h3>Controlled drawings</h3>
            <p>Drawings use timestamp and price coordinates, so zooming, panning and resizing never corrupt stored objects. Every edit is undoable, and drawings can be hidden individually or as a group without deletion.</p>
            <CodeBlock code={drawingsExample} title="workspace.tsx" />
          </section>

          <section id="docs-ref">
            <span className="docs-step">06</span><h3>Imperative API</h3>
            <p>Use the typed ref for viewport actions and high-resolution chart exports.</p>
            <CodeBlock code={refExample} title="chart-actions.tsx" />
          </section>

          <section id="docs-props">
            <span className="docs-step">07</span><h3>Component props</h3>
            <p>The core surface stays deliberately small. Every prop and callback is exported from the package entry point.</p>
            <div className="api-table-wrap"><table className="api-table"><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>{apiRows.map(([name, type, defaultValue, description]) => <tr key={name}><td><code>{name}</code></td><td><code>{type}</code></td><td>{defaultValue}</td><td>{description}</td></tr>)}</tbody></table></div>
          </section>

          <section id="docs-performance">
            <span className="docs-step">08</span><h3>Performance checklist</h3>
            <div className="check-grid"><div><strong>Stable data</strong><p>Memoize arrays and update market data in batches.</p></div><div><strong>Visible rendering</strong><p>Only bars inside the viewport are painted.</p></div><div><strong>HiDPI safe</strong><p>Pixel ratio is capped to protect memory usage.</p></div><div><strong>SSR safe</strong><p>Canvas work begins only after the component mounts.</p></div></div>
          </section>
        </article>
      </div>
    </section>
  );
}
