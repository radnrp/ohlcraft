import type { CSSProperties } from "react";

export type ChartTime = number | string | Date;

export interface OHLCData {
  time: ChartTime;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface NormalizedOHLC extends Omit<OHLCData, "time"> {
  time: number;
}

export type ChartType =
  | "candles"
  | "hollow-candles"
  | "heikin-ashi"
  | "bars"
  | "line"
  | "area"
  | "baseline";

export type ChartTimeframe = "auto" | "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

/** Auto follows the chart container, not the browser viewport. */
export type ChartLayout = "auto" | "compact" | "full";

export type DrawingTool =
  | "cursor"
  | "crosshair"
  | "trend-line"
  | "arrow"
  | "ray"
  | "horizontal-line"
  | "vertical-line"
  | "rectangle"
  | "fibonacci"
  | "measure"
  | "long-position"
  | "short-position";

export interface DrawingPoint {
  time: number;
  price: number;
}

export type DrawingLineStyle = "solid" | "dashed" | "dotted";

export interface ChartDrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: DrawingLineStyle;
}

export interface ChartDrawing {
  id: string;
  type: Exclude<DrawingTool, "cursor" | "crosshair">;
  points: DrawingPoint[];
  color?: string;
  lineWidth?: number;
  lineStyle?: DrawingLineStyle;
  label?: string;
  locked?: boolean;
  visible?: boolean;
}

export type IndicatorDefinition =
  | { id?: string; type: "sma"; period: number; color?: string; lineWidth?: number }
  | { id?: string; type: "ema"; period: number; color?: string; lineWidth?: number }
  | {
      id?: string;
      type: "bollinger";
      period: number;
      deviation?: number;
      color?: string;
      fill?: string;
    };

export type ChartLineCap = "butt" | "round" | "square";
export type ChartLineJoin = "bevel" | "round" | "miter";

export interface ChartStrokeStyle {
  color: string;
  width: number;
  dash: number[];
  lineCap: ChartLineCap;
}

export interface ChartBackgroundStyle {
  type: "solid" | "gradient" | "image";
  color: string;
  colorTo: string;
  angle: number;
  image?: string;
  imageOpacity: number;
  imageSize: "cover" | "contain" | "stretch" | "repeat";
  overlayColor: string;
  texture: "none" | "dots" | "grid" | "diagonal" | "noise";
  textureColor: string;
  textureOpacity: number;
  textureSize: number;
}

export interface CandlestickTheme {
  bullishBody: string;
  bearishBody: string;
  bullishWick: string;
  bearishWick: string;
  bullishBorder: string;
  bearishBorder: string;
  bodyWidth: number;
  bodyRadius: number;
  wickWidth: number;
  borderWidth: number;
}

export interface GridTheme {
  horizontal: ChartStrokeStyle & { visible: boolean };
  vertical: ChartStrokeStyle & { visible: boolean };
  axis: ChartStrokeStyle;
}

export interface SeriesTheme {
  lineColor: string;
  lineWidth: number;
  lineDash: number[];
  lineCap: ChartLineCap;
  lineJoin: ChartLineJoin;
  areaTopColor: string;
  areaBottomColor: string;
  baselineTopColor: string;
  baselineBottomColor: string;
}

export interface VolumeTheme {
  bullish: string;
  bearish: string;
  barWidth: number;
  heightRatio: number;
}

export interface CrosshairTheme extends ChartStrokeStyle {
  labelBackground: string;
  labelText: string;
  labelRadius: number;
}

export interface AxisTheme {
  background: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  tickSize: number;
}

export interface WatermarkTheme {
  color: string;
  opacity: number;
  fontSize: number | "auto";
  fontWeight: number;
}

export interface ChartTheme {
  /** Legacy flat tokens remain supported for backwards compatibility. */
  background: string;
  surface: string;
  grid: string;
  gridStrong: string;
  text: string;
  textMuted: string;
  bullish: string;
  bearish: string;
  bullishMuted: string;
  bearishMuted: string;
  accent: string;
  crosshair: string;
  selection: string;
  volumeUp: string;
  volumeDown: string;
  fontFamily: string;
  backgroundStyle: ChartBackgroundStyle;
  candlestick: CandlestickTheme;
  gridStyle: GridTheme;
  series: SeriesTheme;
  volume: VolumeTheme;
  crosshairStyle: CrosshairTheme;
  axis: AxisTheme;
  watermarkStyle: WatermarkTheme;
}

export type DeepPartial<T> = {
  [Property in keyof T]?: T[Property] extends readonly unknown[]
    ? T[Property]
    : T[Property] extends object
      ? DeepPartial<T[Property]>
      : T[Property];
};

export type ChartThemeInput = "dark" | "light" | DeepPartial<ChartTheme>;

export interface ChartLocale {
  locale: string;
  timezone?: string;
  priceFormatter?: (price: number) => string;
  timeFormatter?: (time: number) => string;
  labels?: Partial<Record<DrawingTool | ChartType | "reset" | "delete" | "fullscreen", string>>;
}

export interface VisibleRange {
  from: number;
  to: number;
}

export interface CrosshairMoveEvent {
  point: { x: number; y: number } | null;
  time: number | null;
  price: number | null;
  data: NormalizedOHLC | null;
}

export interface TradingChartHandle {
  fitContent(): void;
  resetPriceScale(): void;
  scrollToRealtime(): void;
  setVisibleRange(range: VisibleRange): void;
  getVisibleRange(): VisibleRange;
  exportImage(type?: "image/png" | "image/jpeg", quality?: number): string;
  undo(): void;
  redo(): void;
  clearDrawings(): void;
  setDrawingsVisible(visible: boolean): void;
}

export interface TradingChartProps {
  data: readonly OHLCData[];
  chartType?: ChartType;
  timeframe?: ChartTimeframe;
  defaultTimeframe?: ChartTimeframe;
  timeframes?: readonly ChartTimeframe[];
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: CSSProperties;
  theme?: ChartThemeInput;
  locale?: ChartLocale;
  indicators?: readonly IndicatorDefinition[];
  drawings?: readonly ChartDrawing[];
  defaultDrawings?: readonly ChartDrawing[];
  defaultDrawingStyle?: Partial<ChartDrawingStyle>;
  showDrawingSettings?: boolean;
  drawingSettingsColors?: readonly string[];
  drawingsVisible?: boolean;
  defaultDrawingsVisible?: boolean;
  showDrawingHistoryControls?: boolean;
  activeTool?: DrawingTool;
  defaultTool?: DrawingTool;
  showToolbar?: boolean;
  showLegend?: boolean;
  showVolume?: boolean;
  showWatermark?: boolean;
  watermark?: string;
  /** Force a layout or let the chart adapt to its measured container. */
  layout?: ChartLayout;
  priceScaleWidth?: number;
  timeScaleHeight?: number;
  rightOffset?: number;
  minBarSpacing?: number;
  maxBarSpacing?: number;
  initialBarSpacing?: number;
  magnet?: boolean;
  animate?: boolean;
  animationDuration?: number;
  onChartTypeChange?: (type: ChartType) => void;
  onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  onToolChange?: (tool: DrawingTool) => void;
  onDrawingsChange?: (drawings: ChartDrawing[]) => void;
  onDrawingsVisibilityChange?: (visible: boolean) => void;
  onCrosshairMove?: (event: CrosshairMoveEvent) => void;
  onVisibleRangeChange?: (range: VisibleRange) => void;
  onCandleClick?: (data: NormalizedOHLC, index: number) => void;
}
