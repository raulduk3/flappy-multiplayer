// T022: Capabilities handler
import { ProtocolError, makeError } from "../errors.ts";

export interface CapabilitiesResponse {
  type: "capabilities_response";
  protocol_version: string;
  supported_features: string[];
}

const SUPPORTED_FEATURES = ["snapshot", "runStart", "runEnd", "capabilities"];

export function handleCapabilitiesRequest(
  protocol_version: string,
): CapabilitiesResponse | ProtocolError {
  return {
    type: "capabilities_response",
    protocol_version,
    supported_features: SUPPORTED_FEATURES,
  };
}

export function getSupportedFeatures() {
  return SUPPORTED_FEATURES.slice();
}
