"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPipesAtTick, getPipeSpacingPx } from "../lib/track";
import type { ActivePlayerState, SnapshotPayload } from "../../shared/types";
import { connect } from "../lib/net";

type Props = { width: number; height: number };

export default function GameCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [players, setPlayers] = useState<ActivePlayerState[]>([]);
  const [localRunId, setLocalRunId] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = connect({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onJoinAck: (payload: { room_id: string; seed: string }) => setSeed(payload.seed),
      onSnapshot: (payload: SnapshotPayload) => {
        setSeed(payload.seed);
        setTick(payload.tick);
        setPlayers(payload.players);
      },
      onRunStart: (payload: { room_id: string; run_id: string; tick: number }) => {
        setLocalRunId(payload.run_id);
      },
      onRunEnd: () => {
        // Reset local run so camera snaps back to start and doesn't follow others
        setLocalRunId(null);
      },
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("flap"));
      }
    };
    window.addEventListener("keydown", onKey);
    const onTap = () => window.dispatchEvent(new CustomEvent("flap"));
    window.addEventListener("click", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onTap);
      cleanup?.();
    };
  }, []);

  // Derive the local player entity for the active run if known (by run_id)
  const localPlayer = useMemo(() => {
    if (!localRunId) return undefined;
    return players.find((p) => p.run_id === localRunId);
  }, [players, localRunId]);

  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    // Resize backing store for crisp rendering
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      // Background
      ctx.fillStyle = "#0e1520";
      ctx.fillRect(0, 0, width, height);
      
      // World scaling to match server-side WORLD_HEIGHT
      const WORLD_H = 600;
      const sY = height / WORLD_H;
      // Camera: anchor only to local player's distance; otherwise stay at origin (don't follow others)
  const LEAD_IN = 160; // pixels of space ahead of player on the left side
      const camX = localPlayer ? localPlayer.distance : 0;

      // Determine how many pipes to render so they fill the screen width
      const spacingPx = getPipeSpacingPx();
  const countAfter = Math.ceil((width + LEAD_IN) / spacingPx) + 2;
  const countBefore = 3; // a bit more history so pipes don't drop too early

      if (seed) {
        const pipes = getPipesAtTick(seed, tick, { worldHeight: WORLD_H, countBefore, countAfter, baseDistance: camX });
        for (const p of pipes) {
          const screenX = Math.round(LEAD_IN + (p.x - camX));
          // Cull if completely off screen (non-strict to avoid early pop)
          if (screenX + p.width <= 0 || screenX >= width) continue;
          const topH = (p.gapCenterY - p.gapHeight / 2) * sY;
          const botY = (p.gapCenterY + p.gapHeight / 2) * sY;
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(screenX, 0, p.width, topH);
          ctx.fillRect(screenX, botY, p.width, height - botY);
        }
      }

      // Draw players relative to camera
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const labelPx = Math.max(10, Math.round(12 * (height / 600)));
      ctx.font = `${labelPx}px system-ui`;
      for (const pl of players) {
        const x = Math.round(LEAD_IN + (pl.distance - camX));
        const y = pl.position.y * (height / 600);
        // Avatar
        const isLocal = localPlayer && pl.run_id === localPlayer.run_id;
        ctx.fillStyle = isLocal ? "#fbbf24" : "#60a5fa";
        const aw = Math.max(16, Math.round(24 * (height / 600)));
        const ah = Math.max(12, Math.round(18 * (height / 600)));
        ctx.fillRect(x, y, aw, ah);
        // Label above avatar
        const label = (pl.player_id || "?").slice(0, 6);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillText(label, x + Math.round(aw / 2), y - 4);
      }

      // If we don't yet have a local player from snapshots, render a placeholder
      if (!localPlayer) {
        const aw = Math.max(16, Math.round(24 * (height / 600)));
        const ah = Math.max(12, Math.round(18 * (height / 600)));
        const x = Math.round(LEAD_IN);
        const y = Math.round((WORLD_H * 0.4) * sY);
        ctx.fillStyle = "#fbbf24"; // highlight color for local placeholder
        ctx.fillRect(x, y, aw, ah);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillText("You", x + Math.round(aw / 2), y - 4);
      }

      // HUD (render last to ensure it's on top)
      const status = connected ? "Connected" : "Connecting...";
      const hudLines: string[] = [status];
      const me = localPlayer;
      if (me) {
        const dist = Math.max(0, Math.floor(me.distance));
        const score = me.score ?? 0;
        hudLines.push(`Score: ${score}`);
        hudLines.push(`Dist: ${dist}px`);
      }
      const lineH = 18;
      const pad = 8;
      const hudW = 160;
      const hudH = hudLines.length * lineH + pad * 2 - 4;
      // backdrop for readability
      ctx.fillStyle = "rgba(2,6,23,0.6)";
      ctx.fillRect(8, 8, hudW, hudH);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px system-ui";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      let yOff = 8 + pad - 2;
      for (const line of hudLines) {
        ctx.fillText(line, 12, yOff);
        yOff += lineH;
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [width, height, seed, tick, players, connected, localRunId]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
