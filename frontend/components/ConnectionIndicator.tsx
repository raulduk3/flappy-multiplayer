import React from "react";
import type { ConnectionState } from "../services/protocol";

export const ConnectionIndicator: React.FC<{ state: ConnectionState }> = ({ state }) => {
  const color = state === "open" ? "#10b981" : state === "error" ? "#ef4444" : "#f59e0b";
  return (
    <div aria-label="connection-state" role="status" aria-live="polite" style={{ position: "absolute", top: 8, left: 8, color, fontSize: 12 }}>
      Connection: {state}
    </div>
  );
};
