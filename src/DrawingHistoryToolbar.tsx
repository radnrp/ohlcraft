import { useEffect, useId, useState, type ReactNode } from "react";

interface DrawingHistoryToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasDrawings: boolean;
  drawingsVisible: boolean;
  hasHiddenDrawings: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleVisibility: () => void;
  onClear: () => void;
}

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true">{children}</svg>;
}

function UndoIcon({ redo = false }: { redo?: boolean }) {
  return <Icon><path d={redo ? "M16.5 6.5h-4v-4M16.2 6.2A7 7 0 1 0 17 13" : "M3.5 6.5h4v-4M3.8 6.2A7 7 0 1 1 3 13"} /></Icon>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <Icon><path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2.4" />{hidden && <path d="m3 3 14 14" />}</Icon>;
}

function ClearIcon() {
  return <Icon><path d="M3.5 5.5h13M7.5 5.5v-2h5v2M5.5 5.5l.8 11h7.4l.8-11M8.2 8v5.7M11.8 8v5.7" /></Icon>;
}

export function DrawingHistoryToolbar({ canUndo, canRedo, hasDrawings, drawingsVisible, hasHiddenDrawings, onUndo, onRedo, onToggleVisibility, onClear }: DrawingHistoryToolbarProps) {
  const shouldReveal = !drawingsVisible || hasHiddenDrawings;
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className={`rtc-history-toolbar ${mobileOpen ? "is-open" : ""}`}>
      <div className="rtc-history-desktop-content" role="toolbar" aria-label="Drawing history and visibility">
        <button type="button" disabled={!canUndo} onClick={onUndo} aria-label="Undo drawing change" title="Undo (Ctrl+Z)"><UndoIcon /></button>
        <button type="button" disabled={!canRedo} onClick={onRedo} aria-label="Redo drawing change" title="Redo (Ctrl+Shift+Z)"><UndoIcon redo /></button>
        <span />
        <button type="button" disabled={!hasDrawings} className={shouldReveal ? "is-active" : ""} onClick={onToggleVisibility}
          aria-label={shouldReveal ? "Show all drawings" : "Hide all drawings"} title={shouldReveal ? "Show all drawings" : "Hide all drawings"}>
          <EyeIcon hidden={shouldReveal} />
        </button>
        <button type="button" disabled={!hasDrawings} className="is-danger" onClick={onClear} aria-label="Clear all drawings" title="Clear drawings (undoable)"><ClearIcon /></button>
      </div>
      <button type="button" className="rtc-history-mobile-trigger" aria-label="Drawing history and visibility" aria-controls={panelId} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
        <UndoIcon />
      </button>
      {mobileOpen && (
        <div id={panelId} className="rtc-history-mobile-panel" role="toolbar" aria-label="Drawing history actions">
          <button type="button" disabled={!canUndo} onClick={() => { onUndo(); setMobileOpen(false); }} aria-label="Undo drawing change"><UndoIcon /><span>Undo</span></button>
          <button type="button" disabled={!canRedo} onClick={() => { onRedo(); setMobileOpen(false); }} aria-label="Redo drawing change"><UndoIcon redo /><span>Redo</span></button>
          <button type="button" disabled={!hasDrawings} className={shouldReveal ? "is-active" : ""} onClick={() => { onToggleVisibility(); setMobileOpen(false); }}>
            <EyeIcon hidden={shouldReveal} /><span>{shouldReveal ? "Show" : "Hide"}</span>
          </button>
          <button type="button" disabled={!hasDrawings} className="is-danger" onClick={() => { onClear(); setMobileOpen(false); }}>
            <ClearIcon /><span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
}
