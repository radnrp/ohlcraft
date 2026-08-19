import { describe, expect, it } from "vitest";
import { drawingLineDash } from "../src/core/render";

describe("drawing line styles", () => {
  it("maps solid, dashed, and dotted styles to canvas dash patterns", () => {
    expect(drawingLineDash("solid")).toEqual([]);
    expect(drawingLineDash("dashed")).toEqual([8, 6]);
    expect(drawingLineDash("dotted")).toEqual([1, 5]);
  });

  it("keeps older drawings solid when lineStyle is missing", () => {
    expect(drawingLineDash()).toEqual([]);
  });
});
