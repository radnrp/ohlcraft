import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme, resolveTheme } from "../src/core/theme";

describe("advanced themes", () => {
  it("deep-merges nested theme groups without losing preset defaults", () => {
    const theme = resolveTheme({
      candlestick: { bullishBody: "#00ff88", wickWidth: 3 },
      gridStyle: { vertical: { visible: false } },
    });

    expect(theme.candlestick.bullishBody).toBe("#00ff88");
    expect(theme.candlestick.wickWidth).toBe(3);
    expect(theme.candlestick.bearishBody).toBe(darkTheme.candlestick.bearishBody);
    expect(theme.gridStyle.vertical.visible).toBe(false);
    expect(theme.gridStyle.horizontal).toEqual(darkTheme.gridStyle.horizontal);
  });

  it("maps legacy flat colors to advanced groups", () => {
    const theme = resolveTheme({ bullish: "lime", grid: "#123456", accent: "violet" });
    expect(theme.candlestick.bullishBody).toBe("lime");
    expect(theme.candlestick.bullishWick).toBe("lime");
    expect(theme.gridStyle.horizontal.color).toBe("#123456");
    expect(theme.series.lineColor).toBe("violet");
  });

  it("lets nested values win over legacy aliases", () => {
    const theme = resolveTheme({
      bullish: "lime",
      candlestick: { bullishBody: "cyan" },
      accent: "violet",
      series: { lineColor: "gold" },
    });
    expect(theme.candlestick.bullishBody).toBe("cyan");
    expect(theme.candlestick.bullishWick).toBe("lime");
    expect(theme.series.lineColor).toBe("gold");
  });

  it("returns complete built-in presets", () => {
    expect(resolveTheme("dark")).toBe(darkTheme);
    expect(resolveTheme("light")).toBe(lightTheme);
    expect(lightTheme.backgroundStyle.type).toBe("gradient");
  });
});
