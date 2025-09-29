import type { SnapshotPayload, LeaderboardUpdatePayload, Participant } from "../../shared/types";

interface Handlers {
  onOpen?: () => void;
  onClose?: () => void;
  onJoinAck?: (payload: { room_id: string; seed: string; color: string }) => void;
  onSnapshot?: (payload: SnapshotPayload) => void;
  onRunStart?: (payload: { room_id: string; run_id: string; tick: number }) => void;
  onRunEnd?: (payload: { room_id: string; run_id: string; final_distance: number; final_score: number; reason: string }) => void;
  onParticipants?: (list: Participant[]) => void;
  onLeaderboard?: (payload: LeaderboardUpdatePayload) => void;
}

// Minimal WebSocket client that follows the protocol envelope.
export function connect(h: Handlers, opts?: { color?: string }) {
  // Dev: npm run client:dev sets NEXT_PUBLIC_WS_URL=ws://localhost:3001
  // Fallback for ad-hoc runs: ws://localhost:3000 unless overridden
  const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";
  const ws = new WebSocket(url);

  const send = (obj: any) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(obj));

  ws.addEventListener("open", () => {
    h.onOpen?.();
    // Join immediately
    const payload: any = {};
    if (opts?.color) payload.color = opts.color;
    send({ protocol_version: "1", type: "join.request", payload });
  });
  ws.addEventListener("close", () => h.onClose?.());
  ws.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(ev.data.toString());
      const type = msg?.type;
      const payload = msg?.payload;
      if (type === "join.ack") h.onJoinAck?.(payload);
      else if (type === "snapshot.event") {
        h.onSnapshot?.(payload);
        if (Array.isArray(payload?.participants)) h.onParticipants?.(payload.participants);
      }
      else if (type === "runStart.event") h.onRunStart?.(payload);
      else if (type === "runEnd.event") h.onRunEnd?.(payload);
      else if (type === "leaderboardUpdate.event") h.onLeaderboard?.(payload);
    } catch {}
  });

  const onFlap = () => {
    send({ protocol_version: "1", type: "input.flap.request", payload: { nonce: Math.random().toString(36).slice(2) } });
  };
  window.addEventListener("flap", onFlap as any);

  return () => {
    window.removeEventListener("flap", onFlap as any);
    try { ws.close(); } catch {}
  };
}
