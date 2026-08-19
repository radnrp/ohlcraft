import type {
  ChartDrawing,
  ChartTheme,
  ChartType,
  DrawingLineStyle,
  IndicatorDefinition,
  NormalizedOHLC,
} from "../types";
import { bollinger, closes, ema, sma, type IndicatorPoint } from "./indicators";
import {
  indexToX,
  niceStep,
  priceToY,
  visibleIndexes,
  xToIndex,
  type ChartGeometry,
} from "./scales";
import { compactNumber } from "./format";
import { rayEndpoint } from "./interactions";

export interface IndicatorSeries {
  definition: IndicatorDefinition;
  values: IndicatorPoint[];
  upper?: IndicatorPoint[];
  lower?: IndicatorPoint[];
}

export interface RenderOptions {
  width: number;
  height: number;
  priceScaleWidth: number;
  timeScaleHeight: number;
  data: readonly NormalizedOHLC[];
  chartType: ChartType;
  theme: ChartTheme;
  barSpacing: number;
  rightOffset: number;
  showVolume: boolean;
  showWatermark: boolean;
  watermark: string;
  drawings: readonly ChartDrawing[];
  drawingsVisible: boolean;
  selectedDrawingId: string | null;
  draftDrawing: ChartDrawing | null;
  indicators: readonly IndicatorSeries[];
  formatPrice: (price: number) => string;
  formatTime: (time: number) => string;
  formatTimeline: (time: number, visibleDuration: number) => string;
  timeframe: string;
  timezone: string;
  locale: string;
  crosshair: { x: number; y: number } | null;
  animationProgress: number;
  priceScaleFactor: number;
  priceScaleOffset: number;
  backgroundImage?: HTMLImageElement | null;
}

export interface RenderResult {
  geometry: ChartGeometry;
  first: number;
  last: number;
}

export function drawingLineDash(style: DrawingLineStyle = "solid"): number[] {
  if (style === "dashed") return [8, 6];
  if (style === "dotted") return [1, 5];
  return [];
}

