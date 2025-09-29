"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const Game = dynamic(() => import("../components/GameCanvas"), { ssr: false });

export default function Page() {
  const [color, setColor] = useState("#FFCC00");
  const [started, setStarted] = useState(false);
  const valid = useMemo(() => /^#([0-9a-fA-F]{6})$/.test(color), [color]);
  const pickRandom = () => {
    const rnd = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
    setColor(`#${rnd()}${rnd()}${rnd()}`);
  };
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Flappy Multiplayer (Minimal)</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Press Space / Tap to flap</p>
        {!started && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Color</span>
              <input
                aria-label="Player color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#RRGGBB"
                style={{ padding: 6, borderRadius: 4, border: "1px solid #475569", width: 100 }}
              />
              <span
                aria-hidden
                title={valid ? "preview" : "invalid color"}
                style={{ width: 20, height: 20, background: valid ? color : "transparent", border: "1px solid #334155", borderRadius: 3 }}
              />
            </label>
            <button
              type="button"
              onClick={pickRandom}
              style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #475569", background: "#64748b", color: "white" }}
            >
              Random
            </button>
            <button
              onClick={() => setStarted(true)}
              disabled={!valid}
              style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #475569", background: valid ? "#0ea5e9" : "#334155", color: "white" }}
            >
              Start
            </button>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          {started ? <Game width={800} height={600} color={valid ? color : undefined} /> : (
            <div style={{ width: 800, height: 600, display: "grid", placeItems: "center", border: "1px dashed #334155", borderRadius: 6, color: "#94a3b8" }}>
              Choose a valid color and press Start
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
