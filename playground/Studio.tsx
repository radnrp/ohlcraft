import { useEffect, useMemo, useState } from "react";
import {
  TradingChart,
  type ChartThemeInput,
  type ChartTimeframe,
  type ChartType,
  type OHLCData,
} from "../src";
import { CodeBlock } from "./CodeBlock";

type Texture = "none" | "dots" | "grid" | "diagonal" | "noise";
type StudioPanel = "palette" | "candles" | "canvas" | "options";
type Framework = "react" | "next";

interface StudioSettings {
  background: string;
  backgroundTo: string;
  surface: string;
  accent: string;
  bullish: string;
  bearish: string;
  grid: string;
  text: string;
  muted: string;
  candleWidth: number;
  candleRadius: number;
  wickWidth: number;
  borderWidth: number;
  lineWidth: number;
  gridWidth: number;
  texture: Texture;
  textureOpacity: number;
  image: string;
  imageOpacity: number;
  showVolume: boolean;
  showLegend: boolean;
  showToolbar: boolean;
  showWatermark: boolean;
}

const midnight: StudioSettings = {
  background: "#080b14", backgroundTo: "#111a2d", surface: "#111a2d", accent: "#8b7cff",
  bullish: "#2dd4a8", bearish: "#ff5d7a", grid: "#26324a", text: "#eef2ff", muted: "#7f8da8",
  candleWidth: 0.72, candleRadius: 1, wickWidth: 1, borderWidth: 1, lineWidth: 2, gridWidth: 1,
  texture: "none", textureOpacity: 0.05, image: "", imageOpacity: 0.35,
  showVolume: true, showLegend: true, showToolbar: true, showWatermark: true,
};

const presets: Array<{ name: string; note: string; accent: string; settings: StudioSettings }> = [
  { name: "Midnight", note: "Deep & focused", accent: "#8b7cff", settings: midnight },
  { name: "Aurora", note: "Vivid market", accent: "#38bdf8", settings: { ...midnight, background: "#04101b", backgroundTo: "#0c2332", surface: "#0b1d2b", accent: "#38bdf8", bullish: "#22e6a7", bearish: "#ff6b8a", grid: "#17384c", text: "#eefbff", muted: "#7193a8", texture: "dots", textureOpacity: 0.045 } },
  { name: "Terminal", note: "High contrast", accent: "#d7ff45", settings: { ...midnight, background: "#02150d", backgroundTo: "#061f15", surface: "#082419", accent: "#d7ff45", bullish: "#5cff8d", bearish: "#ff4778", grid: "#17472f", text: "#eafff0", muted: "#6fa889", texture: "noise", textureOpacity: 0.08 } },
  { name: "Paper", note: "Clean & bright", accent: "#635bff", settings: { ...midnight, background: "#f7f8fc", backgroundTo: "#e9edf7", surface: "#ffffff", accent: "#635bff", bullish: "#008f6c", bearish: "#db3655", grid: "#cbd3e1", text: "#172033", muted: "#667085", texture: "none" } },
];

function themeFrom(settings: StudioSettings): Exclude<ChartThemeInput, string> {
  return {
    background: settings.background,
    surface: settings.surface,
    text: settings.text,
    textMuted: settings.muted,
    accent: settings.accent,
    bullish: settings.bullish,
    bearish: settings.bearish,
    backgroundStyle: {
      type: settings.image.trim() ? "image" : "gradient",
      color: settings.background,
      colorTo: settings.backgroundTo,
      angle: 135,
      ...(settings.image.trim() ? { image: settings.image.trim() } : {}),
      imageOpacity: settings.imageOpacity,
      imageSize: "cover",
      texture: settings.texture,
      textureColor: settings.text,
      textureOpacity: settings.textureOpacity,
    },
    candlestick: {
      bullishBody: settings.bullish, bearishBody: settings.bearish,
      bullishWick: settings.bullish, bearishWick: settings.bearish,
      bullishBorder: settings.text, bearishBorder: settings.text,
      bodyWidth: settings.candleWidth, bodyRadius: settings.candleRadius,
      wickWidth: settings.wickWidth, borderWidth: settings.borderWidth,
    },
    gridStyle: {
      horizontal: { color: settings.grid, width: settings.gridWidth },
      vertical: { color: settings.grid, width: settings.gridWidth },
    },
    series: { lineColor: settings.accent, lineWidth: settings.lineWidth },
    crosshairStyle: { color: settings.muted, width: settings.gridWidth, labelBackground: settings.accent },
  };
}

