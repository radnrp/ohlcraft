"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { normalizeData, inferPrecision, toHeikinAshi } from "./core/data";
import { aggregateOHLC, defaultTimeframes as builtInTimeframes, timeframeLabel } from "./core/timeframes";
import { compactNumber, createPriceFormatter, createTimeFormatter, createTimelineFormatter } from "./core/format";
import { computeIndicators, drawingScreenPoints, renderChart, type RenderResult } from "./core/render";
import {
  clampToPlot,
  clampPriceOffset,
  distanceToRay,
  distanceToSegment,
  anchoredPriceOffset,
  panOffset,
  snapPriceToCandle,
  timestampAtIndex,
  verticallyPannedPriceOffset,
} from "./core/interactions";
import { indexToX, xToIndex, yToPrice, type ChartGeometry } from "./core/scales";
import { resolveTheme } from "./core/theme";
import { resolveChartLayout } from "./core/layout";
import { Toolbar } from "./Toolbar";
import { DrawingSettings } from "./DrawingSettings";
import { DrawingHistoryToolbar } from "./DrawingHistoryToolbar";
import type {
  ChartDrawing,
  ChartDrawingStyle,
  ChartType,
  DrawingPoint,
  DrawingTool,
  NormalizedOHLC,
  TradingChartHandle,
  TradingChartProps,
  VisibleRange,
} from "./types";
import "./styles.css";

