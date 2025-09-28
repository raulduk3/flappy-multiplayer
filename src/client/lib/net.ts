import type { SnapshotPayload } from "../../shared/types";

interface Handlers {
  onOpen?: () => void;
  onClose?: () => void;
  onJoinAck?: (payload: { room_id: string; seed: string }) => void;
  onSnapshot?: (payload: SnapshotPayload) => void;
  onRunStart?: (payload: { room_id: string; run_id: string; tick: number }) => void;
  onRunEnd?: (payload: { room_id: string; run_id: string; final_distance: number; final_score: number; reason: string }) => void;
}

export function connect(h: Handlers) {
  // In dev, assume server on ws://localhost:3001
  const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const ws = new WebSocket(url);

  const send = (obj: any) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(obj));

  ws.addEventListener("open", () => {
    h.onOpen?.();
    // Join immediately
    send({ protocol_version: "1", type: "join.request", payload: {} });
  });
  ws.addEventListener("close", () => h.onClose?.());
  ws.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(ev.data.toString());
      const type = msg?.type;
      const payload = msg?.payload;
      if (type === "join.ack") h.onJoinAck?.(payload);
      else if (type === "snapshot.event") h.onSnapshot?.(payload);
      else if (type === "runStart.event") h.onRunStart?.(payload);
      else if (type === "runEnd.event") h.onRunEnd?.(payload);
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
