import type { ReactNode } from "react";
import { timeframeLabel } from "./core/timeframes";
import type { ChartLocale, ChartTimeframe, ChartType, DrawingTool } from "./types";

const toolItems: Array<{ tool: DrawingTool; title: string }> = [
  { tool: "cursor", title: "Cursor" },
  { tool: "crosshair", title: "Crosshair" },
  { tool: "trend-line", title: "Trend line" },
  { tool: "arrow", title: "Arrow" },
  { tool: "ray", title: "Ray" },
  { tool: "horizontal-line", title: "Horizontal line" },
  { tool: "vertical-line", title: "Vertical line" },
  { tool: "rectangle", title: "Rectangle" },
  { tool: "fibonacci", title: "Fibonacci retracement" },
  { tool: "measure", title: "Price range" },
  { tool: "long-position", title: "Long position" },
  { tool: "short-position", title: "Short position" },
];

const chartTypes: Array<{ value: ChartType; title: string }> = [
  { value: "candles", title: "Candles" },
  { value: "hollow-candles", title: "Hollow candles" },
  { value: "heikin-ashi", title: "Heikin Ashi" },
  { value: "bars", title: "Bars" },
  { value: "line", title: "Line" },
  { value: "area", title: "Area" },
  { value: "baseline", title: "Baseline" },
];

function IconFrame({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
}

function ToolIcon({ tool }: { tool: DrawingTool }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tool === "cursor") return <IconFrame><path {...common} d="M5 3.8 18.6 12l-6.1 1.25-3.2 5.25z" /></IconFrame>;
  if (tool === "crosshair") return <IconFrame><path {...common} d="M12 3v18M3 12h18" /><circle {...common} cx="12" cy="12" r="3.5" /></IconFrame>;
  if (tool === "trend-line") return <IconFrame><path {...common} d="m4 18 16-12" /><circle {...common} cx="4" cy="18" r="2" /><circle {...common} cx="20" cy="6" r="2" /></IconFrame>;
  if (tool === "arrow") return <IconFrame><path {...common} d="M4 18 19 7M13 6.5l6 .5-1 5.8" /></IconFrame>;
  if (tool === "ray") return <IconFrame><path {...common} d="M4 18 19 7M14 6l6 .2-1.6 5.7" /><circle {...common} cx="4" cy="18" r="2" /></IconFrame>;
  if (tool === "horizontal-line") return <IconFrame><path {...common} d="M3 7h18M3 12h18M3 17h18" /><circle cx="8" cy="12" r="2.2" fill="currentColor" /></IconFrame>;
  if (tool === "vertical-line") return <IconFrame><path {...common} d="M7 3v18M12 3v18M17 3v18" /><circle cx="12" cy="9" r="2.2" fill="currentColor" /></IconFrame>;
  if (tool === "rectangle") return <IconFrame><rect {...common} x="4" y="5" width="16" height="14" rx="3" /><path {...common} d="m7 16 4-4 3 2 3-4" /></IconFrame>;
  if (tool === "fibonacci") return <IconFrame><path {...common} d="M4 5h16M6 9h14M4 13h16M8 17h12M4 21h16" /><path {...common} d="M4 3v19" /></IconFrame>;
  if (tool === "measure") return <IconFrame><path {...common} d="M5 6v12M19 6v12M5 12h14M8 9l-3 3 3 3M16 9l3 3-3 3" /></IconFrame>;
  const isLong = tool === "long-position";
  return <IconFrame><rect {...common} x="4" y="4" width="16" height="16" rx="5" /><path {...common} d={isLong ? "M8 15V9h3.5M8 15h4" : "M15.5 9H11a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H8.5"} /></IconFrame>;
}

function ActionIcon({ type }: { type: "delete" | "reset" | "fullscreen" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "delete") return <IconFrame><path {...common} d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6.5 7l1 14h9l1-14" /></IconFrame>;
  if (type === "reset") return <IconFrame><path {...common} d="M5 8V4m0 0h4M5 4l3.2 3.2A7 7 0 1 1 5.6 14" /></IconFrame>;
  return <IconFrame><path {...common} d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /></IconFrame>;
}

interface ToolbarProps {
  activeTool: DrawingTool;
  chartType: ChartType;
  timeframe: ChartTimeframe;
  timeframes: readonly ChartTimeframe[];
  locale: ChartLocale | undefined;
  canDelete: boolean;
  isFullscreen: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onChartTypeChange: (type: ChartType) => void;
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
  onDelete: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}

export function Toolbar({ activeTool, chartType, timeframe, timeframes, locale, canDelete, isFullscreen, onToolChange, onChartTypeChange, onTimeframeChange, onDelete, onReset, onFullscreen }: ToolbarProps) {
  const labels = locale?.labels;
  return (
    <div className="rtc-toolbar" role="toolbar" aria-label="Chart tools">
      <label className="rtc-chart-type-wrap" title="Chart style">
        <span className="rtc-style-swatch" aria-hidden="true" />
        <span className="rtc-sr-only">Chart style</span>
        <select className="rtc-chart-type" value={chartType} onChange={(event) => onChartTypeChange(event.target.value as ChartType)}>
          {chartTypes.map((item) => <option key={item.value} value={item.value}>{labels?.[item.value] ?? item.title}</option>)}
        </select>
      </label>
      <label className="rtc-timeframe-wrap" title="Timeframe">
        <span className="rtc-sr-only">Timeframe</span>
        <select className="rtc-timeframe" value={timeframe} onChange={(event) => onTimeframeChange(event.target.value as ChartTimeframe)}>
          {timeframes.map((item) => <option key={item} value={item}>{timeframeLabel(item)}</option>)}
        </select>
      </label>
      <span className="rtc-divider" />
      <div className="rtc-tool-strip">
        {toolItems.map((item) => (
          <button key={item.tool} type="button" className={`rtc-tool ${activeTool === item.tool ? "is-active" : ""}`} aria-pressed={activeTool === item.tool} aria-label={labels?.[item.tool] ?? item.title} title={labels?.[item.tool] ?? item.title} onClick={() => onToolChange(item.tool)}>
            <ToolIcon tool={item.tool} />
          </button>
        ))}
      </div>
      <span className="rtc-divider" />
      <button type="button" className="rtc-tool" disabled={!canDelete} onClick={onDelete} aria-label={labels?.delete ?? "Delete selected drawing"} title={labels?.delete ?? "Delete selected drawing"}><ActionIcon type="delete" /></button>
      <button type="button" className="rtc-tool" onClick={onReset} aria-label={labels?.reset ?? "Fit content"} title={labels?.reset ?? "Fit content"}><ActionIcon type="reset" /></button>
      <button type="button" className="rtc-tool" onClick={onFullscreen} aria-pressed={isFullscreen} aria-label={labels?.fullscreen ?? "Fullscreen"} title={labels?.fullscreen ?? "Fullscreen"}><ActionIcon type="fullscreen" /></button>
    </div>
  );
}
