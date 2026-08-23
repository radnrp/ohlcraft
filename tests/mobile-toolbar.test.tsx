// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { TradingChart } from "../src";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, configurable: true });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, configurable: true });

function findButton(container: ParentNode, label: string): HTMLButtonElement {
  const button = [...container.querySelectorAll<HTMLButtonElement>("button")]
    .find((item) => item.textContent?.trim() === label);
  if (!button) throw new Error(`Button "${label}" was not found`);
  return button;
}

describe("compact mobile toolbar", () => {
  it("keeps every control available through compact panels", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onToolChange = vi.fn();
    const onChartTypeChange = vi.fn();
    const onTimeframeChange = vi.fn();

    await act(async () => {
      root.render(
        <TradingChart
          data={[]}
          onToolChange={onToolChange}
          onChartTypeChange={onChartTypeChange}
          onTimeframeChange={onTimeframeChange}
        />,
      );
    });

    const mobileDock = host.querySelector<HTMLElement>(".rtc-mobile-toolbar-content")!;
    expect(mobileDock.querySelectorAll(":scope > button")).toHaveLength(4);

    await act(async () => findButton(mobileDock, "Crosshair").click());
    let panel = host.querySelector<HTMLElement>(".rtc-mobile-panel")!;
    expect(panel.querySelectorAll(".rtc-mobile-tool-grid > button")).toHaveLength(12);
    await act(async () => findButton(panel, "Rectangle").click());
    expect(onToolChange).toHaveBeenLastCalledWith("rectangle");
    expect(host.querySelector(".rtc-mobile-panel")).toBeNull();

    await act(async () => findButton(mobileDock, "Candles").click());
    panel = host.querySelector<HTMLElement>(".rtc-mobile-panel")!;
    await act(async () => findButton(panel, "Line").click());
    expect(onChartTypeChange).toHaveBeenLastCalledWith("line");

    const timeframeButton = mobileDock.querySelector<HTMLButtonElement>('button[aria-label^="Timeframe:"]')!;
    await act(async () => timeframeButton.click());
    panel = host.querySelector<HTMLElement>(".rtc-mobile-panel")!;
    await act(async () => findButton(panel, "1D").click());
    expect(onTimeframeChange).toHaveBeenLastCalledWith("1d");

    await act(async () => findButton(mobileDock, "More").click());
    expect(host.querySelector(".rtc-mobile-panel")).not.toBeNull();
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(host.querySelector(".rtc-mobile-panel")).toBeNull();

    act(() => root.unmount());
  });

  it("collapses drawing history into one mobile entry point", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(async () => root.render(
      <TradingChart data={[{ time: 1_700_000_000_000, open: 100, high: 106, low: 98, close: 104 }]} />,
    ));

    expect(host.querySelector(".rtc-legend")).toBeNull();
    const trigger = host.querySelector<HTMLButtonElement>(".rtc-history-mobile-trigger")!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(host.querySelectorAll(".rtc-history-mobile-panel button")).toHaveLength(4);

    act(() => root.unmount());
  });
});
