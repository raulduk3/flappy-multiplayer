// T033: Unit tests for validation utility
import { validateMessage } from "../../src/ws/validation.ts";

describe("validateMessage", () => {
  test("valid hello passes", () => {
    const res = validateMessage({ type: "hello", protocol_version: "1.0.0" });
    expect(res.valid).toBe(true);
  });
  test("missing protocol_version fails", () => {
    const res = validateMessage({ type: "hello" } as any);
    expect(res.valid).toBe(false);
    expect(res.errors && res.errors.length).toBeGreaterThan(0);
  });
});