const DEFAULT_DRAWING_COLORS = ["#8b7cff", "#38bdf8", "#2dd4a8", "#f59e0b", "#ff5d7a", "#f8fafc", "#64748b"];

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `drawing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneDrawings(drawings: readonly ChartDrawing[]): ChartDrawing[] {
  return drawings.map((drawing) => ({
    ...drawing,
    points: drawing.points.map((point) => ({ ...point })),
  }));
}

function hitTestDrawing(
  point: { x: number; y: number },
  drawings: readonly ChartDrawing[],
  data: readonly NormalizedOHLC[],
  geometry: ChartGeometry,
): string | null {
  for (let index = drawings.length - 1; index >= 0; index -= 1) {
    const drawing = drawings[index]!;
    if (drawing.visible === false) continue;
    const screen = drawingScreenPoints(drawing, data, geometry);
    const first = screen[0];
    const second = screen[1] ?? first;
    if (!first || !second) continue;
    const tolerance = Math.max(7, (drawing.lineWidth ?? 1.5) / 2 + 4);
    if (drawing.type === "horizontal-line" && Math.abs(point.y - first.y) <= tolerance) return drawing.id;
    if (drawing.type === "vertical-line" && Math.abs(point.x - first.x) <= tolerance) return drawing.id;
    if (["rectangle", "fibonacci", "measure", "long-position", "short-position"].includes(drawing.type)) {
      const minX = Math.min(...screen.map((item) => item.x)) - 7;
      const maxX = Math.max(...screen.map((item) => item.x)) + 7;
      const minY = Math.min(...screen.map((item) => item.y)) - 7;
      const maxY = Math.max(...screen.map((item) => item.y)) + 7;
      if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return drawing.id;
    } else if (drawing.type === "ray") {
      if (distanceToRay(point, first, second) <= tolerance) return drawing.id;
    } else if (distanceToSegment(point, first, second) <= tolerance) return drawing.id;
  }
  return null;
}

function nearestDataIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, Math.round(index)));
}

function updateDrawingEnd(drawing: ChartDrawing, nextPoint: DrawingPoint): ChartDrawing {
  const entry = drawing.points[0]!;
  if (drawing.type !== "long-position" && drawing.type !== "short-position") {
    return { ...drawing, points: [entry, nextPoint] };
  }
  const distance = Math.abs(nextPoint.price - entry.price);
  const direction = drawing.type === "long-position" ? 1 : -1;
  return {
    ...drawing,
    points: [
      entry,
      { time: nextPoint.time, price: entry.price + distance * direction },
      { time: nextPoint.time, price: entry.price - distance * direction * 0.55 },
    ],
  };
}

export const TradingChart = forwardRef<TradingChartHandle, TradingChartProps>(function TradingChart(
  {
    data,
    chartType: chartTypeProp = "candles",
    timeframe: controlledTimeframe,
    defaultTimeframe = "auto",
    timeframes = builtInTimeframes,
    height = 560,
    width = "100%",
    className = "",
    style,
    theme: themeProp = "dark",
    locale,
    indicators = [],
    drawings: controlledDrawings,
    defaultDrawings = [],
    defaultDrawingStyle = {},
    showDrawingSettings = true,
    drawingSettingsColors = DEFAULT_DRAWING_COLORS,
    drawingsVisible: controlledDrawingsVisible,
    defaultDrawingsVisible = true,
    showDrawingHistoryControls = true,
    activeTool: controlledTool,
    defaultTool = "crosshair",
    showToolbar = true,
    showLegend = true,
    showVolume = true,
    showWatermark = true,
    watermark = "TRADING CHART",
    layout = "auto",
    priceScaleWidth: priceScaleWidthProp,
    timeScaleHeight: timeScaleHeightProp,
    rightOffset: initialRightOffset = 5,
    minBarSpacing = 2,
    maxBarSpacing = 48,
    initialBarSpacing = 9,
    magnet = true,
    animate = true,
    animationDuration = 520,
    onChartTypeChange,
    onTimeframeChange,
    onToolChange,
    onDrawingsChange,
    onDrawingsVisibilityChange,
    onCrosshairMove,
    onVisibleRangeChange,
    onCandleClick,
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [internalTool, setInternalTool] = useState<DrawingTool>(defaultTool);
  const activeTool = controlledTool ?? internalTool;
  const [currentChartType, setCurrentChartType] = useState<ChartType>(chartTypeProp);
  const [internalTimeframe, setInternalTimeframe] = useState(defaultTimeframe);
  const currentTimeframe = controlledTimeframe ?? internalTimeframe;
  const [internalDrawings, setInternalDrawings] = useState<ChartDrawing[]>(() => [...defaultDrawings]);
  const drawings = controlledDrawings ?? internalDrawings;
  const [internalDrawingsVisible, setInternalDrawingsVisible] = useState(defaultDrawingsVisible);
  const drawingsVisible = controlledDrawingsVisible ?? internalDrawingsVisible;
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ChartDrawing | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [barSpacing, setBarSpacing] = useState(initialBarSpacing);
  const [rightOffset, setRightOffset] = useState(initialRightOffset);
  const [priceScaleFactor, setPriceScaleFactor] = useState(1);
  const [priceScaleOffset, setPriceScaleOffset] = useState(0);
  const [overPriceScale, setOverPriceScale] = useState(false);
  const [overTimeScale, setOverTimeScale] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(animate ? 0 : 1);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const renderResultRef = useRef<RenderResult | null>(null);
  const drawingsRef = useRef<readonly ChartDrawing[]>(drawings);
  const pastDrawingsRef = useRef<ChartDrawing[][]>([]);
  const futureDrawingsRef = useRef<ChartDrawing[][]>([]);
  const [, setHistoryVersion] = useState(0);
  const pendingDrawingRef = useRef<ChartDrawing | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    spacing: number;
    anchorIndex: number;
    anchorX: number;
  } | null>(null);
  const dragRef = useRef<
    | { mode: "pan"; x: number; y: number; rightOffset: number; priceOffset: number; moved: boolean }
    | { mode: "price-scale"; y: number; factor: number; offset: number }
    | { mode: "time-scale"; x: number; spacing: number; anchorIndex: number }
    | {
        mode: "draw";
        drawing: ChartDrawing;
        startScreen: { x: number; y: number };
        moved: boolean;
        completing: boolean;
      }
    | {
        mode: "edit";
        id: string;
        initialPoints: DrawingPoint[];
        start: DrawingPoint;
        startScreen: { x: number; y: number };
        pointIndex: number | null;
        historySnapshot: ChartDrawing[];
        moved: boolean;
      }
    | null
  >(null);

  useEffect(() => setCurrentChartType(chartTypeProp), [chartTypeProp]);
  useEffect(() => {
    const changedExternally = controlledDrawings !== undefined
      && JSON.stringify(drawingsRef.current) !== JSON.stringify(drawings);
    drawingsRef.current = drawings;
    if (changedExternally) {
      pastDrawingsRef.current = [];
      futureDrawingsRef.current = [];
      setHistoryVersion((version) => version + 1);
    }
  }, [controlledDrawings, drawings]);

  const normalized = useMemo(() => normalizeData(data), [data]);
  const timeframedData = useMemo(() => aggregateOHLC(normalized, currentTimeframe), [currentTimeframe, normalized]);
  const displayedData = useMemo(
    () => (currentChartType === "heikin-ashi" ? toHeikinAshi(timeframedData) : timeframedData),
    [currentChartType, timeframedData],
  );
  const computedIndicators = useMemo(() => computeIndicators(displayedData, indicators), [displayedData, indicators]);
  const theme = useMemo(() => resolveTheme(themeProp), [themeProp]);
  const formatPrice = useMemo(() => createPriceFormatter(inferPrecision(displayedData), locale), [displayedData, locale]);
  const formatTime = useMemo(() => createTimeFormatter(locale), [locale]);
  const formatTimeline = useMemo(() => createTimelineFormatter(locale), [locale]);
  const layoutMetrics = useMemo(() => {
    const priceBounds = displayedData.reduce(
      (bounds, item) => ({ min: Math.min(bounds.min, item.low), max: Math.max(bounds.max, item.high) }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );
    const priceSamples = displayedData.length === 0
      ? [formatPrice(0)]
      : [
          formatPrice(priceBounds.min),
          formatPrice(priceBounds.max),
          formatPrice(displayedData[displayedData.length - 1]!.close),
        ];
    return resolveChartLayout({
      width: size.width,
      height: size.height,
      layout,
      formattedPrices: priceSamples,
      axisFontSize: theme.axis.fontSize,
      priceScaleWidth: priceScaleWidthProp,
      timeScaleHeight: timeScaleHeightProp,
    });
  }, [displayedData, formatPrice, layout, priceScaleWidthProp, size.height, size.width, theme.axis.fontSize, timeScaleHeightProp]);
  const priceScaleWidth = layoutMetrics.priceScaleWidth;
  const timeScaleHeight = layoutMetrics.timeScaleHeight;
  const compact = layoutMetrics.mode !== "full";

  useEffect(() => {
    const source = theme.backgroundStyle.type === "image" ? theme.backgroundStyle.image : undefined;
    if (!source || typeof Image === "undefined") {
      setBackgroundImage(null);
      return;
    }
    setBackgroundImage(null);
    let active = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => { if (active) setBackgroundImage(image); };
    image.onerror = () => { if (active) setBackgroundImage(null); };
    image.src = source;
    return () => { active = false; };
  }, [theme.backgroundStyle.image, theme.backgroundStyle.type]);

  const recordHistorySnapshot = useCallback((snapshot: readonly ChartDrawing[]) => {
    pastDrawingsRef.current.push(cloneDrawings(snapshot));
    if (pastDrawingsRef.current.length > 100) pastDrawingsRef.current.shift();
    futureDrawingsRef.current = [];
    setHistoryVersion((version) => version + 1);
  }, []);

  const updateDrawings = useCallback(
    (next: ChartDrawing[], recordHistory = true) => {
      if (recordHistory) recordHistorySnapshot(drawingsRef.current);
      drawingsRef.current = next;
      if (controlledDrawings === undefined) setInternalDrawings(next);
      onDrawingsChange?.(next);
    },
    [controlledDrawings, onDrawingsChange, recordHistorySnapshot],
  );

  const undoDrawings = useCallback(() => {
    const previous = pastDrawingsRef.current.pop();
    if (!previous) return;
    futureDrawingsRef.current.push(cloneDrawings(drawingsRef.current));
    drawingsRef.current = previous;
    if (controlledDrawings === undefined) setInternalDrawings(previous);
    onDrawingsChange?.(previous);
    setSelectedDrawingId(null);
    setHistoryVersion((version) => version + 1);
  }, [controlledDrawings, onDrawingsChange]);

  const redoDrawings = useCallback(() => {
    const next = futureDrawingsRef.current.pop();
    if (!next) return;
    pastDrawingsRef.current.push(cloneDrawings(drawingsRef.current));
    drawingsRef.current = next;
    if (controlledDrawings === undefined) setInternalDrawings(next);
    onDrawingsChange?.(next);
    setSelectedDrawingId(null);
    setHistoryVersion((version) => version + 1);
  }, [controlledDrawings, onDrawingsChange]);

  const clearDrawings = useCallback(() => {
    if (drawingsRef.current.length === 0) return;
    updateDrawings([]);
    setSelectedDrawingId(null);
    setDraftDrawing(null);
    pendingDrawingRef.current = null;
  }, [updateDrawings]);

  const setDrawingsVisibility = useCallback((visible: boolean) => {
    if (controlledDrawingsVisible === undefined) setInternalDrawingsVisible(visible);
    onDrawingsVisibilityChange?.(visible);
    if (!visible) setSelectedDrawingId(null);
  }, [controlledDrawingsVisible, onDrawingsVisibilityChange]);

  const setTool = useCallback(
    (tool: DrawingTool) => {
      pendingDrawingRef.current = null;
      dragRef.current = null;
      setDraftDrawing(null);
      if (controlledTool === undefined) setInternalTool(tool);
      onToolChange?.(tool);
    },
    [controlledTool, onToolChange],
  );

  const setChartType = useCallback(
    (type: ChartType) => {
      setCurrentChartType(type);
      onChartTypeChange?.(type);
    },
    [onChartTypeChange],
  );

  const setTimeframe = useCallback(
    (nextTimeframe: typeof currentTimeframe) => {
      if (controlledTimeframe === undefined) setInternalTimeframe(nextTimeframe);
      if (size.width > priceScaleWidth) {
        const nextLength = aggregateOHLC(normalized, nextTimeframe).length;
        const available = size.width - priceScaleWidth;
        setBarSpacing(Math.max(minBarSpacing, Math.min(maxBarSpacing, available / Math.max(20, nextLength + 8))));
      }
      setRightOffset(initialRightOffset);
      setPriceScaleFactor(1);
      setPriceScaleOffset(0);
      onTimeframeChange?.(nextTimeframe);
    },
    [controlledTimeframe, initialRightOffset, maxBarSpacing, minBarSpacing, normalized, onTimeframeChange, priceScaleWidth, size.width],
  );

  const fitContent = useCallback(() => {
    if (!size.width || !displayedData.length) return;
    const available = Math.max(1, size.width - priceScaleWidth);
    setBarSpacing(Math.max(minBarSpacing, Math.min(maxBarSpacing, available / Math.max(20, displayedData.length + 8))));
    setRightOffset(initialRightOffset);
    setPriceScaleFactor(1);
    setPriceScaleOffset(0);
  }, [displayedData.length, initialRightOffset, maxBarSpacing, minBarSpacing, priceScaleWidth, size.width]);

  const getVisibleRange = useCallback((): VisibleRange => {
    const result = renderResultRef.current;
    if (!result || displayedData.length === 0) return { from: 0, to: 0 };
    return {
      from: displayedData[result.first]?.time ?? displayedData[0]!.time,
      to: displayedData[result.last]?.time ?? displayedData[displayedData.length - 1]!.time,
    };
  }, [displayedData]);

  const setVisibleRange = useCallback(
    (range: VisibleRange) => {
      if (!size.width || displayedData.length < 2) return;
      const first = displayedData.findIndex((item) => item.time >= range.from);
      const lastFromEnd = [...displayedData].reverse().findIndex((item) => item.time <= range.to);
      const start = first < 0 ? 0 : first;
      const end = lastFromEnd < 0 ? displayedData.length - 1 : displayedData.length - 1 - lastFromEnd;
      const count = Math.max(2, end - start + 1);
      const spacing = Math.max(minBarSpacing, Math.min(maxBarSpacing, (size.width - priceScaleWidth) / count));
      setBarSpacing(spacing);
      setRightOffset(displayedData.length - 1 - end);
    },
    [displayedData, maxBarSpacing, minBarSpacing, priceScaleWidth, size.width],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      fitContent,
      resetPriceScale: () => {
        setPriceScaleFactor(1);
        setPriceScaleOffset(0);
      },
      scrollToRealtime: () => setRightOffset(initialRightOffset),
      setVisibleRange,
      getVisibleRange,
      exportImage: (type = "image/png", quality = 0.92) => canvasRef.current?.toDataURL(type, quality) ?? "",
      undo: undoDrawings,
      redo: redoDrawings,
      clearDrawings,
      setDrawingsVisible: setDrawingsVisibility,
    }),
    [clearDrawings, fitContent, getVisibleRange, initialRightOffset, redoDrawings, setDrawingsVisibility, setVisibleRange, undoDrawings],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const bounds = root.getBoundingClientRect();
      setSize({ width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reducedMotion || animationDuration <= 0) {
      setAnimationProgress(1);
      return;
    }
    setAnimationProgress(0);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const linear = Math.min(1, (now - startedAt) / animationDuration);
      const eased = 1 - (1 - linear) ** 3;
      setAnimationProgress(eased);
      if (linear < 1) animationFrameRef.current = requestAnimationFrame(tick);
      else animationFrameRef.current = null;
    };
    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [animate, animationDuration, currentChartType, displayedData]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return;
    const ratio = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 2.5);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderResultRef.current = renderChart(context, {
      width: size.width,
      height: size.height,
      priceScaleWidth,
      timeScaleHeight,
      data: displayedData,
      chartType: currentChartType,
      theme,
      barSpacing,
      rightOffset,
      showVolume,
      showWatermark,
      watermark,
      drawings,
      drawingsVisible,
      selectedDrawingId,
      draftDrawing,
      indicators: computedIndicators,
      formatPrice,
      formatTime,
      formatTimeline,
      timeframe: timeframeLabel(currentTimeframe),
      timezone: locale?.timezone ?? "Local time",
      locale: locale?.locale ?? "en-US",
      crosshair,
      animationProgress,
      priceScaleFactor,
      priceScaleOffset,
      backgroundImage,
      compact,
    });
  }, [
    animationProgress,
    backgroundImage,
    barSpacing,
    computedIndicators,
    crosshair,
    currentChartType,
    displayedData,
    draftDrawing,
    drawings,
    drawingsVisible,
    formatPrice,
    formatTime,
    formatTimeline,
    locale?.locale,
    locale?.timezone,
    priceScaleWidth,
    priceScaleFactor,
    priceScaleOffset,
    rightOffset,
    selectedDrawingId,
    showVolume,
    showWatermark,
    size,
    theme,
    currentTimeframe,
    compact,
    timeScaleHeight,
    watermark,
  ]);

  useEffect(() => {
    if (!renderResultRef.current || !onVisibleRangeChange) return;
    onVisibleRangeChange(getVisibleRange());
  }, [barSpacing, getVisibleRange, onVisibleRangeChange, rightOffset]);

  const eventPoint = useCallback((event: { currentTarget: HTMLCanvasElement; clientX: number; clientY: number }) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, []);

  const toDrawingPoint = useCallback(
    (point: { x: number; y: number }, geometry: ChartGeometry, shouldSnap = magnet): DrawingPoint => {
      const safePoint = clampToPlot(point, geometry);
      const fractionalIndex = xToIndex(safePoint.x, geometry);
      const index = nearestDataIndex(fractionalIndex, displayedData.length);
      const candle = displayedData[index];
      let price = yToPrice(safePoint.y, geometry);
      if (shouldSnap && candle) price = snapPriceToCandle(price, candle, geometry);
      return { time: timestampAtIndex(fractionalIndex, displayedData), price };
    },
    [displayedData, magnet],
  );

  const emitCrosshair = useCallback(
    (point: { x: number; y: number } | null) => {
      setCrosshair(point);
      if (!onCrosshairMove) return;
      const result = renderResultRef.current;
      if (!point || !result || displayedData.length === 0) {
        onCrosshairMove({ point: null, time: null, price: null, data: null });
        return;
      }
      const index = nearestDataIndex(xToIndex(point.x, result.geometry), displayedData.length);
      const candle = displayedData[index] ?? null;
      onCrosshairMove({
        point,
        time: candle?.time ?? null,
        price: yToPrice(point.y, result.geometry),
        data: candle,
      });
    },
    [displayedData, onCrosshairMove],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const result = renderResultRef.current;
    if (!result || displayedData.length === 0) return;
    const rawPoint = eventPoint(event);
    activePointersRef.current.set(event.pointerId, rawPoint);
    if (event.pointerType === "touch" && activePointersRef.current.size === 2) {
      const [first, second] = [...activePointersRef.current.values()];
      if (first && second) {
        const anchorX = (first.x + second.x) / 2;
        pinchRef.current = {
          distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          spacing: barSpacing,
          anchorIndex: xToIndex(anchorX, result.geometry),
          anchorX,
        };
        dragRef.current = null;
        emitCrosshair(null);
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
    }
    if (rawPoint.x > result.geometry.plotWidth && rawPoint.y <= result.geometry.plotHeight) {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        mode: "price-scale",
        y: rawPoint.y,
        factor: priceScaleFactor,
        offset: priceScaleOffset,
      };
      return;
    }
    if (rawPoint.y > result.geometry.plotHeight && rawPoint.x <= result.geometry.plotWidth) {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        mode: "time-scale",
        x: rawPoint.x,
        spacing: barSpacing,
        anchorIndex: xToIndex(rawPoint.x, result.geometry),
      };
      return;
    }
    const point = clampToPlot(rawPoint, result.geometry);
    if (rawPoint.y > result.geometry.plotHeight) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (activeTool === "cursor" || activeTool === "crosshair") {
      const hit = drawingsVisible ? hitTestDrawing(point, drawings, displayedData, result.geometry) : null;
      setSelectedDrawingId(hit);
      if (!hit) {
        dragRef.current = {
          mode: "pan",
          x: point.x,
          y: point.y,
          rightOffset,
          priceOffset: priceScaleOffset,
          moved: false,
        };
      } else {
        const drawing = drawings.find((item) => item.id === hit);
        if (drawing && !drawing.locked) {
          const anchors = drawingScreenPoints(drawing, displayedData, result.geometry);
          const closest = anchors.reduce(
            (best, anchor, index) => {
              const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y);
              return distance < best.distance ? { index, distance } : best;
            },
            { index: -1, distance: Number.POSITIVE_INFINITY },
          );
          dragRef.current = {
            mode: "edit",
            id: drawing.id,
            initialPoints: drawing.points.map((item) => ({ ...item })),
            start: toDrawingPoint(point, result.geometry, false),
            startScreen: point,
            pointIndex: closest.distance <= 9 ? closest.index : null,
            historySnapshot: cloneDrawings(drawingsRef.current),
            moved: false,
          };
        }
      }
      return;
    }
    if (pendingDrawingRef.current) {
      const pending = pendingDrawingRef.current;
      const nextPoint = toDrawingPoint(point, result.geometry);
      const drawing = updateDrawingEnd(pending, nextPoint);
      pendingDrawingRef.current = drawing;
      setDraftDrawing(drawing);
      dragRef.current = {
        mode: "draw",
        drawing,
        startScreen: point,
        moved: false,
        completing: true,
      };
      return;
    }
    const chartPoint = toDrawingPoint(point, result.geometry);
    const onePoint = activeTool === "horizontal-line" || activeTool === "vertical-line";
    const drawing: ChartDrawing = {
      id: createId(),
      type: activeTool,
      ...defaultDrawingStyle,
      points: onePoint
        ? [chartPoint]
        : activeTool === "long-position" || activeTool === "short-position"
          ? [chartPoint, chartPoint, chartPoint]
          : [chartPoint, chartPoint],
    };
    if (onePoint) {
      updateDrawings([...drawings, drawing]);
      setSelectedDrawingId(drawing.id);
      setTool("crosshair");
    } else {
      dragRef.current = {
        mode: "draw",
        drawing,
        startScreen: point,
        moved: false,
        completing: false,
      };
      setDraftDrawing(drawing);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const result = renderResultRef.current;
    if (!result) return;
    const rawPoint = eventPoint(event);
    if (activePointersRef.current.has(event.pointerId)) activePointersRef.current.set(event.pointerId, rawPoint);
    const pinch = pinchRef.current;
    if (pinch && activePointersRef.current.size >= 2) {
      const [first, second] = [...activePointersRef.current.values()];
      if (first && second) {
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const nextSpacing = Math.max(minBarSpacing, Math.min(maxBarSpacing, pinch.spacing * distance / pinch.distance));
        const nextOffset = (result.geometry.plotWidth - pinch.anchorX) / nextSpacing
          - (displayedData.length - 1 - pinch.anchorIndex);
        setBarSpacing(nextSpacing);
        setRightOffset(nextOffset);
        emitCrosshair(null);
      }
      return;
    }
    setOverPriceScale(rawPoint.x > result.geometry.plotWidth && rawPoint.y <= result.geometry.plotHeight);
    setOverTimeScale(rawPoint.y > result.geometry.plotHeight && rawPoint.x <= result.geometry.plotWidth);
    const point = clampToPlot(rawPoint, result.geometry);
    const drag = dragRef.current;
    if (drag?.mode === "price-scale") {
      const nextFactor = drag.factor * Math.exp((rawPoint.y - drag.y) * 0.012);
      const clampedFactor = Math.max(0.04, Math.min(24, nextFactor));
      const nextOffset = anchoredPriceOffset(
        drag.offset,
        drag.factor,
        clampedFactor,
        drag.y,
        result.geometry.plotHeight,
      );
      setPriceScaleFactor(clampedFactor);
      setPriceScaleOffset(clampPriceOffset(nextOffset, clampedFactor));
      emitCrosshair(null);
      return;
    }
    if (drag?.mode === "time-scale") {
      const nextSpacing = Math.max(minBarSpacing, Math.min(maxBarSpacing, drag.spacing * Math.exp((rawPoint.x - drag.x) * 0.01)));
      const nextOffset = (result.geometry.plotWidth - drag.x) / nextSpacing - (displayedData.length - 1 - drag.anchorIndex);
      setBarSpacing(nextSpacing);
      setRightOffset(nextOffset);
      emitCrosshair(null);
      return;
    }
    emitCrosshair(rawPoint.x <= result.geometry.plotWidth && rawPoint.y <= result.geometry.plotHeight ? point : null);
    if (!drag) {
      const pending = pendingDrawingRef.current;
      if (pending && rawPoint.x <= result.geometry.plotWidth && rawPoint.y <= result.geometry.plotHeight) {
        const nextPoint = toDrawingPoint(point, result.geometry);
        const drawing = updateDrawingEnd(pending, nextPoint);
        pendingDrawingRef.current = drawing;
        setDraftDrawing(drawing);
      }
      return;
    }
    if (drag.mode === "pan") {
      if (Math.hypot(point.x - drag.x, point.y - drag.y) > 2) drag.moved = true;
      const visibleBars = result.geometry.plotWidth / barSpacing;
      const minimumOffset = -Math.max(0, displayedData.length - 2);
      const maximumOffset = Math.max(10, visibleBars * 0.6);
      setRightOffset(Math.max(minimumOffset, Math.min(maximumOffset, panOffset(drag.rightOffset, point.x - drag.x, barSpacing))));
      if (Math.abs(priceScaleFactor - 1) > 0.001 || Math.abs(priceScaleOffset) > 0.001) {
        const nextPriceOffset = verticallyPannedPriceOffset(
          drag.priceOffset,
          point.y - drag.y,
          result.geometry.plotHeight,
          priceScaleFactor,
        );
        setPriceScaleOffset(clampPriceOffset(nextPriceOffset, priceScaleFactor));
      }
    } else if (drag.mode === "draw") {
      const nextPoint = toDrawingPoint(point, result.geometry);
      const drawing = updateDrawingEnd(drag.drawing, nextPoint);
      if (Math.hypot(point.x - drag.startScreen.x, point.y - drag.startScreen.y) >= 4) drag.moved = true;
      drag.drawing = drawing;
      setDraftDrawing(drawing);
    } else {
      if (!drag.moved && Math.hypot(point.x - drag.startScreen.x, point.y - drag.startScreen.y) <= 2) return;
      drag.moved = true;
      const nextPoint = toDrawingPoint(point, result.geometry, drag.pointIndex !== null);
      const deltaTime = nextPoint.time - drag.start.time;
      const deltaPrice = nextPoint.price - drag.start.price;
      const nextPoints = drag.initialPoints.map((original, index) => {
        if (drag.pointIndex !== null) return index === drag.pointIndex ? nextPoint : original;
        return { time: original.time + deltaTime, price: original.price + deltaPrice };
      });
      updateDrawings(drawingsRef.current.map((drawing) =>
        drawing.id === drag.id ? { ...drawing, points: nextPoints } : drawing,
      ), false);
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) pinchRef.current = null;
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag) return;
    if (drag.mode === "draw") {
      if (drag.completing || drag.moved) {
        updateDrawings([...drawingsRef.current, drag.drawing]);
        setSelectedDrawingId(drag.drawing.id);
        pendingDrawingRef.current = null;
        setDraftDrawing(null);
        setTool("crosshair");
      } else {
        pendingDrawingRef.current = drag.drawing;
        setDraftDrawing(drag.drawing);
      }
    } else if (drag.mode === "edit" && drag.moved) {
      recordHistorySnapshot(drag.historySnapshot);
    } else if (drag.mode === "pan" && !drag.moved && onCandleClick && renderResultRef.current) {
      const point = eventPoint(event);
      const index = nearestDataIndex(xToIndex(point.x, renderResultRef.current.geometry), displayedData.length);
      const candle = displayedData[index];
      if (candle) onCandleClick(candle, index);
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) pinchRef.current = null;
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.mode === "edit" && drag.moved) updateDrawings(cloneDrawings(drag.historySnapshot), false);
    pendingDrawingRef.current = null;
    setDraftDrawing(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onWheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const result = renderResultRef.current;
    if (!result) return;
    const point = eventPoint(event);
    if (point.x > result.geometry.plotWidth && point.y <= result.geometry.plotHeight) {
      const nextFactor = Math.max(0.04, Math.min(24, priceScaleFactor * Math.exp(event.deltaY * 0.002)));
      const nextOffset = anchoredPriceOffset(
        priceScaleOffset,
        priceScaleFactor,
        nextFactor,
        point.y,
        result.geometry.plotHeight,
      );
      setPriceScaleFactor(nextFactor);
      setPriceScaleOffset(clampPriceOffset(nextOffset, nextFactor));
      return;
    }
    if (event.ctrlKey || Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      const anchorIndex = xToIndex(point.x, result.geometry);
      const factor = Math.exp(-event.deltaY * 0.0015);
      const nextSpacing = Math.max(minBarSpacing, Math.min(maxBarSpacing, barSpacing * factor));
      const nextOffset = (size.width - priceScaleWidth - point.x) / nextSpacing - (displayedData.length - 1 - anchorIndex);
      setBarSpacing(nextSpacing);
      setRightOffset(nextOffset);
    } else {
      setRightOffset((value) => value + event.deltaX / barSpacing);
    }
  };

  const deleteSelected = useCallback(() => {
    if (!selectedDrawingId) return;
    const drawing = drawingsRef.current.find((item) => item.id === selectedDrawingId);
    if (drawing?.locked) return;
    updateDrawings(drawingsRef.current.filter((item) => item.id !== selectedDrawingId));
    setSelectedDrawingId(null);
  }, [selectedDrawingId, updateDrawings]);

  const selectedDrawing = useMemo(
    () => drawings.find((drawing) => drawing.id === selectedDrawingId) ?? null,
    [drawings, selectedDrawingId],
  );

  const updateSelectedDrawing = useCallback((patch: Partial<ChartDrawingStyle> & { locked?: boolean; visible?: boolean }) => {
    if (!selectedDrawingId) return;
    updateDrawings(drawingsRef.current.map((drawing) =>
      drawing.id === selectedDrawingId ? { ...drawing, ...patch } : drawing,
    ));
  }, [selectedDrawingId, updateDrawings]);

  const hasHiddenDrawings = drawings.some((drawing) => drawing.visible === false);
  const toggleDrawingsVisibility = useCallback(() => {
    const hasHidden = drawingsRef.current.some((drawing) => drawing.visible === false);
    if (!drawingsVisible) {
      if (hasHidden) updateDrawings(drawingsRef.current.map((drawing) => ({ ...drawing, visible: true })));
      setDrawingsVisibility(true);
      return;
    }
    if (hasHidden) {
      updateDrawings(drawingsRef.current.map((drawing) => ({ ...drawing, visible: true })));
      return;
    }
    setDrawingsVisibility(false);
  }, [drawingsVisible, setDrawingsVisibility, updateDrawings]);

  const drawingSettingsPosition = useMemo(() => {
    const result = renderResultRef.current;
    if (!selectedDrawing || !result) return { left: size.width / 2, top: 64 };
    const points = drawingScreenPoints(selectedDrawing, displayedData, result.geometry);
    if (!points.length) return { left: result.geometry.plotWidth / 2, top: 64 };
    let anchorX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    let anchorY = Math.max(...points.map((point) => point.y));
    if (selectedDrawing.type === "horizontal-line") anchorX = result.geometry.plotWidth / 2;
    if (selectedDrawing.type === "vertical-line") anchorY = result.geometry.plotHeight / 2;
    const safeHalfWidth = Math.min(210, result.geometry.plotWidth / 2);
    const left = result.geometry.plotWidth < 440
      ? result.geometry.plotWidth / 2
      : Math.max(safeHalfWidth, Math.min(result.geometry.plotWidth - safeHalfWidth, anchorX));
    const maximumTop = Math.max(12, result.geometry.plotHeight - (showToolbar ? 116 : 64));
    const below = anchorY + 18;
    const top = below <= maximumTop
      ? Math.max(12, below)
      : Math.max(12, Math.min(maximumTop, Math.min(...points.map((point) => point.y)) - 62));
    return { left, top };
  }, [barSpacing, displayedData, priceScaleFactor, priceScaleOffset, priceScaleWidth, rightOffset, selectedDrawing, showToolbar, size, timeScaleHeight]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoDrawings();
      else undoDrawings();
    } else if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoDrawings();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelected();
    } else if (event.key === "Escape") {
      dragRef.current = null;
      pendingDrawingRef.current = null;
      setDraftDrawing(null);
      setSelectedDrawingId(null);
      setTool("crosshair");
    } else if (event.key === "+" || event.key === "=") {
      setBarSpacing((value) => Math.min(maxBarSpacing, value * 1.15));
    } else if (event.key === "-") {
      setBarSpacing((value) => Math.max(minBarSpacing, value / 1.15));
    }
  };

  const legendCandle = useMemo(() => {
    if (!crosshair || !renderResultRef.current || !displayedData.length) return displayedData[displayedData.length - 1];
    return displayedData[nearestDataIndex(xToIndex(crosshair.x, renderResultRef.current.geometry), displayedData.length)];
  }, [crosshair, displayedData]);
  const legendIndex = legendCandle ? displayedData.indexOf(legendCandle) : -1;
  const previousLegendCandle = legendIndex > 0 ? displayedData[legendIndex - 1] : undefined;
  const candleChange = legendCandle && previousLegendCandle
    ? legendCandle.close - previousLegendCandle.close
    : legendCandle
      ? legendCandle.close - legendCandle.open
      : 0;
  const candleChangeBase = previousLegendCandle?.close ?? legendCandle?.open ?? 0;
  const candleChangePercent = candleChangeBase === 0 ? 0 : candleChange / candleChangeBase * 100;
  const candleRangePercent = legendCandle && legendCandle.low !== 0
    ? (legendCandle.high - legendCandle.low) / legendCandle.low * 100
    : 0;

  const rootStyle = {
    ...style,
    width,
    height,
    "--rtc-bg": theme.background,
    "--rtc-surface": theme.surface,
    "--rtc-border": theme.gridStrong,
    "--rtc-text": theme.text,
    "--rtc-muted": theme.textMuted,
    "--rtc-accent": theme.accent,
    "--rtc-font": theme.fontFamily,
    "--rtc-up": theme.candlestick.bullishBody,
    "--rtc-down": theme.candlestick.bearishBody,
    "--rtc-time-scale-height": `${timeScaleHeight}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`rtc-root ${className}`}
      style={rootStyle}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="application"
      aria-label="Interactive financial chart"
      data-layout={layoutMetrics.mode}
    >
      {showToolbar && (
        <Toolbar
          activeTool={activeTool}
          chartType={currentChartType}
          timeframe={currentTimeframe}
          timeframes={timeframes}
          locale={locale}
          canDelete={Boolean(selectedDrawingId && !selectedDrawing?.locked)}
          onToolChange={setTool}
          onChartTypeChange={setChartType}
          onTimeframeChange={setTimeframe}
          onDelete={deleteSelected}
          onReset={fitContent}
          onFullscreen={() => {
            const root = rootRef.current;
            if (!root) return;
            if (document.fullscreenElement) void document.exitFullscreen();
            else void root.requestFullscreen();
          }}
        />
      )}
      {showDrawingHistoryControls && (
        <DrawingHistoryToolbar
          canUndo={pastDrawingsRef.current.length > 0}
          canRedo={futureDrawingsRef.current.length > 0}
          hasDrawings={drawings.length > 0}
          drawingsVisible={drawingsVisible}
          hasHiddenDrawings={hasHiddenDrawings}
          onUndo={undoDrawings}
          onRedo={redoDrawings}
          onToggleVisibility={toggleDrawingsVisibility}
          onClear={clearDrawings}
        />
      )}
      {showLegend && legendCandle && (
        <div className={`rtc-legend ${showToolbar ? "with-toolbar" : ""}`} aria-live="polite">
          <span className="rtc-legend-time">{formatTime(legendCandle.time)} · {timeframeLabel(currentTimeframe)}</span>
          <span className="rtc-legend-stat">O <b>{formatPrice(legendCandle.open)}</b></span>
          <span className="rtc-legend-stat">H <b>{formatPrice(legendCandle.high)}</b></span>
          <span className="rtc-legend-stat">L <b>{formatPrice(legendCandle.low)}</b></span>
          <span className="rtc-legend-stat">C <b className={legendCandle.close >= legendCandle.open ? "is-up" : "is-down"}>{formatPrice(legendCandle.close)}</b></span>
          <span className="rtc-legend-stat">Δ <b className={candleChange >= 0 ? "is-up" : "is-down"}>
            {candleChange >= 0 ? "+" : ""}{formatPrice(candleChange)} ({candleChangePercent >= 0 ? "+" : ""}{candleChangePercent.toFixed(2)}%)
          </b></span>
          <span className="rtc-legend-stat">R <b>{candleRangePercent.toFixed(2)}%</b></span>
          {legendCandle.volume !== undefined && <span className="rtc-legend-stat">V <b>{compactNumber(legendCandle.volume, locale?.locale)}</b></span>}
        </div>
      )}
      {activeTool !== "cursor" && activeTool !== "crosshair" && (
        <div className="rtc-mode-chip">
          {draftDrawing ? "Place second point" : `Draw ${activeTool.replace(/-/g, " ")}`}
        </div>
      )}
      {displayedData.length === 0 && <div className="rtc-empty">No market data</div>}
      <canvas
        ref={canvasRef}
        className={`rtc-canvas tool-${activeTool} ${overPriceScale ? "is-price-scale" : ""} ${overTimeScale ? "is-time-scale" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => {
          setOverPriceScale(false);
          setOverTimeScale(false);
          if (!dragRef.current) emitCrosshair(null);
        }}
        onWheel={onWheel}
        onDoubleClick={(event) => {
          const result = renderResultRef.current;
          if (!result) return;
          const point = eventPoint(event);
          if (point.x > result.geometry.plotWidth) {
            setPriceScaleFactor(1);
            setPriceScaleOffset(0);
          }
          else if (point.y > result.geometry.plotHeight) fitContent();
        }}
      />
      {showDrawingSettings && selectedDrawing && (
        <DrawingSettings
          drawing={selectedDrawing}
          fallbackColor={theme.accent}
          colors={drawingSettingsColors}
          position={drawingSettingsPosition}
          onChange={updateSelectedDrawing}
          onDelete={deleteSelected}
          onClose={() => setSelectedDrawingId(null)}
        />
      )}
    </div>
  );
});
