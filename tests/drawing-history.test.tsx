// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { TradingChart, type ChartDrawing, type TradingChartHandle } from "../src";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, configurable: true });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, configurable: true });

const drawing: ChartDrawing = {
  id: "line-1",
  type: "horizontal-line",
  points: [{ time: 1_700_000_000_000, price: 100 }],
};

describe("drawing history API", () => {
  it("can undo and redo a clear operation", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const ref = createRef<TradingChartHandle>();
    const onDrawingsChange = vi.fn();

    await act(async () => {
      root.render(<TradingChart ref={ref} data={[]} defaultDrawings={[drawing]} onDrawingsChange={onDrawingsChange} />);
    });

    act(() => ref.current?.clearDrawings());
    expect(onDrawingsChange).toHaveBeenLastCalledWith([]);

    act(() => ref.current?.undo());
    expect(onDrawingsChange).toHaveBeenLastCalledWith([drawing]);

    act(() => ref.current?.redo());
    expect(onDrawingsChange).toHaveBeenLastCalledWith([]);

    act(() => root.unmount());
  });

  it("exposes controlled drawing visibility", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const ref = createRef<TradingChartHandle>();
    const onVisibilityChange = vi.fn();

    await act(async () => {
      root.render(<TradingChart ref={ref} data={[]} onDrawingsVisibilityChange={onVisibilityChange} />);
    });
    act(() => ref.current?.setDrawingsVisible(false));
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
    act(() => root.unmount());
  });
});
