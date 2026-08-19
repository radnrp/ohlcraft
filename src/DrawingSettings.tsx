import type { CSSProperties } from "react";
import type { ChartDrawing, ChartDrawingStyle, DrawingLineStyle } from "./types";

const widths = [1, 2, 3, 4, 6, 8];

interface DrawingSettingsProps {
  drawing: ChartDrawing;
  fallbackColor: string;
  colors: readonly string[];
  position: { left: number; top: number };
  onChange: (style: Partial<ChartDrawingStyle> & { locked?: boolean; visible?: boolean }) => void;
  onDelete: () => void;
  onClose: () => void;
}

function LinePreview({ style }: { style: DrawingLineStyle }) {
  return (
    <svg viewBox="0 0 28 10" aria-hidden="true">
      <line x1="2" y1="5" x2="26" y2="5" pathLength="24" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeDasharray={style === "dashed" ? "7 5" : style === "dotted" ? "1 5" : undefined} />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d={locked ? "M5.5 8V6a4.5 4.5 0 0 1 9 0v2M4 8h12v9H4z" : "M7 8V6a4 4 0 0 1 7.8-1.3M4 8h12v9H4z"} /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5h13M8 5V3h4v2M6 7l.7 10h6.6L14 7M8.2 8.5v6M11.8 8.5v6" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2.4" />{hidden && <path d="m3 3 14 14" />}</svg>;
}

function toColorInput(color: string): string | null {
  if (/^#[\da-f]{6}$/i.test(color)) return color;
  const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

export function DrawingSettings({ drawing, fallbackColor, colors, position, onChange, onDelete, onClose }: DrawingSettingsProps) {
  const color = drawing.color ?? fallbackColor;
  const inputColor = toColorInput(color) ?? toColorInput(fallbackColor) ?? "#8b7cff";
  const lineWidth = drawing.lineWidth ?? 1.5;
  const lineStyle = drawing.lineStyle ?? "solid";
  const widthOptions = widths.includes(lineWidth) ? widths : [...widths, lineWidth].sort((a, b) => a - b);

  return (
    <div
      className="rtc-drawing-settings"
      style={{ "--rtc-drawing-color": color, left: position.left, top: position.top } as CSSProperties}
      role="toolbar"
      aria-label="Selected drawing settings"
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="rtc-drawing-settings-grip" aria-hidden="true" />
      <span className="rtc-drawing-name">{drawing.type.replace(/-/g, " ")}</span>
      <div className="rtc-drawing-color-wrap">
        <label className="rtc-drawing-color" title="Custom color">
          <input type="color" value={inputColor} onChange={(event) => onChange({ color: event.target.value })} aria-label="Drawing color" />
          <span />
        </label>
        <div className="rtc-drawing-palette" aria-label="Quick colors">
          {colors.map((item) => (
            <button key={item} type="button" className={item.toLowerCase() === color.toLowerCase() ? "is-active" : ""}
              style={{ background: item }} onClick={() => onChange({ color: item })} aria-label={`Use color ${item}`} />
          ))}
        </div>
      </div>
      <span className="rtc-drawing-separator" />
      <div className="rtc-line-style-group" aria-label="Line style">
        {(["solid", "dashed", "dotted"] as const).map((style) => (
          <button key={style} type="button" className={lineStyle === style ? "is-active" : ""}
            onClick={() => onChange({ lineStyle: style })} aria-label={`${style} line`} title={`${style} line`}>
            <LinePreview style={style} />
          </button>
        ))}
      </div>
      <label className="rtc-line-width" title="Line width">
        <span className="rtc-sr-only">Line width</span>
        <select value={lineWidth} onChange={(event) => onChange({ lineWidth: Number(event.target.value) })}>
          {widthOptions.map((value) => <option key={value} value={value}>{value}px</option>)}
        </select>
      </label>
      <span className="rtc-drawing-separator" />
      <button type="button" className={`rtc-drawing-action ${drawing.visible === false ? "is-active" : ""}`}
        onClick={() => onChange({ visible: drawing.visible === false })} aria-pressed={drawing.visible === false} aria-label={drawing.visible === false ? "Show drawing" : "Hide drawing"} title={drawing.visible === false ? "Show drawing" : "Hide drawing"}>
        <EyeIcon hidden={drawing.visible === false} />
      </button>
      <button type="button" className={`rtc-drawing-action ${drawing.locked ? "is-active" : ""}`}
        onClick={() => onChange({ locked: !drawing.locked })} aria-pressed={Boolean(drawing.locked)} aria-label={drawing.locked ? "Unlock drawing" : "Lock drawing"} title={drawing.locked ? "Unlock" : "Lock"}>
        <LockIcon locked={Boolean(drawing.locked)} />
      </button>
      <button type="button" className="rtc-drawing-action is-danger" disabled={drawing.locked}
        onClick={onDelete} aria-label="Delete drawing" title="Delete"><TrashIcon /></button>
      <button type="button" className="rtc-drawing-close" onClick={onClose} aria-label="Close drawing settings" title="Close">×</button>
    </div>
  );
}
