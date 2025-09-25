import { logDuplicateInput, logStaleSnapshot } from "../../services/log";

describe("Diagnostic logging (FR-022)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("logs warning for stale snapshots", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    logStaleSnapshot({ serverTick: 100, lastAppliedTick: 120 });
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toMatch(/stale_snapshot/i);
  });

  it("logs info for duplicate inputs", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    logDuplicateInput({ seq: 10, lastAppliedSeq: 12 });
    expect(info).toHaveBeenCalled();
    expect(info.mock.calls[0][0]).toMatch(/duplicate_input/i);
  });
});