export function computeIndicators(
  data: readonly NormalizedOHLC[],
  definitions: readonly IndicatorDefinition[],
): IndicatorSeries[] {
  const values = closes(data);
  return definitions.map((definition) => {
    if (definition.type === "sma") return { definition, values: sma(values, definition.period) };
    if (definition.type === "ema") return { definition, values: ema(values, definition.period) };
    const bands = bollinger(values, definition.period, definition.deviation ?? 2);
    return { definition, values: bands.middle, upper: bands.upper, lower: bands.lower };
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  geometry: ChartGeometry,
  options: RenderOptions,
  first: number,
  last: number,
): void {
  const { theme, formatPrice, formatTimeline, data, height, width, timeScaleHeight } = options;
  ctx.font = `${theme.axis.fontWeight} ${theme.axis.fontSize}px ${theme.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  const desiredTicks = Math.max(5, Math.floor(geometry.plotHeight / 46));
  const step = niceStep((geometry.maxPrice - geometry.minPrice) / desiredTicks);
  const firstPrice = Math.ceil(geometry.minPrice / step) * step;
  for (let price = firstPrice; price <= geometry.maxPrice + step * 0.01; price += step) {
    const y = Math.round(priceToY(price, geometry)) + 0.5;
    const horizontal = theme.gridStyle.horizontal;
    if (horizontal.visible) {
      ctx.strokeStyle = horizontal.color;
      ctx.lineWidth = horizontal.width;
      ctx.lineCap = horizontal.lineCap;
      ctx.setLineDash(horizontal.dash);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(geometry.plotWidth, y);
      ctx.stroke();
    }
    ctx.fillStyle = theme.axis.text;
    ctx.fillText(formatPrice(price), geometry.plotWidth + 9, y);
    ctx.strokeStyle = theme.gridStyle.axis.color;
    ctx.lineWidth = theme.gridStyle.axis.width;
    ctx.setLineDash(theme.gridStyle.axis.dash);
    ctx.beginPath();
    ctx.moveTo(geometry.plotWidth + 1, y);
    ctx.lineTo(geometry.plotWidth + 1 + theme.axis.tickSize, y);
    ctx.stroke();
  }

  if (Math.abs(options.priceScaleFactor - 1) > 0.001 || Math.abs(options.priceScaleOffset) > 0.001) {
    ctx.fillStyle = theme.accent;
    ctx.font = `700 9px ${theme.fontFamily}`;
    ctx.fillText(`MANUAL · ${(1 / options.priceScaleFactor).toFixed(2)}×`, geometry.plotWidth + 9, 14);
  }

  ctx.font = `${theme.axis.fontWeight} ${theme.axis.fontSize}px ${theme.fontFamily}`;
  const visibleCount = Math.max(1, last - first + 1);
  const visibleDuration = Math.max(0, (data[last]?.time ?? 0) - (data[first]?.time ?? 0));
  const gridEvery = Math.max(1, Math.ceil(visibleCount / Math.max(2, Math.floor(geometry.plotWidth / 110))));
  const start = Math.ceil(first / gridEvery) * gridEvery;
  for (let index = start; index <= last; index += gridEvery) {
    const x = Math.round(indexToX(index, geometry)) + 0.5;
    const vertical = theme.gridStyle.vertical;
    if (vertical.visible) {
      ctx.strokeStyle = vertical.color;
      ctx.lineWidth = vertical.width;
      ctx.lineCap = vertical.lineCap;
      ctx.setLineDash(vertical.dash);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, geometry.plotHeight);
      ctx.stroke();
    }
    const label = data[index] ? formatTimeline(data[index]!.time, visibleDuration) : "";
    ctx.fillStyle = theme.axis.text;
    ctx.textAlign = "center";
    ctx.fillText(label, x, geometry.plotHeight + 14);
    ctx.strokeStyle = theme.gridStyle.axis.color;
    ctx.lineWidth = theme.gridStyle.axis.width;
    ctx.setLineDash(theme.gridStyle.axis.dash);
    ctx.beginPath();
    ctx.moveTo(x, geometry.plotHeight + 1);
    ctx.lineTo(x, geometry.plotHeight + 1 + theme.axis.tickSize);
    ctx.stroke();
  }
  ctx.textAlign = "left";
  ctx.setLineDash([]);

  ctx.fillStyle = theme.axis.text;
  ctx.font = `600 9px ${theme.fontFamily}`;
  ctx.fillText(`${options.timeframe} · ${visibleCount} BARS`, 9, height - 8);
  ctx.textAlign = "right";
  ctx.fillText(options.timezone.toUpperCase(), geometry.plotWidth - 9, height - 8);
  ctx.textAlign = "left";

  ctx.strokeStyle = theme.gridStyle.axis.color;
  ctx.lineWidth = theme.gridStyle.axis.width;
  ctx.setLineDash(theme.gridStyle.axis.dash);
  ctx.beginPath();
  ctx.moveTo(geometry.plotWidth + 0.5, 0);
  ctx.lineTo(geometry.plotWidth + 0.5, geometry.plotHeight);
  ctx.moveTo(0, geometry.plotHeight + 0.5);
  ctx.lineTo(width, geometry.plotHeight + 0.5);
  ctx.stroke();
}

function drawVolumes(
  ctx: CanvasRenderingContext2D,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  theme: ChartTheme,
): void {
  let maxVolume = 0;
  for (let index = first; index <= last; index += 1) maxVolume = Math.max(maxVolume, data[index]?.volume ?? 0);
  if (maxVolume <= 0) return;
  const maxHeight = geometry.plotHeight * Math.max(0.02, Math.min(0.8, theme.volume.heightRatio));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  for (let index = first; index <= last; index += 1) {
    const candle = data[index];
    if (!candle?.volume) continue;
    const x = indexToX(index, geometry);
    const height = (candle.volume / maxVolume) * maxHeight;
    const width = geometry.barSpacing * Math.max(0.05, Math.min(1, theme.volume.barWidth));
    ctx.fillStyle = candle.close >= candle.open ? theme.volume.bullish : theme.volume.bearish;
    ctx.fillRect(x - width / 2, geometry.plotHeight - height, width, height);
  }
  ctx.restore();
}

function drawCandles(
  ctx: CanvasRenderingContext2D,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  theme: ChartTheme,
  hollow: boolean,
): void {
  const bodyWidth = Math.max(1, Math.min(geometry.barSpacing * theme.candlestick.bodyWidth, geometry.barSpacing));
  for (let index = first; index <= last; index += 1) {
    const candle = data[index];
    if (!candle) continue;
    const x = indexToX(index, geometry);
    const up = candle.close >= candle.open;
    const bodyColor = up ? theme.candlestick.bullishBody : theme.candlestick.bearishBody;
    const wickColor = up ? theme.candlestick.bullishWick : theme.candlestick.bearishWick;
    const borderColor = up ? theme.candlestick.bullishBorder : theme.candlestick.bearishBorder;
    const yOpen = priceToY(candle.open, geometry);
    const yClose = priceToY(candle.close, geometry);
    const top = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = theme.candlestick.wickWidth;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, priceToY(candle.high, geometry));
    ctx.lineTo(Math.round(x) + 0.5, priceToY(candle.low, geometry));
    ctx.stroke();
    roundedRect(ctx, x - bodyWidth / 2, top, bodyWidth, bodyHeight, Math.min(theme.candlestick.bodyRadius, bodyWidth / 2, bodyHeight / 2));
    ctx.fillStyle = hollow && up ? theme.backgroundStyle.color : bodyColor;
    ctx.fill();
    if (theme.candlestick.borderWidth > 0 || (hollow && up)) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(theme.candlestick.borderWidth, hollow && up ? 1 : 0);
      ctx.stroke();
    }
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  theme: ChartTheme,
): void {
  const arm = Math.max(2, geometry.barSpacing * 0.28);
  ctx.lineWidth = theme.candlestick.wickWidth;
  for (let index = first; index <= last; index += 1) {
    const candle = data[index];
    if (!candle) continue;
    const x = Math.round(indexToX(index, geometry)) + 0.5;
    ctx.strokeStyle = candle.close >= candle.open ? theme.candlestick.bullishWick : theme.candlestick.bearishWick;
    ctx.beginPath();
    ctx.moveTo(x, priceToY(candle.high, geometry));
    ctx.lineTo(x, priceToY(candle.low, geometry));
    ctx.moveTo(x - arm, priceToY(candle.open, geometry));
    ctx.lineTo(x, priceToY(candle.open, geometry));
    ctx.moveTo(x, priceToY(candle.close, geometry));
    ctx.lineTo(x + arm, priceToY(candle.close, geometry));
    ctx.stroke();
  }
}

function traceCloseLine(
  ctx: CanvasRenderingContext2D,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
  first: number,
  last: number,
): void {
  ctx.beginPath();
  let moved = false;
  for (let index = first; index <= last; index += 1) {
    const candle = data[index];
    if (!candle) continue;
    const x = indexToX(index, geometry);
    const y = priceToY(candle.close, geometry);
    if (!moved) {
      ctx.moveTo(x, y);
      moved = true;
    } else ctx.lineTo(x, y);
  }
}

function drawCloseChart(
  ctx: CanvasRenderingContext2D,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  theme: ChartTheme,
  type: "line" | "area" | "baseline",
): void {
  if (first > last) return;
  if (type === "area") {
    traceCloseLine(ctx, data, geometry, first, last);
    const lastX = indexToX(last, geometry);
    const firstX = indexToX(first, geometry);
    ctx.lineTo(lastX, geometry.plotHeight);
    ctx.lineTo(firstX, geometry.plotHeight);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, geometry.plotHeight);
    gradient.addColorStop(0, theme.series.areaTopColor);
    gradient.addColorStop(1, theme.series.areaBottomColor);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  if (type === "baseline") {
    const baseline = data[first]?.close ?? 0;
    const y = priceToY(baseline, geometry);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, geometry.plotWidth, y);
    ctx.clip();
    traceCloseLine(ctx, data, geometry, first, last);
    ctx.strokeStyle = theme.series.baselineTopColor;
    ctx.lineWidth = theme.series.lineWidth;
    ctx.setLineDash(theme.series.lineDash);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, geometry.plotWidth, geometry.plotHeight - y);
    ctx.clip();
    traceCloseLine(ctx, data, geometry, first, last);
    ctx.strokeStyle = theme.series.baselineBottomColor;
    ctx.lineWidth = theme.series.lineWidth;
    ctx.setLineDash(theme.series.lineDash);
    ctx.stroke();
    ctx.restore();
    return;
  }
  traceCloseLine(ctx, data, geometry, first, last);
  ctx.strokeStyle = theme.series.lineColor;
  ctx.lineWidth = theme.series.lineWidth;
  ctx.setLineDash(theme.series.lineDash);
  ctx.lineCap = theme.series.lineCap;
  ctx.lineJoin = theme.series.lineJoin;
  ctx.stroke();
}

function drawSeriesLine(
  ctx: CanvasRenderingContext2D,
  series: readonly IndicatorPoint[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  color: string,
  width: number,
): void {
  ctx.beginPath();
  let moved = false;
  for (let index = first; index <= last; index += 1) {
    const value = series[index];
    if (value === null || value === undefined) {
      moved = false;
      continue;
    }
    const x = indexToX(index, geometry);
    const y = priceToY(value, geometry);
    if (moved) ctx.lineTo(x, y);
    else {
      ctx.moveTo(x, y);
      moved = true;
    }
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.stroke();
}

function drawIndicators(
  ctx: CanvasRenderingContext2D,
  indicators: readonly IndicatorSeries[],
  geometry: ChartGeometry,
  first: number,
  last: number,
  theme: ChartTheme,
): void {
  indicators.forEach((series, position) => {
    const color = series.definition.color ?? ["#f59e0b", "#38bdf8", "#a78bfa", "#fb7185"][position % 4]!;
    if (series.definition.type === "bollinger" && series.upper && series.lower) {
      ctx.beginPath();
      let hasPoint = false;
      for (let index = first; index <= last; index += 1) {
        const value = series.upper[index];
        if (value == null) continue;
        const x = indexToX(index, geometry);
        const y = priceToY(value, geometry);
        if (hasPoint) ctx.lineTo(x, y);
        else {
          ctx.moveTo(x, y);
          hasPoint = true;
        }
      }
      for (let index = last; index >= first; index -= 1) {
        const value = series.lower[index];
        if (value != null) ctx.lineTo(indexToX(index, geometry), priceToY(value, geometry));
      }
      ctx.closePath();
      ctx.fillStyle = series.definition.fill ?? `${color}14`;
      ctx.fill();
      drawSeriesLine(ctx, series.upper, geometry, first, last, color, 1);
      drawSeriesLine(ctx, series.lower, geometry, first, last, color, 1);
      drawSeriesLine(ctx, series.values, geometry, first, last, `${color}aa`, 1);
    } else {
      const lineWidth = "lineWidth" in series.definition ? series.definition.lineWidth ?? 1.5 : 1.5;
      drawSeriesLine(ctx, series.values, geometry, first, last, color, lineWidth);
    }
  });
  ctx.lineJoin = "miter";
  ctx.strokeStyle = theme.text;
}

export function timeToIndex(time: number, data: readonly NormalizedOHLC[]): number {
  if (data.length <= 1) return 0;
  if (time <= data[0]!.time) {
    const interval = data[1]!.time - data[0]!.time || 1;
    return (time - data[0]!.time) / interval;
  }
  const finalIndex = data.length - 1;
  if (time >= data[finalIndex]!.time) {
    const interval = data[finalIndex]!.time - data[finalIndex - 1]!.time || 1;
    return finalIndex + (time - data[finalIndex]!.time) / interval;
  }
  let low = 0;
  let high = data.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const value = data[middle]!.time;
    if (value === time) return middle;
    if (value < time) low = middle + 1;
    else high = middle - 1;
  }
  const right = Math.min(data.length - 1, low);
  const left = Math.max(0, right - 1);
  const duration = data[right]!.time - data[left]!.time || 1;
  return left + (time - data[left]!.time) / duration;
}

export function drawingScreenPoints(
  drawing: ChartDrawing,
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
): Array<{ x: number; y: number }> {
  return drawing.points.map((point) => ({
    x: indexToX(timeToIndex(point.time, data), geometry),
    y: priceToY(point.price, geometry),
  }));
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  theme: ChartTheme,
  color: string,
): void {
  ctx.font = `600 11px ${theme.fontFamily}`;
  const width = ctx.measureText(text).width + 12;
  roundedRect(ctx, x, y - 11, width, 22, 7);
  ctx.shadowColor = `${color}55`;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 6, y);
}

function drawOneDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: ChartDrawing,
  options: RenderOptions,
  geometry: ChartGeometry,
  selected: boolean,
): void {
  const points = drawingScreenPoints(drawing, options.data, geometry);
  if (points.length === 0) return;
  const first = points[0]!;
  const second = points[1] ?? first;
  const color = drawing.color ?? options.theme.accent;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}20`;
  ctx.lineWidth = drawing.lineWidth ?? 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const lineStyle = drawing.lineStyle ?? "solid";
  ctx.setLineDash(drawingLineDash(lineStyle));
  if (selected) {
    ctx.shadowColor = `${color}66`;
    ctx.shadowBlur = 10;
  }

  if (drawing.type === "horizontal-line") {
    ctx.beginPath();
    ctx.moveTo(0, first.y);
    ctx.lineTo(geometry.plotWidth, first.y);
    ctx.stroke();
    drawLabel(ctx, drawing.label ?? options.formatPrice(drawing.points[0]!.price), 8, first.y, options.theme, color);
  } else if (drawing.type === "vertical-line") {
    ctx.beginPath();
    ctx.moveTo(first.x, 0);
    ctx.lineTo(first.x, geometry.plotHeight);
    ctx.stroke();
    drawLabel(ctx, drawing.label ?? options.formatTime(drawing.points[0]!.time), Math.max(6, first.x + 6), geometry.plotHeight - 18, options.theme, color);
  } else if (drawing.type === "rectangle") {
    const x = Math.min(first.x, second.x);
    const y = Math.min(first.y, second.y);
    const width = Math.abs(second.x - first.x);
    const height = Math.abs(second.y - first.y);
    const fill = ctx.createLinearGradient(x, y, x + width, y + height);
    fill.addColorStop(0, `${color}30`);
    fill.addColorStop(1, `${color}08`);
    ctx.fillStyle = fill;
    roundedRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
  } else if (drawing.type === "fibonacci") {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const left = Math.min(first.x, second.x);
    const right = Math.max(first.x, second.x);
    levels.forEach((level, index) => {
      const y = first.y + (second.y - first.y) * level;
      const nextLevel = levels[index + 1];
      if (nextLevel !== undefined) {
        const nextY = first.y + (second.y - first.y) * nextLevel;
        ctx.globalAlpha = 1;
        ctx.fillStyle = index % 2 === 0 ? `${color}12` : `${color}07`;
        ctx.fillRect(left, Math.min(y, nextY), right - left, Math.abs(nextY - y));
      }
      ctx.globalAlpha = level === 0 || level === 1 ? 1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `600 10px ${options.theme.fontFamily}`;
      const levelPrice = drawing.points[0]!.price + ((drawing.points[1]?.price ?? drawing.points[0]!.price) - drawing.points[0]!.price) * level;
      ctx.fillText(`${(level * 100).toFixed(1)} · ${options.formatPrice(levelPrice)}`, left + 6, y - 8);
    });
    ctx.globalAlpha = 1;
  } else if (drawing.type === "measure") {
    const x = Math.min(first.x, second.x);
    const y = Math.min(first.y, second.y);
    const width = Math.abs(second.x - first.x);
    const height = Math.abs(second.y - first.y);
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    const start = drawing.points[0]!.price;
    const end = drawing.points[1]?.price ?? start;
    const percent = start === 0 ? 0 : ((end - start) / start) * 100;
    const bars = Math.max(0, Math.round(Math.abs(timeToIndex(drawing.points[1]?.time ?? drawing.points[0]!.time, options.data) - timeToIndex(drawing.points[0]!.time, options.data))));
    const delta = end - start;
    drawLabel(
      ctx,
      `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%  ·  ${delta >= 0 ? "+" : ""}${options.formatPrice(delta)}  ·  ${bars} bars`,
      x + 6,
      y + 16,
      options.theme,
      percent >= 0 ? options.theme.bullish : options.theme.bearish,
    );
  } else if (drawing.type === "long-position" || drawing.type === "short-position") {
    const entry = first.y;
    const target = second.y;
    const entryPrice = drawing.points[0]!.price;
    const targetPrice = drawing.points[1]?.price ?? entryPrice;
    const direction = drawing.type === "long-position" ? 1 : -1;
    const legacyStopPrice = entryPrice - Math.abs(targetPrice - entryPrice) * direction * 0.55;
    const stopPrice = drawing.points[2]?.price ?? legacyStopPrice;
    const stop = points[2]?.y ?? priceToY(stopPrice, geometry);
    const reward = Math.abs(targetPrice - entryPrice);
    const risk = Math.abs(entryPrice - stopPrice);
    const ratio = risk === 0 ? 0 : reward / risk;
    const rewardPercent = entryPrice === 0 ? 0 : (reward / entryPrice) * 100;
    const riskPercent = entryPrice === 0 ? 0 : (risk / entryPrice) * 100;
    const width = Math.max(64, Math.abs(second.x - first.x));
    const x = Math.abs(second.x - first.x) < 64 ? first.x : Math.min(first.x, second.x);
    ctx.fillStyle = options.theme.bullishMuted;
    ctx.fillRect(x, Math.min(entry, target), width, Math.max(1, Math.abs(target - entry)));
    ctx.fillStyle = options.theme.bearishMuted;
    ctx.fillRect(x, Math.min(entry, stop), width, Math.max(1, Math.abs(stop - entry)));
    ctx.strokeStyle = options.theme.bullish;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, target);
    ctx.lineTo(x + width, target);
    ctx.stroke();
    ctx.strokeStyle = options.theme.bearish;
    ctx.beginPath();
    ctx.moveTo(x, stop);
    ctx.lineTo(x + width, stop);
    ctx.stroke();
    ctx.setLineDash(drawingLineDash(lineStyle));
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, entry);
    ctx.lineTo(x + width, entry);
    ctx.stroke();
    drawLabel(ctx, `TARGET  ${options.formatPrice(targetPrice)}  +${rewardPercent.toFixed(2)}%`, x + 7, target, options.theme, options.theme.bullish);
    drawLabel(ctx, `${drawing.type === "long-position" ? "LONG" : "SHORT"} ENTRY  ${options.formatPrice(entryPrice)}  ·  R:R ${ratio.toFixed(2)}`, x + 7, entry, options.theme, color);
    drawLabel(ctx, `STOP  ${options.formatPrice(stopPrice)}  -${riskPercent.toFixed(2)}%`, x + 7, stop, options.theme, options.theme.bearish);
  } else {
    let endX = second.x;
    let endY = second.y;
    if (drawing.type === "ray") {
      const endpoint = rayEndpoint(first, second, geometry.plotWidth, geometry.plotHeight);
      endX = endpoint.x;
      endY = endpoint.y;
    }
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    if (drawing.type === "arrow") {
      const angle = Math.atan2(endY - first.y, endX - first.x);
      const arrowSize = Math.max(8, Math.min(13, geometry.barSpacing * 0.8));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - Math.cos(angle - Math.PI / 6) * arrowSize, endY - Math.sin(angle - Math.PI / 6) * arrowSize);
      ctx.lineTo(endX - Math.cos(angle + Math.PI / 6) * arrowSize, endY - Math.sin(angle + Math.PI / 6) * arrowSize);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (selected) {
    ctx.shadowBlur = 0;
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = options.theme.background;
      ctx.fill();
      ctx.strokeStyle = options.theme.selection;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = options.theme.selection;
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  options: RenderOptions,
  geometry: ChartGeometry,
): void {
  if (point.x < 0 || point.x > geometry.plotWidth || point.y < 0 || point.y > geometry.plotHeight) return;
  ctx.save();
  const crosshair = options.theme.crosshairStyle;
  ctx.strokeStyle = crosshair.color;
  ctx.lineWidth = crosshair.width;
  ctx.lineCap = crosshair.lineCap;
  ctx.setLineDash(crosshair.dash);
  ctx.beginPath();
  ctx.moveTo(Math.round(point.x) + 0.5, 0);
  ctx.lineTo(Math.round(point.x) + 0.5, geometry.plotHeight);
  ctx.moveTo(0, Math.round(point.y) + 0.5);
  ctx.lineTo(geometry.plotWidth, Math.round(point.y) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  const price = geometry.maxPrice - (point.y / geometry.plotHeight) * (geometry.maxPrice - geometry.minPrice);
  ctx.font = `11px ${options.theme.fontFamily}`;
  const priceText = options.formatPrice(price);
  ctx.fillStyle = crosshair.labelBackground;
  roundedRect(ctx, geometry.plotWidth + 3, point.y - 12, options.priceScaleWidth - 6, 24, crosshair.labelRadius);
  ctx.fill();
  ctx.fillStyle = crosshair.labelText;
  ctx.textBaseline = "middle";
  ctx.fillText(priceText, geometry.plotWidth + 8, point.y);

  const dataIndex = Math.max(0, Math.min(options.data.length - 1, Math.round(xToIndex(point.x, geometry))));
  const candle = options.data[dataIndex];
  if (candle) {
    const timeText = options.formatTime(candle.time);
    const labelWidth = ctx.measureText(timeText).width + 16;
    const labelX = Math.max(2, Math.min(geometry.plotWidth - labelWidth - 2, point.x - labelWidth / 2));
    ctx.fillStyle = crosshair.labelBackground;
    roundedRect(ctx, labelX, geometry.plotHeight + 4, labelWidth, Math.max(22, options.timeScaleHeight - 8), crosshair.labelRadius);
    ctx.fill();
    ctx.fillStyle = crosshair.labelText;
    ctx.textAlign = "center";
    ctx.fillText(timeText, labelX + labelWidth / 2, geometry.plotHeight + options.timeScaleHeight / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function fillBackground(ctx: CanvasRenderingContext2D, options: RenderOptions): void {
  const style = options.theme.backgroundStyle;
  if (style.type === "gradient") {
    const radians = ((style.angle - 90) * Math.PI) / 180;
    const centerX = options.width / 2;
    const centerY = options.height / 2;
    const length = Math.abs(options.width * Math.cos(radians)) + Math.abs(options.height * Math.sin(radians));
    const dx = Math.cos(radians) * length / 2;
    const dy = Math.sin(radians) * length / 2;
    const gradient = ctx.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy);
    gradient.addColorStop(0, style.color);
    gradient.addColorStop(1, style.colorTo);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = style.color;
  }
  ctx.fillRect(0, 0, options.width, options.height);

  if (style.type === "image" && options.backgroundImage) {
    const image = options.backgroundImage;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    if (sourceWidth > 0 && sourceHeight > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, style.imageOpacity));
      if (style.imageSize === "stretch") ctx.drawImage(image, 0, 0, options.width, options.height);
      else if (style.imageSize === "repeat") {
        const pattern = ctx.createPattern(image, "repeat");
        if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, options.width, options.height); }
      } else {
        const scale = style.imageSize === "contain"
          ? Math.min(options.width / sourceWidth, options.height / sourceHeight)
          : Math.max(options.width / sourceWidth, options.height / sourceHeight);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        ctx.drawImage(image, (options.width - drawWidth) / 2, (options.height - drawHeight) / 2, drawWidth, drawHeight);
      }
      ctx.restore();
    }
    if (style.overlayColor && style.overlayColor !== "transparent") {
      ctx.fillStyle = style.overlayColor;
      ctx.fillRect(0, 0, options.width, options.height);
    }
  }

  drawTexture(ctx, options);
}

function drawTexture(ctx: CanvasRenderingContext2D, options: RenderOptions): void {
  const style = options.theme.backgroundStyle;
  if (style.texture === "none" || style.textureOpacity <= 0) return;
  const size = Math.max(4, style.textureSize);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, style.textureOpacity));
  ctx.strokeStyle = style.textureColor;
  ctx.fillStyle = style.textureColor;
  ctx.lineWidth = 1;
  if (style.texture === "dots") {
    for (let y = size / 2; y < options.height; y += size) for (let x = size / 2; x < options.width; x += size) {
      ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style.texture === "grid") {
    ctx.beginPath();
    for (let x = 0; x < options.width; x += size) { ctx.moveTo(x, 0); ctx.lineTo(x, options.height); }
    for (let y = 0; y < options.height; y += size) { ctx.moveTo(0, y); ctx.lineTo(options.width, y); }
    ctx.stroke();
  } else if (style.texture === "diagonal") {
    ctx.beginPath();
    for (let x = -options.height; x < options.width; x += size) { ctx.moveTo(x, options.height); ctx.lineTo(x + options.height, 0); }
    ctx.stroke();
  } else {
    const step = Math.max(3, size / 3);
    for (let y = 0; y < options.height; y += step) for (let x = 0; x < options.width; x += step) {
      const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      if (hash > 0.72) ctx.fillRect(x + hash * step, y + (1 - hash) * step, 1, 1);
    }
  }
  ctx.restore();
}

