// T023: Error mapping utilities
export type ErrorCode =
  | "validation_error"
  | "rate_limit_exceeded"
  | "incompatible_protocol"
  | "unauthorized"
  | "internal_error"
  | "bad_request"
  | "resource_exhausted"
  | "not_found"
  | "conflict"
  | "unsupported_action";

export interface ProtocolError {
  type: "error";
  protocol_version: string;
  code: ErrorCode;
  message: string;
  details?: any;
  upgrade_hint?: string;
}

export function makeError(
  protocol_version: string,
  code: ErrorCode,
  message: string,
  details?: any,
): ProtocolError {
  return {
    type: "error",
    protocol_version,
    code,
    message,
    ...(details ? { details } : {}),
  };
}

export const ERRORS = {
  unsupportedBeforeHandshake: (version: string) =>
    makeError(
      version,
      "unsupported_action",
      "Message not allowed before handshake",
    ),
  incompatibleProtocol: (serverVersion: string, clientVersion: string) =>
    makeError(
      serverVersion,
      "incompatible_protocol",
      "Incompatible protocol version",
      { clientVersion },
    ),
  validation: (version: string, details: any) =>
    makeError(version, "validation_error", "Validation failed", details),
};
