import type { ChartLayout } from "../types";

export type ResolvedChartLayout = "full" | "compact" | "micro";

interface ChartLayoutOptions {
  width: number;
  height: number;
  layout: ChartLayout;
  formattedPrices: readonly string[];
  axisFontSize: number;
  priceScaleWidth?: number | undefined;
  timeScaleHeight?: number | undefined;
}

export interface ChartLayoutMetrics {
  mode: ResolvedChartLayout;
  priceScaleWidth: number;
  timeScaleHeight: number;
}

/** Container-driven chart metrics. Kept pure so SSR and resize behavior stay predictable. */
export function resolveChartLayout({
  width,
  height,
  layout,
  formattedPrices,
  axisFontSize,
  priceScaleWidth,
  timeScaleHeight,
}: ChartLayoutOptions): ChartLayoutMetrics {
  const measuredWidth = width > 0 ? width : 760;
  const measuredHeight = height > 0 ? height : 560;
  const mode: ResolvedChartLayout = layout === "full"
    ? "full"
    : measuredWidth <= 300
      ? "micro"
      : layout === "compact" || measuredWidth <= 520 || measuredHeight <= 300
        ? "compact"
        : "full";

  const compactFontSize = mode === "full" ? axisFontSize : Math.min(axisFontSize, mode === "micro" ? 9 : 10);
  const longestLabel = formattedPrices.reduce((longest, value) => Math.max(longest, value.length), 0);
  const estimatedLabelWidth = Math.ceil(longestLabel * compactFontSize * 0.61 + 20);
  const defaultPriceScale = mode === "full"
    ? Math.max(76, Math.min(128, estimatedLabelWidth))
    : Math.max(mode === "micro" ? 68 : 72, Math.min(104, estimatedLabelWidth));
  const maximumPriceScale = Math.max(56, measuredWidth - (mode === "micro" ? 116 : 140));

  return {
    mode,
    priceScaleWidth: Math.round(Math.max(48, Math.min(priceScaleWidth ?? defaultPriceScale, maximumPriceScale))),
    timeScaleHeight: Math.round(timeScaleHeight ?? (mode === "micro" ? 32 : mode === "compact" ? 36 : 44)),
  };
}