export function renderChart(ctx: CanvasRenderingContext2D, options: RenderOptions): RenderResult {
  const plotWidth = Math.max(1, options.width - options.priceScaleWidth);
  const plotHeight = Math.max(1, options.height - options.timeScaleHeight);
  const provisional: ChartGeometry = {
    plotWidth,
    plotHeight,
    barSpacing: options.barSpacing,
    rightOffset: options.rightOffset,
    dataLength: options.data.length,
    minPrice: 0,
    maxPrice: 1,
  };
  const { first, last } = visibleIndexes(provisional);
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;
  for (let index = first; index <= last; index += 1) {
    const candle = options.data[index];
    if (!candle) continue;
    minPrice = Math.min(minPrice, candle.low);
    maxPrice = Math.max(maxPrice, candle.high);
    for (const indicator of options.indicators) {
      const values = [indicator.values[index], indicator.upper?.[index], indicator.lower?.[index]];
      for (const value of values) if (value != null) {
        minPrice = Math.min(minPrice, value);
        maxPrice = Math.max(maxPrice, value);
      }
    }
  }
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    minPrice = 0;
    maxPrice = 1;
  }
  const padding = Math.max((maxPrice - minPrice) * 0.09, Math.abs(maxPrice) * 0.001, 0.01);
  const automaticMin = minPrice - padding;
  const automaticMax = maxPrice + padding;
  const automaticRange = automaticMax - automaticMin;
  const priceCenter = (automaticMin + automaticMax) / 2 + automaticRange * options.priceScaleOffset;
  const scaledRange = automaticRange * Math.max(0.04, Math.min(24, options.priceScaleFactor));
  const geometry = { ...provisional, minPrice: priceCenter - scaledRange / 2, maxPrice: priceCenter + scaledRange / 2 };

  ctx.clearRect(0, 0, options.width, options.height);
  fillBackground(ctx, options);
  ctx.save();
  ctx.fillStyle = options.theme.axis.background;
  ctx.fillRect(plotWidth, 0, options.priceScaleWidth, options.height);
  ctx.fillRect(0, plotHeight, plotWidth, options.timeScaleHeight);
  ctx.restore();
  drawGrid(ctx, geometry, options, first, last);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, plotWidth, plotHeight);
  ctx.clip();
  if (options.showWatermark && options.watermark) {
    const watermark = options.theme.watermarkStyle;
    ctx.fillStyle = watermark.color;
    ctx.globalAlpha = watermark.opacity;
    const watermarkSize = watermark.fontSize === "auto" ? Math.max(28, Math.min(64, plotWidth / 10)) : watermark.fontSize;
    ctx.font = `${watermark.fontWeight} ${watermarkSize}px ${options.theme.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.watermark, plotWidth / 2, plotHeight / 2);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }
  ctx.save();
  const progress = Math.max(0, Math.min(1, options.animationProgress));
  ctx.beginPath();
  ctx.rect(0, 0, plotWidth * progress, plotHeight);
  ctx.clip();
  ctx.globalAlpha = 0.35 + progress * 0.65;
  if (options.showVolume) drawVolumes(ctx, options.data, geometry, first, last, options.theme);
  if (options.chartType === "candles" || options.chartType === "hollow-candles" || options.chartType === "heikin-ashi") {
    drawCandles(ctx, options.data, geometry, first, last, options.theme, options.chartType === "hollow-candles");
  } else if (options.chartType === "bars") {
    drawBars(ctx, options.data, geometry, first, last, options.theme);
  } else {
    drawCloseChart(ctx, options.data, geometry, first, last, options.theme, options.chartType);
  }
  drawIndicators(ctx, options.indicators, geometry, first, last, options.theme);
  ctx.restore();
  if (options.drawingsVisible) for (const drawing of options.drawings) {
    if (drawing.visible !== false) drawOneDrawing(ctx, drawing, options, geometry, drawing.id === options.selectedDrawingId);
  }
  if (options.draftDrawing) drawOneDrawing(ctx, options.draftDrawing, options, geometry, true);
  if (options.crosshair) drawCrosshair(ctx, options.crosshair, options, geometry);
  ctx.restore();

  const lastCandle = options.data[last];
  if (lastCandle) {
    const y = priceToY(lastCandle.close, geometry);
    ctx.save();
    ctx.strokeStyle = lastCandle.close >= lastCandle.open ? options.theme.bullish : options.theme.bearish;
    ctx.globalAlpha = 0.48;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotWidth, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = lastCandle.close >= lastCandle.open ? options.theme.bullish : options.theme.bearish;
    roundedRect(ctx, plotWidth + 3, y - 12, options.priceScaleWidth - 6, 24, 7);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 11px ${options.theme.fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.fillText(options.formatPrice(lastCandle.close), plotWidth + 8, y);
  }
  if (options.showVolume) {
    const maxVolume = Math.max(0, ...options.data.slice(first, last + 1).map((item) => item.volume ?? 0));
    if (maxVolume > 0) {
      ctx.fillStyle = options.theme.textMuted;
      ctx.font = `10px ${options.theme.fontFamily}`;
      ctx.fillText(compactNumber(maxVolume, options.locale), 8, plotHeight - plotHeight * options.theme.volume.heightRatio - 8);
    }
  }
  return { geometry, first, last };
}
