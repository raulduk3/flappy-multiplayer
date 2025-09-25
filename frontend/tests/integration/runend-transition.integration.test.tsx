import { initialState, reduce } from "../../services/gameState";

describe("Transition to engrave on runEnd (T010)", () => {
  it("moves from run to engrave for the same run_id", () => {
    const s0 = initialState();
    const start = {
      type: "runStart" as const,
      protocol_version: "1.0.0",
      run_id: "r-1",
      room_id: "room-1",
      player_id: "p-1",
      start_time: 1000,
    };
    const s1 = reduce(s0, start);
    expect(s1.mode).toBe("run");
    expect(s1.runId).toBe("r-1");

    const end = {
      type: "runEnd" as const,
      protocol_version: "1.0.0",
      run_id: "r-1",
      end_time: 2000,
      score: 3,
      cause: "collision" as const,
    };
    const s2 = reduce(s1, end);
    expect(s2.mode).toBe("engrave");
    expect(s2.runId).toBe("r-1");
  });

  it("ignores runEnd for a different run_id", () => {
    const s0 = { mode: "run" as const, runId: "r-1" };
    const end = {
      type: "runEnd" as const,
      protocol_version: "1.0.0",
      run_id: "r-2",
      end_time: 2000,
      score: 3,
      cause: "collision" as const,
    };
    const s1 = reduce(s0, end);
    expect(s1.mode).toBe("run");
    expect(s1.runId).toBe("r-1");
  });
});
