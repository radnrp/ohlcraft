import type { NormalizedOHLC } from "../types";
import { priceToY, type ChartGeometry } from "./scales";

export interface ScreenPoint {
  x: number;
  y: number;
}

export function clampToPlot(point: ScreenPoint, geometry: ChartGeometry): ScreenPoint {
  return {
    x: Math.max(0, Math.min(geometry.plotWidth, point.x)),
    y: Math.max(0, Math.min(geometry.plotHeight, point.y)),
  };
}

export function snapPriceToCandle(
  rawPrice: number,
  candle: NormalizedOHLC,
  geometry: ChartGeometry,
  thresholdPixels = 12,
): number {
  const rawY = priceToY(rawPrice, geometry);
  const prices = [candle.open, candle.high, candle.low, candle.close];
  let nearest = rawPrice;
  let nearestDistance = thresholdPixels + 1;
  for (const price of prices) {
    const distance = Math.abs(priceToY(price, geometry) - rawY);
    if (distance <= thresholdPixels && distance < nearestDistance) {
      nearest = price;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function distanceToSegment(point: ScreenPoint, start: ScreenPoint, end: ScreenPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const ratio = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}

export function distanceToRay(point: ScreenPoint, start: ScreenPoint, directionPoint: ScreenPoint): number {
  const dx = directionPoint.x - start.x;
  const dy = directionPoint.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  if (projection < 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

export function timestampAtIndex(index: number, data: readonly NormalizedOHLC[]): number {
  if (data.length === 0) return Date.now();
  if (data.length === 1) return data[0]!.time;
  if (index <= 0) {
    const interval = data[1]!.time - data[0]!.time || 1;
    return data[0]!.time + index * interval;
  }
  const lastIndex = data.length - 1;
  if (index >= lastIndex) {
    const interval = data[lastIndex]!.time - data[lastIndex - 1]!.time || 1;
    return data[lastIndex]!.time + (index - lastIndex) * interval;
  }
  const leftIndex = Math.floor(index);
  const rightIndex = Math.ceil(index);
  const progress = index - leftIndex;
  return data[leftIndex]!.time + (data[rightIndex]!.time - data[leftIndex]!.time) * progress;
}

export function panOffset(startOffset: number, deltaPixels: number, barSpacing: number): number {
  return startOffset - deltaPixels / barSpacing;
}

export function anchoredPriceOffset(
  currentOffset: number,
  currentFactor: number,
  nextFactor: number,
  pointerY: number,
  plotHeight: number,
): number {
  const anchor = 0.5 - Math.max(0, Math.min(1, pointerY / Math.max(1, plotHeight)));
  return currentOffset + anchor * (currentFactor - nextFactor);
}

export function verticallyPannedPriceOffset(
  startOffset: number,
  deltaPixels: number,
  plotHeight: number,
  priceScaleFactor: number,
): number {
  return startOffset + (deltaPixels / Math.max(1, plotHeight)) * priceScaleFactor;
}

export function clampPriceOffset(offset: number, priceScaleFactor: number): number {
  // Keep at least a sliver of the auto-scaled market range inside the viewport.
  const overlap = Math.min(0.02, priceScaleFactor * 0.25);
  const limit = Math.max(0, (1 + priceScaleFactor) / 2 - overlap);
  return Math.max(-limit, Math.min(limit, offset));
}

export function rayEndpoint(start: ScreenPoint, direction: ScreenPoint, width: number, height: number): ScreenPoint {
  const dx = direction.x - start.x;
  const dy = direction.y - start.y;
  if (dx === 0 && dy === 0) return start;
  const candidates: number[] = [];
  if (dx > 0) candidates.push((width - start.x) / dx);
  if (dx < 0) candidates.push((0 - start.x) / dx);
  if (dy > 0) candidates.push((height - start.y) / dy);
  if (dy < 0) candidates.push((0 - start.y) / dy);
  const extension = Math.min(...candidates.filter((value) => value >= 1));
  if (!Number.isFinite(extension)) return direction;
  return { x: start.x + dx * extension, y: start.y + dy * extension };
}
