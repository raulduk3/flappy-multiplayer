"use client";
import dynamic from "next/dynamic";

const Game = dynamic(() => import("../components/GameCanvas"), { ssr: false });

export default function Page() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Flappy Multiplayer (Minimal)</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Press Space / Tap to flap</p>
        <div style={{ marginTop: 12 }}>
          <Game width={800} height={600} />
        </div>
      </div>
    </main>
  );
}
