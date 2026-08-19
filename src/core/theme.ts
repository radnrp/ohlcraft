import type { ChartTheme, ChartThemeInput, DeepPartial } from "../types";

export const darkTheme: ChartTheme = {
  background: "#080b14",
  surface: "#111a2d",
  grid: "rgba(150, 170, 215, 0.075)",
  gridStrong: "rgba(150, 170, 215, 0.16)",
  text: "#eef2ff",
  textMuted: "#7f8da8",
  bullish: "#2dd4a8",
  bearish: "#ff5d7a",
  bullishMuted: "rgba(45, 212, 168, 0.17)",
  bearishMuted: "rgba(255, 93, 122, 0.17)",
  accent: "#8b7cff",
  crosshair: "rgba(185, 198, 229, 0.62)",
  selection: "#a99eff",
  volumeUp: "rgba(45, 212, 168, 0.25)",
  volumeDown: "rgba(255, 93, 122, 0.25)",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  backgroundStyle: {
    type: "gradient", color: "#080b14", colorTo: "#111a2d", angle: 135,
    imageOpacity: 0.3, imageSize: "cover", overlayColor: "rgba(8, 11, 20, 0.25)",
    texture: "none", textureColor: "#ffffff", textureOpacity: 0.035, textureSize: 18,
  },
  candlestick: {
    bullishBody: "#2dd4a8", bearishBody: "#ff5d7a",
    bullishWick: "#2dd4a8", bearishWick: "#ff5d7a",
    bullishBorder: "#2dd4a8", bearishBorder: "#ff5d7a",
    bodyWidth: 0.72, bodyRadius: 0, wickWidth: 1, borderWidth: 1,
  },
  gridStyle: {
    horizontal: { visible: true, color: "rgba(150, 170, 215, 0.075)", width: 1, dash: [2, 5], lineCap: "butt" },
    vertical: { visible: true, color: "rgba(150, 170, 215, 0.075)", width: 1, dash: [2, 5], lineCap: "butt" },
    axis: { color: "rgba(150, 170, 215, 0.16)", width: 1, dash: [], lineCap: "butt" },
  },
  series: {
    lineColor: "#8b7cff", lineWidth: 2, lineDash: [], lineCap: "round", lineJoin: "round",
    areaTopColor: "rgba(139, 124, 255, 0.4)", areaBottomColor: "rgba(139, 124, 255, 0)",
    baselineTopColor: "#2dd4a8", baselineBottomColor: "#ff5d7a",
  },
  volume: { bullish: "rgba(45, 212, 168, 0.25)", bearish: "rgba(255, 93, 122, 0.25)", barWidth: 0.68, heightRatio: 0.16 },
  crosshairStyle: { color: "rgba(185, 198, 229, 0.62)", width: 1, dash: [4, 4], lineCap: "butt", labelBackground: "#8b7cff", labelText: "#080b14", labelRadius: 7 },
  axis: { background: "rgba(17, 26, 45, 0.48)", text: "#7f8da8", fontSize: 11, fontWeight: 400, tickSize: 4 },
  watermarkStyle: { color: "rgba(150, 170, 215, 0.16)", opacity: 1, fontSize: "auto", fontWeight: 700 },
};

export const lightTheme: ChartTheme = {
  background: "#fbfbff",
  surface: "#eef1fb",
  grid: "rgba(52, 59, 92, 0.07)",
  gridStrong: "rgba(52, 59, 92, 0.14)",
  text: "#20243a",
  textMuted: "#747b96",
  bullish: "#0aa684",
  bearish: "#ed4968",
  bullishMuted: "rgba(10, 166, 132, 0.13)",
  bearishMuted: "rgba(237, 73, 104, 0.13)",
  accent: "#705ff0",
  crosshair: "rgba(51, 65, 85, 0.7)",
  selection: "#705ff0",
  volumeUp: "rgba(10, 166, 132, 0.2)",
  volumeDown: "rgba(237, 73, 104, 0.2)",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  backgroundStyle: {
    type: "gradient", color: "#fbfbff", colorTo: "#eef1fb", angle: 135,
    imageOpacity: 0.24, imageSize: "cover", overlayColor: "rgba(251, 251, 255, 0.2)",
    texture: "none", textureColor: "#20243a", textureOpacity: 0.03, textureSize: 18,
  },
  candlestick: {
    bullishBody: "#0aa684", bearishBody: "#ed4968",
    bullishWick: "#0aa684", bearishWick: "#ed4968",
    bullishBorder: "#0aa684", bearishBorder: "#ed4968",
    bodyWidth: 0.72, bodyRadius: 0, wickWidth: 1, borderWidth: 1,
  },
  gridStyle: {
    horizontal: { visible: true, color: "rgba(52, 59, 92, 0.07)", width: 1, dash: [2, 5], lineCap: "butt" },
    vertical: { visible: true, color: "rgba(52, 59, 92, 0.07)", width: 1, dash: [2, 5], lineCap: "butt" },
    axis: { color: "rgba(52, 59, 92, 0.14)", width: 1, dash: [], lineCap: "butt" },
  },
  series: {
    lineColor: "#705ff0", lineWidth: 2, lineDash: [], lineCap: "round", lineJoin: "round",
    areaTopColor: "rgba(112, 95, 240, 0.32)", areaBottomColor: "rgba(112, 95, 240, 0)",
    baselineTopColor: "#0aa684", baselineBottomColor: "#ed4968",
  },
  volume: { bullish: "rgba(10, 166, 132, 0.2)", bearish: "rgba(237, 73, 104, 0.2)", barWidth: 0.68, heightRatio: 0.16 },
  crosshairStyle: { color: "rgba(51, 65, 85, 0.7)", width: 1, dash: [4, 4], lineCap: "butt", labelBackground: "#705ff0", labelText: "#fbfbff", labelRadius: 7 },
  axis: { background: "rgba(238, 241, 251, 0.6)", text: "#747b96", fontSize: 11, fontWeight: 400, tickSize: 4 },
  watermarkStyle: { color: "rgba(52, 59, 92, 0.14)", opacity: 1, fontSize: "auto", fontWeight: 700 },
};