function makeSnippet(settings: StudioSettings, framework: Framework, chartType: ChartType, timeframe: ChartTimeframe): string {
  const theme = JSON.stringify(themeFrom(settings), null, 2);
  const client = framework === "next" ? "\"use client\";\n\n" : "";
  const styles = framework === "next"
    ? "// Import once in app/layout.tsx:\n// import \"ohlcraft/styles.css\";\n\n"
    : "import \"ohlcraft/styles.css\";\n\n";
  return client
    + "import { TradingChart, type ChartThemeInput, type OHLCData } from \"ohlcraft\";\n"
    + styles
    + "const theme: ChartThemeInput = " + theme + ";\n\n"
    + "export function MarketChart({ data }: { data: OHLCData[] }) {\n"
    + "  return (\n"
    + "    <TradingChart\n"
    + "      data={data}\n"
    + "      height={560}\n"
    + "      chartType=\"" + chartType + "\"\n"
    + "      defaultTimeframe=\"" + timeframe + "\"\n"
    + "      theme={theme}\n"
    + "      showVolume={" + settings.showVolume + "}\n"
    + "      showLegend={" + settings.showLegend + "}\n"
    + "      showToolbar={" + settings.showToolbar + "}\n"
    + "      showWatermark={" + settings.showWatermark + "}\n"
    + "      watermark=\"BTCUSD · " + timeframe.toUpperCase() + "\"\n"
    + "    />\n"
    + "  );\n"
    + "}";
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="studio-color"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><code>{value}</code></div></label>;
}

