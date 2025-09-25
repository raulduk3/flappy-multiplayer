import { InputQueue } from "../../services/inputQueue";

describe("Connection states and input queuing (T007)", () => {
  it("queues while closed and flushes in order on reconnect; ignores stale acks", () => {
    const q = new InputQueue("1.0.0");
    const sent: number[] = [];

    // Disconnected: queue flaps
    const t0 = 1000;
    q.queue(q.makeFlap(t0 + 1));
    q.queue(q.makeFlap(t0 + 2));
    q.queue(q.makeFlap(t0 + 3));

    // Reconnect: flush
    q.flush((m) => sent.push(m.seq));
    expect(sent).toEqual([1, 2, 3]);

    // Receive stale ack for seq 2 (should not regress lastApplied)
    q.markApplied(2);
    // Queue next flap
    q.queue(q.makeFlap(t0 + 4));
    // Duplicate older seq should be dropped when marked applied with higher seq
    q.markApplied(3);
    q.flush((m) => sent.push(m.seq));

    expect(sent).toEqual([1, 2, 3, 4]);
  });
});
