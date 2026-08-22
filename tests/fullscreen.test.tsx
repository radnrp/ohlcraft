// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TradingChart } from "../src";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, configurable: true });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, configurable: true });

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.overscrollBehavior = "";
  document.documentElement.style.overflow = "";
});

function renderChart() {
  const host = document.createElement("div");
  document.body.append(host);
  const reactRoot = createRoot(host);
  act(() => reactRoot.render(<TradingChart data={[]} />));
  const chart = host.querySelector<HTMLElement>(".rtc-root")!;
  const button = host.querySelector<HTMLButtonElement>('button[aria-label="Fullscreen"]')!;
  return {
    chart,
    button,
    unmount: () => act(() => {
      reactRoot.unmount();
      host.remove();
    }),
  };
}

describe("fullscreen", () => {
  it("fills the in-app viewport and restores page scrolling", async () => {
    const view = renderChart();

    await act(async () => view.button.click());
    expect(view.chart.dataset.fullscreen).toBe("in-app");
    expect(document.body.style.overflow).toBe("hidden");
    expect(view.button.getAttribute("aria-pressed")).toBe("true");

    await act(async () => view.button.click());
    expect(view.chart.dataset.fullscreen).toBeUndefined();
    expect(document.body.style.overflow).toBe("");
    view.unmount();
  });

  it("exits in-app fullscreen when Escape is pressed", async () => {
    const view = renderChart();

    await act(async () => view.button.click());
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));

    expect(view.chart.dataset.fullscreen).toBeUndefined();
    expect(document.body.style.overflow).toBe("");
    view.unmount();
  });
});
