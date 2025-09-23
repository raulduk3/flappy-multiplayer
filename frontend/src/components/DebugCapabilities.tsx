// T031: DebugCapabilities component showing supported features
import React from 'react';
import {useCapabilities} from '../hooks/useCapabilities';

interface Props {
  url: string;
  protocolVersion: string;
}

export const DebugCapabilities: React.FC<Props> = ({url, protocolVersion}) => {
  const {supported, error, welcomeVersion} = useCapabilities({url, protocolVersion});

  return (
    <div style={{fontFamily: 'monospace', background: '#111', color: '#eee', padding: '0.5rem', border: '1px solid #333'}}>
      <div><strong>Protocol Debug</strong></div>
      <div>Welcome Version: {welcomeVersion || '...'}</div>
      <div>Capabilities: {supported ? supported.join(', ') : '...'}</div>
      {error && <div style={{color:'#f66'}}>Error: {error}</div>}
    </div>
  );
};
