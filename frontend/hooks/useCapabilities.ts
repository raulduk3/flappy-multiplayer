// T031: Hook to access protocol capabilities
import { useEffect, useRef, useState } from "react";
import { ProtocolClient, type ConnectionState } from "../services/protocol";

export interface UseCapabilitiesOptions {
  url: string;
  protocolVersion: string;
  autoConnect?: boolean;
}

export function useCapabilities(opts: UseCapabilitiesOptions) {
  const { url, protocolVersion, autoConnect = true } = opts;
  const clientRef = useRef<ProtocolClient | null>(null);
  const [supported, setSupported] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcomeVersion, setWelcomeVersion] = useState<string | null>(null);
  const [state, setState] = useState<ConnectionState>("idle");

  useEffect(() => {
    if (!autoConnect) return;
    const client = new ProtocolClient(protocolVersion, {
      onWelcome: (msg) => setWelcomeVersion(msg.protocol_version),
      onCapabilities: (msg) => setSupported(msg.supported_features),
      onError: (msg) => setError(`${msg.code}:${msg.message}`),
      onStateChange: (s) => setState(s),
    });
    clientRef.current = client;
    client.connect(url);
    return () => {
      client.close?.();
    };
  }, [url, protocolVersion, autoConnect]);

  return { supported, error, welcomeVersion, state, client: clientRef.current };
}
