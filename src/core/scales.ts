export interface ChartGeometry {
  plotWidth: number;
  plotHeight: number;
  barSpacing: number;
  rightOffset: number;
  dataLength: number;
  minPrice: number;
  maxPrice: number;
}

export function indexToX(index: number, geometry: ChartGeometry): number {
  return geometry.plotWidth - (geometry.dataLength - 1 - index + geometry.rightOffset) * geometry.barSpacing;
}

export function xToIndex(x: number, geometry: ChartGeometry): number {
  return geometry.dataLength - 1 + geometry.rightOffset - (geometry.plotWidth - x) / geometry.barSpacing;
}

export function priceToY(price: number, geometry: ChartGeometry): number {
  const range = geometry.maxPrice - geometry.minPrice || 1;
  return ((geometry.maxPrice - price) / range) * geometry.plotHeight;
}

export function yToPrice(y: number, geometry: ChartGeometry): number {
  const range = geometry.maxPrice - geometry.minPrice || 1;
  return geometry.maxPrice - (y / geometry.plotHeight) * range;
}

export function visibleIndexes(geometry: ChartGeometry): { first: number; last: number } {
  return {
    first: Math.max(0, Math.floor(xToIndex(0, geometry)) - 1),
    last: Math.min(geometry.dataLength - 1, Math.ceil(xToIndex(geometry.plotWidth, geometry)) + 1),
  };
}

export function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const nice = normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10;
  return nice * magnitude;
}
