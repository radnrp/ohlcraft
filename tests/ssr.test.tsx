import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { TradingChart } from "../src";

describe("SSR boundary", () => {
  it("can be imported and rendered without browser globals", () => {
    const html = renderToString(
      <TradingChart
        data={[{ time: 1_700_000_000, open: 10, high: 12, low: 9, close: 11 }]}
        showToolbar={false}
      />,
    );
    expect(html).toContain("Interactive financial chart");
    expect(html).toContain("canvas");
  });
});
