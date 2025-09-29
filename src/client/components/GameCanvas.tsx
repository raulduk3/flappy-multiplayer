"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPipesAtTick, getPipeSpacingPx } from "../lib/track";
import type { ActivePlayerState, LeaderboardEntry, Participant, SnapshotPayload } from "../../shared/types";
import { connect } from "../lib/net";

type Props = { width: number; height: number; color?: string };

export default function GameCanvas({ width, height, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [players, setPlayers] = useState<ActivePlayerState[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [localRunId, setLocalRunId] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [localColor, setLocalColor] = useState<string | undefined>(color);

  useEffect(() => {
    const cleanup = connect({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onJoinAck: (payload: { room_id: string; seed: string; color: string }) => {
        setSeed(payload.seed);
        if (/^#([0-9a-fA-F]{6})$/.test(payload.color)) setLocalColor(payload.color);
      },
      onSnapshot: (payload: SnapshotPayload) => {
        setSeed(payload.seed);
        setTick(payload.tick);
        setPlayers(payload.players);
      },
      onParticipants: (list) => setParticipants(list),
      onRunStart: (payload: { room_id: string; run_id: string; tick: number }) => {
        setLocalRunId(payload.run_id);
        setLastRunId(payload.run_id);
      },
      onRunEnd: () => {
        // Reset local run so camera snaps back to start and doesn't follow others
        setLocalRunId(null);
      },
      onLeaderboard: (p) => setLeaderboard(p.entries),
    }, { color });
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
        // Prefer player color if provided; otherwise use default blue/yellow
        ctx.fillStyle = pl.color || (isLocal ? "#fbbf24" : "#60a5fa");
        const aw = Math.max(16, Math.round(24 * (height / 600)));
        const ah = Math.max(12, Math.round(18 * (height / 600)));
        ctx.fillRect(x, y, aw, ah);
        // Label above avatar
        const label = isLocal
          ? (pl.run_id ? pl.run_id.slice(0, 10) : "You")
          : (pl.player_id || "?").slice(0, 6);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillText(label, x + Math.round(aw / 2), y - 4);
      }

      // If we don't yet have a local player from snapshots, render a placeholder
      if (!localPlayer) {
        const aw = Math.max(16, Math.round(24 * (height / 600)));
        const ah = Math.max(12, Math.round(18 * (height / 600)));
        const x = Math.round(LEAD_IN);
        const y = Math.round((WORLD_H * 0.4) * sY);
        ctx.fillStyle = localColor || "#fbbf24"; // use chosen color while idle
        ctx.fillRect(x, y, aw, ah);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillText("You", x + Math.round(aw / 2), y - 4);
      }

      // Compute a realtime leaderboard from participants (active only), enriched with players for score/color
      const playersById = new Map(players.map((pl) => [pl.player_id, pl] as const));
      const liveLB = participants
        .filter((p) => p.status === "active")
        .map((p) => {
          const pl = playersById.get(p.player_id);
          return {
            player_id: p.player_id,
            color: pl?.color || p.color || "#60a5fa",
            score: Math.floor(pl?.score ?? 0),
            distance: Math.floor(p.distance ?? pl?.distance ?? 0),
          };
        })
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score; // pipes passed desc
          return b.distance - a.distance; // tie-break by distance desc
        })
        .slice(0, 10);

      // Draw a simple leaderboard panel on the top-right
  // Only show active runners (no dead records): always use live leaderboard derived from participants
  const board = liveLB as Array<{ player_id: string; color: string; score: number }>;
      if (board.length > 0) {
        const panelW = 220;
        const rowH = 18;
        const pad2 = 8;
        const panelH = Math.min(10, board.length) * rowH + pad2 * 2;
        ctx.fillStyle = "rgba(2,6,23,0.6)";
        ctx.fillRect(width - panelW - 8, 8, panelW, panelH);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "14px system-ui";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        let y2 = 8 + pad2;
        let i = 1;
        for (const e of board.slice(0, 10)) {
          // color swatch
          ctx.fillStyle = e.color;
          ctx.fillRect(width - panelW, y2 + 2, 12, 12);
          ctx.fillStyle = "#cbd5e1";
          const id = (e.player_id || "?").slice(0, 6);
          ctx.fillText(`${i}. ${id} — ${Math.floor(e.score)}`, width - panelW + 16, y2);
          y2 += rowH;
          i++;
        }
      }

      // HUD: show active run id and combine distance with score on one line (top-left)
      {
        ctx.font = "14px system-ui";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const pad = 8;
        const rowH = 18;
        const short = (s: string | null | undefined, n = 8) =>
          (s ? String(s) : "-").slice(0, n);
        const lines: string[] = [];
        if (localPlayer) {
          const score = Math.floor(localPlayer.score || 0);
          const dist = Math.floor(localPlayer.distance || 0);
          const rid = short(localPlayer.run_id, 10);
          lines.push(`Score: ${score} · Dist: ${dist}px · Run: ${rid}`);
        } else {
          const rid = short(lastRunId, 10);
          const col = localColor || "-";
          lines.push(`Color: ${col} · Run: ${rid}`);
        }
        // Measure panel width by longest line
        let panelW = 200;
        for (const L of lines) {
          const w = ctx.measureText(L).width + pad * 2;
          if (w > panelW) panelW = Math.ceil(w);
        }
        const panelH = lines.length * rowH + pad * 2;
        ctx.fillStyle = "rgba(2,6,23,0.6)";
        ctx.fillRect(8, 8, panelW, panelH);
        ctx.fillStyle = "#cbd5e1";
        let yy = 8 + pad;
        for (const L of lines) {
          ctx.fillText(L, 8 + pad, yy);
          yy += rowH;
        }
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [width, height, seed, tick, players, participants, connected, localRunId, localColor, lastRunId]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
