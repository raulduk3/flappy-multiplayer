import { computeViewportTransform } from "../../services/renderModel";

describe("Responsive scaling and aspect ratio (T009)", () => {
  it("fits 288x512 into 1024x768 with uniform scale and letterboxing", () => {
    const logical = { w: 288, h: 512 };
    const view = { w: 1024, h: 768 };
    const t = computeViewportTransform(view.w, view.h, logical.w, logical.h);
    expect(Math.round(t.scale * 1000) / 1000).toBe(1.5);
    expect(t.viewW).toBe(432);
    expect(t.viewH).toBe(768);
    expect(t.offsetX).toBe(296);
    expect(t.offsetY).toBe(0);
  });

  it("fits 288x512 into 800x1200 (tall) with letterboxing left/right", () => {
    const t = computeViewportTransform(800, 1200, 288, 512);
    const expectedScale = Math.min(800 / 288, 1200 / 512);
    expect(Math.round(t.scale * 1000) / 1000).toBeCloseTo(expectedScale, 3);
    expect(t.viewW).toBe(Math.floor(288 * expectedScale));
    expect(t.viewH).toBe(Math.floor(512 * expectedScale));
    expect(t.offsetX).toBe(Math.floor((800 - t.viewW) / 2));
    expect(t.offsetY).toBe(Math.floor((1200 - t.viewH) / 2));
  });
});
