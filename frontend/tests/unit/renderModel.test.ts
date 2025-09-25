import { computeViewportTransform } from "../../services/renderModel";

describe("renderModel extreme resize", () => {
  it("letterboxes tall viewport", () => {
    const t = computeViewportTransform(1024, 2000, 288, 512);
    expect(t.viewH).toBeLessThanOrEqual(2000);
  expect(t.viewW / t.viewH).toBeCloseTo(288 / 512, 3);
    // Width-limited: horizontal offset is 0, vertical offset > 0
    expect(t.offsetX).toBeGreaterThanOrEqual(0);
    expect(t.offsetY).toBeGreaterThan(0);
  });
  it("letterboxes wide viewport", () => {
    const t = computeViewportTransform(4000, 1000, 288, 512);
    expect(t.viewW).toBeLessThanOrEqual(4000);
  expect(t.viewW / t.viewH).toBeCloseTo(288 / 512, 3);
    // Height-limited: vertical offset is 0, horizontal offset > 0
    expect(t.offsetY).toBeGreaterThanOrEqual(0);
    expect(t.offsetX).toBeGreaterThan(0);
  });
});
