// T031: Hook to access protocol capabilities
import {useEffect, useRef, useState} from 'react';
import {ProtocolClient} from '../services/protocol';

export interface UseCapabilitiesOptions {
  url: string;
  protocolVersion: string;
  autoConnect?: boolean;
}

export function useCapabilities(opts: UseCapabilitiesOptions) {
  const {url, protocolVersion, autoConnect = true} = opts;
  const clientRef = useRef<ProtocolClient | null>(null);
  const [supported, setSupported] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcomeVersion, setWelcomeVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect) return;
    const client = new ProtocolClient(protocolVersion, {
      onWelcome: (msg) => setWelcomeVersion(msg.protocol_version),
      onCapabilities: (msg) => setSupported(msg.supported_features),
      onError: (msg) => setError(`${msg.code}:${msg.message}`)
    });
    clientRef.current = client;
    client.connect(url);
    return () => {
      // Close socket if available
      // (ProtocolClient lacks explicit close; rely on browser GC or extend later.)
    };
  }, [url, protocolVersion, autoConnect]);

  return {supported, error, welcomeVersion};
}