function RangeControl({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="studio-range"><span>{label}<output>{value}{suffix}</output></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function Toggle({ label, note, checked, onChange }: { label: string; note: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="studio-toggle"><span><strong>{label}</strong><small>{note}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

export function Studio({ data }: { data: readonly OHLCData[] }) {
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem("ohlcraft-studio-theme");
      return saved ? { ...midnight, ...JSON.parse(saved) as Partial<StudioSettings> } : midnight;
    } catch { return midnight; }
  });
  const [panel, setPanel] = useState<StudioPanel>("palette");
  const [framework, setFramework] = useState<Framework>("react");
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h");
  const theme = useMemo(() => themeFrom(settings), [settings]);
  const snippet = useMemo(() => makeSnippet(settings, framework, chartType, timeframe), [settings, framework, chartType, timeframe]);
  const update = <Key extends keyof StudioSettings>(key: Key, value: StudioSettings[Key]) => setSettings((current) => ({ ...current, [key]: value }));

  useEffect(() => { localStorage.setItem("ohlcraft-studio-theme", JSON.stringify(settings)); }, [settings]);

  return (
    <section className="studio-section site-section" id="studio">
      <div className="section-heading studio-intro">
        <div><span className="section-kicker">OHLCraft Studio</span><h2>Make it unmistakably yours.</h2></div>
        <p>Design your production chart visually. Every change is reflected live, converted into typed React code, and saved locally as you work.</p>
      </div>

      <div className="studio-shell">
        <aside className="studio-controls">
          <div className="studio-controls-head"><div><span>Customize</span><small>Changes are saved locally</small></div><button type="button" onClick={() => setSettings(midnight)}>Reset</button></div>
          <div className="studio-tabs" role="tablist">
            {(["palette", "candles", "canvas", "options"] as const).map((item) => <button type="button" key={item} className={panel === item ? "is-active" : ""} onClick={() => setPanel(item)}>{item}</button>)}
          </div>

          <div className="studio-control-scroll">
            {panel === "palette" && <>
              <div className="control-group-title"><span>Presets</span><small>Start from a curated base</small></div>
              <div className="preset-grid">{presets.map((preset) => <button type="button" key={preset.name} onClick={() => setSettings(preset.settings)}><i style={{ background: preset.accent }} /><span><strong>{preset.name}</strong><small>{preset.note}</small></span></button>)}</div>
              <div className="control-group-title"><span>Core colors</span><small>Brand the complete surface</small></div>
              <div className="color-list">
                <ColorControl label="Background" value={settings.background} onChange={(value) => update("background", value)} />
                <ColorControl label="Gradient end" value={settings.backgroundTo} onChange={(value) => update("backgroundTo", value)} />
                <ColorControl label="Surface" value={settings.surface} onChange={(value) => update("surface", value)} />
                <ColorControl label="Accent" value={settings.accent} onChange={(value) => update("accent", value)} />
                <ColorControl label="Text" value={settings.text} onChange={(value) => update("text", value)} />
                <ColorControl label="Muted text" value={settings.muted} onChange={(value) => update("muted", value)} />
              </div>
            </>}

            {panel === "candles" && <>
              <div className="control-group-title"><span>Market colors</span><small>Independent up and down states</small></div>
              <div className="color-list">
                <ColorControl label="Bullish" value={settings.bullish} onChange={(value) => update("bullish", value)} />
                <ColorControl label="Bearish" value={settings.bearish} onChange={(value) => update("bearish", value)} />
              </div>
              <div className="control-group-title"><span>Geometry</span><small>Fine tune candle rendering</small></div>
              <RangeControl label="Body width" value={settings.candleWidth} min={0.2} max={1} step={0.02} onChange={(value) => update("candleWidth", value)} />
              <RangeControl label="Body radius" value={settings.candleRadius} min={0} max={8} step={0.5} suffix="px" onChange={(value) => update("candleRadius", value)} />
              <RangeControl label="Wick width" value={settings.wickWidth} min={0.5} max={5} step={0.5} suffix="px" onChange={(value) => update("wickWidth", value)} />
              <RangeControl label="Border width" value={settings.borderWidth} min={0} max={4} step={0.5} suffix="px" onChange={(value) => update("borderWidth", value)} />
            </>}

            {panel === "canvas" && <>
              <div className="control-group-title"><span>Grid & series</span><small>Control line visibility and weight</small></div>
              <ColorControl label="Grid color" value={settings.grid} onChange={(value) => update("grid", value)} />
              <RangeControl label="Grid width" value={settings.gridWidth} min={0.25} max={4} step={0.25} suffix="px" onChange={(value) => update("gridWidth", value)} />
              <RangeControl label="Series width" value={settings.lineWidth} min={0.5} max={8} step={0.5} suffix="px" onChange={(value) => update("lineWidth", value)} />
              <label className="studio-select"><span>Texture</span><select value={settings.texture} onChange={(event) => update("texture", event.target.value as Texture)}><option value="none">None</option><option value="dots">Dots</option><option value="grid">Grid</option><option value="diagonal">Diagonal</option><option value="noise">Noise</option></select></label>
              <RangeControl label="Texture opacity" value={settings.textureOpacity} min={0} max={0.3} step={0.01} onChange={(value) => update("textureOpacity", value)} />
              <label className="studio-text"><span>Background image URL</span><input value={settings.image} onChange={(event) => update("image", event.target.value)} placeholder="https://example.com/image.jpg" /></label>
              <RangeControl label="Image opacity" value={settings.imageOpacity} min={0} max={1} step={0.05} onChange={(value) => update("imageOpacity", value)} />
            </>}

            {panel === "options" && <>
              <div className="control-group-title"><span>Chart UI</span><small>Choose what ships to your users</small></div>
              <Toggle label="Volume" note="Show OHLCV volume bars" checked={settings.showVolume} onChange={(value) => update("showVolume", value)} />
              <Toggle label="Legend" note="Live OHLC values" checked={settings.showLegend} onChange={(value) => update("showLegend", value)} />
              <Toggle label="Toolbar" note="Drawing and chart controls" checked={settings.showToolbar} onChange={(value) => update("showToolbar", value)} />
              <Toggle label="Watermark" note="Symbol branding on canvas" checked={settings.showWatermark} onChange={(value) => update("showWatermark", value)} />
              <div className="control-group-title"><span>Data view</span><small>Preview output variants</small></div>
              <label className="studio-select"><span>Chart type</span><select value={chartType} onChange={(event) => setChartType(event.target.value as ChartType)}><option value="candles">Candles</option><option value="hollow-candles">Hollow candles</option><option value="heikin-ashi">Heikin Ashi</option><option value="bars">OHLC bars</option><option value="line">Line</option><option value="area">Area</option><option value="baseline">Baseline</option></select></label>
              <label className="studio-select"><span>Timeframe</span><select value={timeframe} onChange={(event) => setTimeframe(event.target.value as ChartTimeframe)}><option value="5m">5 minutes</option><option value="15m">15 minutes</option><option value="1h">1 hour</option><option value="4h">4 hours</option><option value="1d">1 day</option></select></label>
            </>}
          </div>
        </aside>

        <div className="studio-preview">
          <div className="preview-bar"><div><span className="live-dot" />Live preview</div><div><span>BTC / USD</span><strong>$68,428.30</strong><em>+2.84%</em></div></div>
          <TradingChart
            data={data}
            height={590}
            theme={theme}
            chartType={chartType}
            timeframe={timeframe}
            onChartTypeChange={setChartType}
            onTimeframeChange={setTimeframe}
            showVolume={settings.showVolume}
            showLegend={settings.showLegend}
            showToolbar={settings.showToolbar}
            showWatermark={settings.showWatermark}
            indicators={[{ type: "ema", period: 21, color: settings.accent, lineWidth: 1.5 }]}
            watermark={"BTCUSD · " + timeframe.toUpperCase()}
          />
          <div className="preview-help"><span>Scroll to zoom</span><span>Drag to pan</span><span>Draw and select a line to style it</span></div>
        </div>

        <aside className="studio-output">
          <div className="studio-output-head"><div><span>Generated code</span><small>Ready for production</small></div><div className="framework-toggle"><button type="button" className={framework === "react" ? "is-active" : ""} onClick={() => setFramework("react")}>React</button><button type="button" className={framework === "next" ? "is-active" : ""} onClick={() => setFramework("next")}>Next.js</button></div></div>
          <CodeBlock code={snippet} title="MarketChart.tsx" />
          <div className="output-note"><i>✓</i><span><strong>Fully typed configuration</strong><small>Copy this component into your app and pass your OHLC data.</small></span></div>
        </aside>
      </div>
    </section>
  );
}
