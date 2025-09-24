// T029: Frontend protocol service for handshake + capabilities discovery
// Minimal implementation using browser WebSocket.

export interface ProtocolEvents {
  onWelcome?: (msg: WelcomeMessage) => void;
  onCapabilities?: (msg: CapabilitiesResponse) => void;
  onError?: (msg: ErrorMessage) => void;
}

export interface WelcomeMessage {
  type: "welcome";
  protocol_version: string;
  server_info?: any;
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

export class ProtocolClient {
  private ws: WebSocket | null = null;
  private version: string;
  private events: ProtocolEvents;
  private capabilities: string[] = [];
  private welcomed = false;

  constructor(version: string, events: ProtocolEvents = {}) {
    this.version = version;
    this.events = events;
  }

  getSupportedFeatures() {
    return this.capabilities;
  }

  connect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.send({
        type: "hello",
        protocol_version: this.version,
        client_info: { client: "frontend", version: "0.1.0" },
      });
    };
    this.ws.onmessage = (ev) => this.handleMessage(ev.data);
    this.ws.onerror = () => {
      /* optionally surface */
    };
  }

  private handleMessage(data: any) {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
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
      case "error":
        this.events.onError?.(msg);
        break;
    }
  }

  private send(obj: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }
}