function mergeTheme(base: ChartTheme, input: DeepPartial<ChartTheme>): ChartTheme {
  return {
    ...base,
    ...input,
    backgroundStyle: { ...base.backgroundStyle, ...input.backgroundStyle },
    candlestick: { ...base.candlestick, ...input.candlestick },
    gridStyle: {
      ...base.gridStyle,
      ...input.gridStyle,
      horizontal: { ...base.gridStyle.horizontal, ...input.gridStyle?.horizontal },
      vertical: { ...base.gridStyle.vertical, ...input.gridStyle?.vertical },
      axis: { ...base.gridStyle.axis, ...input.gridStyle?.axis },
    },
    series: { ...base.series, ...input.series },
    volume: { ...base.volume, ...input.volume },
    crosshairStyle: { ...base.crosshairStyle, ...input.crosshairStyle },
    axis: { ...base.axis, ...input.axis },
    watermarkStyle: { ...base.watermarkStyle, ...input.watermarkStyle },
  };
}

function applyLegacyTokens(base: ChartTheme, input: DeepPartial<ChartTheme>): ChartTheme {
  const resolved = mergeTheme(base, input);
  if (input.background !== undefined && input.backgroundStyle?.color === undefined) resolved.backgroundStyle.color = input.background;
  if (input.surface !== undefined && input.backgroundStyle?.colorTo === undefined) resolved.backgroundStyle.colorTo = input.surface;
  if (input.grid !== undefined) {
    if (input.gridStyle?.horizontal?.color === undefined) resolved.gridStyle.horizontal.color = input.grid;
    if (input.gridStyle?.vertical?.color === undefined) resolved.gridStyle.vertical.color = input.grid;
  }
  if (input.gridStrong !== undefined && input.gridStyle?.axis?.color === undefined) resolved.gridStyle.axis.color = input.gridStrong;
  if (input.textMuted !== undefined && input.axis?.text === undefined) resolved.axis.text = input.textMuted;
  if (input.bullish !== undefined) {
    if (input.candlestick?.bullishBody === undefined) resolved.candlestick.bullishBody = input.bullish;
    if (input.candlestick?.bullishWick === undefined) resolved.candlestick.bullishWick = input.bullish;
    if (input.candlestick?.bullishBorder === undefined) resolved.candlestick.bullishBorder = input.bullish;
    if (input.series?.baselineTopColor === undefined) resolved.series.baselineTopColor = input.bullish;
  }
  if (input.bearish !== undefined) {
    if (input.candlestick?.bearishBody === undefined) resolved.candlestick.bearishBody = input.bearish;
    if (input.candlestick?.bearishWick === undefined) resolved.candlestick.bearishWick = input.bearish;
    if (input.candlestick?.bearishBorder === undefined) resolved.candlestick.bearishBorder = input.bearish;
    if (input.series?.baselineBottomColor === undefined) resolved.series.baselineBottomColor = input.bearish;
  }
  if (input.accent !== undefined) {
    if (input.series?.lineColor === undefined) resolved.series.lineColor = input.accent;
    if (input.crosshairStyle?.labelBackground === undefined) resolved.crosshairStyle.labelBackground = input.accent;
  }
  if (input.crosshair !== undefined && input.crosshairStyle?.color === undefined) resolved.crosshairStyle.color = input.crosshair;
  if (input.volumeUp !== undefined && input.volume?.bullish === undefined) resolved.volume.bullish = input.volumeUp;
  if (input.volumeDown !== undefined && input.volume?.bearish === undefined) resolved.volume.bearish = input.volumeDown;
  return resolved;
}

export function resolveTheme(theme: ChartThemeInput = "dark"): ChartTheme {
  if (theme === "dark") return darkTheme;
  if (theme === "light") return lightTheme;
  return applyLegacyTokens(darkTheme, theme);
}
