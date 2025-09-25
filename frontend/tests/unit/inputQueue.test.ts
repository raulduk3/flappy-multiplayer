import { InputQueue } from "../../services/inputQueue";

describe("InputQueue edge cases", () => {
  it("drops duplicates and stale by seq", () => {
    const iq = new InputQueue("1.0.0");
    const m1 = iq.makeFlap(1000);
    const m2 = iq.makeFlap(1001);
    iq.queue(m1);
    iq.queue(m2);
    // Apply seq 2
    iq.markApplied(2);
    // Now queueing seq <=2 should be dropped
    iq.queue({ ...m1, seq: 1 });
    iq.queue({ ...m2, seq: 2 });
    expect(iq.getState().queued.map((m) => m.seq)).toEqual([]);
  });

  it("flushes in order, then clears queue", () => {
    const iq = new InputQueue("1.0.0");
    const m1 = iq.makeFlap(1000);
    const m3 = iq.makeFlap(1002);
    const m2 = { ...m3, seq: m3.seq - 1, ts: 1001 };
    iq.queue(m3);
    iq.queue(m1);
    iq.queue(m2);
    const sent: number[] = [];
    iq.flush((m) => sent.push(m.seq));
    expect(sent).toEqual(sent.slice().sort((a, b) => a - b));
    expect(iq.getState().queued).toHaveLength(0);
  });
});
