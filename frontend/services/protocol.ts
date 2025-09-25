// T029: Frontend protocol service for handshake + capabilities discovery
// Minimal implementation using browser WebSocket.

export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

export interface ProtocolEvents {
  onWelcome?: (msg: WelcomeMessage) => void;
  onCapabilities?: (msg: CapabilitiesResponse) => void;
  onError?: (msg: ErrorMessage) => void;
  onOpen?: () => void;
  onClose?: (ev?: CloseEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
  onSnapshot?: (msg: SnapshotMessage) => void;
}

export interface WelcomeMessage {
  type: "welcome";
  protocol_version: string;
  server_info?: Record<string, unknown>;
}
export interface CapabilitiesResponse {
  type: "capabilities_response";
  protocol_version: string;
  supported_features: string[];
}
export interface ErrorMessage {
  type: "error";
  protocol_version: string;
  code: string;
  message: string;
}

export interface PlayerStateMessage {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "idle" | "alive" | "dead";
}
export interface PipesWindowMessage {
  x: number[];
  gapY: number[];
  gapH: number[];
  id: string[];
}
export interface LeaderboardEntryMessage {
  player_id: string;
  name: string;
  score: number;
  rank: number;
  at: number;
}
export interface SnapshotMessage {
  type: "snapshot";
  protocol_version: string;
  server_tick: number;
  players: PlayerStateMessage[];
  pipes_window: PipesWindowMessage;
  leaderboard_topN: LeaderboardEntryMessage[];
}

type InboundMessage = WelcomeMessage | CapabilitiesResponse | ErrorMessage | SnapshotMessage;
type OutboundMessage =
  | { type: "hello"; protocol_version: string; client_info?: Record<string, unknown> }
  | { type: "capabilities_request"; protocol_version: string }
  | { type: "engrave"; protocol_version: string; run_id: string; name: string }
  | { type: "input"; protocol_version: string; seq: number; action: "flap" | "start" | "join"; ts: number };

export class ProtocolClient {
  private ws: WebSocket | null = null;
  private version: string;
  private events: ProtocolEvents;
  private capabilities: string[] = [];
  private welcomed = false;
  private state: ConnectionState = "idle";
  private snapshotListeners = new Set<(msg: SnapshotMessage) => void>();

  constructor(version: string, events: ProtocolEvents = {}) {
    this.version = version;
    this.events = events;
  }

  getSupportedFeatures() {
    return this.capabilities;
  }

  getState(): ConnectionState {
    return this.state;
  }

  connect(url: string) {
    this.setState("connecting");
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.setState("open");
      this.events.onOpen?.();
      this.send({
        type: "hello",
        protocol_version: this.version,
        client_info: { client: "frontend", version: "0.1.0" },
      });
    };
    this.ws.onmessage = (ev) => this.handleMessage(ev.data);
    this.ws.onerror = () => {
      this.setState("error");
      // optionally surface additional info via onError from server message
    };
    this.ws.onclose = (ev) => {
      this.setState("closed");
      this.events.onClose?.(ev);
    };
  }

  close(code?: number, reason?: string) {
    if (!this.ws) return;
    this.setState("closing");
    this.ws.close(code, reason);
  }

  private handleMessage(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (typeof data !== "string") return; // expect server to send text frames
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!isInboundMessage(parsed)) return;
    const msg = parsed;
    switch (msg.type) {
      case "welcome":
        this.welcomed = true;
        this.events.onWelcome?.(msg);
        // Immediately request capabilities
        this.send({
          type: "capabilities_request",
          protocol_version: this.version,
        });
        break;
      case "capabilities_response":
        this.capabilities = msg.supported_features || [];
        this.events.onCapabilities?.(msg);
        break;
      case "snapshot":
  this.events.onSnapshot?.(msg);
  this.snapshotListeners.forEach((cb) => cb(msg));
        break;
      case "error":
        this.events.onError?.(msg);
        break;
    }
  }

  sendEngrave(runId: string, name: string) {
    this.send({ type: "engrave", protocol_version: this.version, run_id: runId, name });
  }

  sendInput(msg: { protocol_version: string; seq: number; action: "flap" | "start" | "join"; ts: number }) {
    this.send({ type: "input", protocol_version: msg.protocol_version, seq: msg.seq, action: msg.action, ts: Math.floor(msg.ts) });
  }

  private send(obj: OutboundMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  addSnapshotListener(cb: (msg: SnapshotMessage) => void) {
    this.snapshotListeners.add(cb);
  }
  removeSnapshotListener(cb: (msg: SnapshotMessage) => void) {
    this.snapshotListeners.delete(cb);
  }

  private setState(next: ConnectionState) {
    this.state = next;
    this.events.onStateChange?.(next);
  }
}

function isInboundMessage(v: unknown): v is InboundMessage {
  if (!v || typeof v !== "object") return false;
  const t = (v as { type?: unknown }).type;
  if (t !== "welcome" && t !== "capabilities_response" && t !== "error" && t !== "snapshot") return false;
  return true;
}
