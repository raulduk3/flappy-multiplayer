import React, { useEffect, useRef, useReducer, useState } from "react";
import { drawBackground, drawBounds, drawSnapshot } from "../services/draw";
import { EngraveForm } from "./EngraveForm";
import { initialState, reduce } from "../services/gameState";
import { Leaderboard, type LeaderboardEntry } from "./Leaderboard";
import { ConnectionIndicator } from "./ConnectionIndicator";
import type { ConnectionState, ProtocolClient, SnapshotMessage } from "../services/protocol";
import { predictWithCap, type PhysicsState } from "../services/prediction";
import { reconcile } from "../services/reconciliation";
import { InputQueue } from "../services/inputQueue";

const LOGICAL_WIDTH = 288;
const LOGICAL_HEIGHT = 512;

export const Game: React.FC<{ connectionState?: ConnectionState; leaderboard?: LeaderboardEntry[]; client?: ProtocolClient | null }> = ({ connectionState = "idle", leaderboard = [], client = null }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [gs, dispatch] = useReducer(reduce, undefined, initialState);
  const [leader, setLeader] = useState<LeaderboardEntry[]>(leaderboard);
  const authRef = useRef<{ tick: number; player?: PhysicsState } | null>(null);
  const predictedRef = useRef<PhysicsState | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const iqRef = useRef<InputQueue | null>(null);

  // Subscribe to snapshots (T022)
  useEffect(() => {
    if (!client) return;
    const onSnap = (msg: SnapshotMessage) => {
      // Update leaderboard overlay
      setLeader(
        msg.leaderboard_topN.map((e) => ({ player_id: e.player_id, name: e.name, score: e.score, run_id: undefined, elapsed_ms: undefined })),
      );
      // Track local player (assume first if unknown)
      const me = msg.players.find((p) => p.id === "local") ?? msg.players[0];
      if (me) {
        authRef.current = { tick: msg.server_tick, player: { x: me.x, y: me.y, vx: me.vx, vy: me.vy } };
        predictedRef.current = { x: me.x, y: me.y, vx: me.vx, vy: me.vy };
      }
    };
    client.addSnapshotListener(onSnap);
    return () => client.removeSnapshotListener(onSnap);
  }, [client]);

  // Render loop with dt clamp + prediction + reconciliation (T024)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (t: number) => {
      const last = lastTsRef.current ?? t;
      let dt = t - last;
      lastTsRef.current = t;
      // Clamp dt to 50ms
      dt = Math.min(dt, 50);

      drawBackground(ctx, canvas);
      drawBounds(ctx, canvas.width, canvas.height, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Build a minimal snapshot-like structure for drawSnapshot
      const ground = [{ x: 0, y: LOGICAL_HEIGHT - 20, w: LOGICAL_WIDTH, h: 20, color: "#334155" }];
      let px = 50;
      let py = 200;
      if (authRef.current?.player) {
        const predicted = predictedRef.current ?? authRef.current.player;
        const { state } = predictWithCap(predicted, dt, { capMs: 150, clampMs: 50 });
        predictedRef.current = state;
        const rec = reconcile(state, authRef.current.player, 10);
        px = rec.reconciled.x;
        py = rec.reconciled.y;
        predictedRef.current = rec.reconciled;
      }

      drawSnapshot(
        ctx,
        canvas,
        { w: LOGICAL_WIDTH, h: LOGICAL_HEIGHT },
        { track: ground, players: [{ id: "local", x: px, y: py, w: 10, h: 10, color: "#f59e0b" }] },
      );

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, []);

  // Initialize input queue when client/version available
  useEffect(() => {
    if (!client) return;
    if (!iqRef.current) iqRef.current = new InputQueue("1.0.0");
  }, [client]);

  // Flush queued inputs when connection opens
  useEffect(() => {
    if (!client || !iqRef.current) return;
    if (connectionState === "open") {
      iqRef.current.flush((m) => client.sendInput(m));
    }
  }, [connectionState, client]);

  // Basic input handlers (space/click to flap)
  useEffect(() => {
    const handleFlap = (ts: number) => {
      if (!iqRef.current) return;
      const msg = iqRef.current.makeFlap(ts);
      if (connectionState === "open" && client) {
        client.sendInput(msg);
      } else {
        iqRef.current.queue(msg);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlap(performance.now());
      }
    };
    const onClick = () => handleFlap(performance.now());
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [connectionState, client]);

  // Resize with DPR for crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Placeholder callbacks to simulate transitions (can be removed when wired to protocol)
  const simulateRunStart = () => {
    dispatch({
      type: "runStart",
      protocol_version: "1.0.0",
      run_id: `r-${Date.now()}`,
      room_id: "room-1",
      player_id: "local",
      start_time: Date.now(),
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
  <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
  <div aria-label="game-mode" role="status" aria-live="polite" style={{ position: "absolute", top: 8, left: 8, color: "#e2e8f0", fontSize: 12 }}>Mode: {gs.mode}</div>
  <ConnectionIndicator state={connectionState} />
  <Leaderboard entries={leader} />
      {gs.mode === "pre-run" && (
        <div style={{ position: "absolute", bottom: 16, left: 16 }}>
          <button onClick={simulateRunStart} aria-label="start-run" disabled={connectionState !== "open"}>
            Start Run
          </button>
        </div>
      )}
      {gs.mode === "engrave" && gs.runId && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0b1020", padding: 16, border: "1px solid #334155", borderRadius: 8 }}>
            <EngraveForm
              runId={gs.runId}
              onSubmit={async (name) => {
                if (!client) return;
                client.sendEngrave(gs.runId!, name);
                // Transition back to pre-run is driven by server ack/state; left to integration tasks.
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
