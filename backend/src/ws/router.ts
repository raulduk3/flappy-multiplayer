// T021: WebSocket router with handshake gate
import { WebSocket } from "ws";
import { validateMessage, extractType } from "./validation.ts";
import { handleCapabilitiesRequest } from "./handlers/capabilities.ts";
import { createInputState, handleInput } from "../server/handlers/input.ts";
import {
  createRunState,
  ensureRunStarted,
} from "../server/handlers/runLifecycle.ts";
import { handleEngrave } from "../server/handlers/engrave.ts";
import { ERRORS } from "./errors.ts";
import { log } from "./log.ts";

interface ConnectionState {
  welcomed: boolean;
  protocolVersion: string | null;
  input: ReturnType<typeof createInputState>;
  run: ReturnType<typeof createRunState>;
}

const SERVER_PROTOCOL_VERSION = "1.0.0"; // TODO: centralize

export function attachRouter(ws: WebSocket, state: ConnectionState) {
  ws.on("message", (data: any) => {
    let parsed: any;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      log.warn("invalid_json", { raw: data.toString().slice(0, 100) });
      ws.send(
        JSON.stringify(
          ERRORS.validation(SERVER_PROTOCOL_VERSION, {
            reason: "invalid_json",
          }),
        ),
      );
      return;
    }

    // Pre-handshake: only allow 'hello' without full validation so we can emit proper unsupported_action
    if (!state.welcomed) {
      const preliminaryType = (parsed as any).type;
      if (preliminaryType !== "hello") {
        log.debug("pre_handshake_message", { type: preliminaryType });
        ws.send(
          JSON.stringify(
            ERRORS.unsupportedBeforeHandshake(SERVER_PROTOCOL_VERSION),
          ),
        );
        return;
      }
      // Validate the hello message now
      const { valid, errors } = validateMessage(parsed);
      if (!valid) {
        log.debug("validation_fail", { errors });
        ws.send(
          JSON.stringify(
            ERRORS.validation(SERVER_PROTOCOL_VERSION, { errors }),
          ),
        );
        return;
      }
      // Version compatibility check (MAJOR only for now)
      const clientVersion = (parsed as any).protocol_version as string;
      if (
        clientVersion.split(".")[0] !== SERVER_PROTOCOL_VERSION.split(".")[0]
      ) {
        log.info("incompatible_protocol", { clientVersion });
        ws.send(
          JSON.stringify(
            ERRORS.incompatibleProtocol(SERVER_PROTOCOL_VERSION, clientVersion),
          ),
        );
        return;
      }
      state.welcomed = true;
      state.protocolVersion = SERVER_PROTOCOL_VERSION;
      log.info("welcome_sent", {});
      ws.send(
        JSON.stringify({
          type: "welcome",
          protocol_version: SERVER_PROTOCOL_VERSION,
          server_info: { version: SERVER_PROTOCOL_VERSION },
        }),
      );
      // Defer runStart slightly so tests observe welcome first.
      setTimeout(() => {
        log.info("auto_run_start");
        ensureRunStarted(state.run, (m: any) => ws.send(JSON.stringify(m)));
      }, 0);
      return;
    }

    // Post-handshake validation for all other messages
    const { valid, errors } = validateMessage(parsed);
    if (!valid) {
      log.debug("validation_fail", { errors });
      ws.send(
        JSON.stringify(ERRORS.validation(SERVER_PROTOCOL_VERSION, { errors })),
      );
      return;
    }

    const type = extractType(parsed);

    switch (type as string) {
      case "capabilities_request": {
        const resp = handleCapabilitiesRequest(
          state.protocolVersion || SERVER_PROTOCOL_VERSION,
        );
        log.debug("capabilities_request");
        ws.send(JSON.stringify(resp));
        return;
      }
      case "input": {
        log.debug("input_received", { seq: parsed.seq });
        ensureRunStarted(state.run, (m: any) => ws.send(JSON.stringify(m)));
        handleInput(parsed, state.input, (err: any) =>
          ws.send(JSON.stringify(err)),
        );
        return;
      }
      case "engrave": {
        log.debug("engrave_received", { run_id: parsed.run_id });
        handleEngrave(
          parsed,
          (err: any) => ws.send(JSON.stringify(err)),
          (m: any) => ws.send(JSON.stringify(m)),
        );
        return;
      }
      default:
        log.warn("unsupported_action", { type });
        ws.send(
          JSON.stringify(
            ERRORS.unsupportedBeforeHandshake(SERVER_PROTOCOL_VERSION),
          ),
        );
    }
  });
}

export function createConnectionState(): ConnectionState {
  return {
    welcomed: false,
    protocolVersion: null,
    input: createInputState(),
    run: createRunState(),
  };
}
