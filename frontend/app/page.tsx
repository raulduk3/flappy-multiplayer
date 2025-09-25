"use client";
import { useCapabilities } from "../hooks/useCapabilities";
import { Game } from "../components/Game";

export default function HomePage() {
  const wsUrl =
    (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_WS_URL) || "ws://localhost:19001/ws";

  const { state: connState, client } = useCapabilities({ url: wsUrl, protocolVersion: "1.0.0" });

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: 12 }}>
        <strong>Flappy Multiplayer</strong>
        <span style={{ marginLeft: 12, fontSize: 12, opacity: 0.7 }}>connection: {connState}</span>
      </header>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "80vmin", height: "80vmin", maxWidth: 800, maxHeight: 800, aspectRatio: "288 / 512" }}>
          <Game connectionState={connState} leaderboard={[]} client={client} />
        </div>
      </div>
    </main>
  );
}
