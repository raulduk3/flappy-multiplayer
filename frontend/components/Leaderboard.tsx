import React from "react";

export type LeaderboardEntry = { player_id: string; name: string; score: number; elapsed_ms?: number; run_id?: string };

export function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score; // score DESC
    const ea = a.elapsed_ms ?? 0;
    const eb = b.elapsed_ms ?? 0;
    if (ea !== eb) return ea - eb; // elapsed ASC
    const ra = a.run_id ?? "";
    const rb = b.run_id ?? "";
    return ra.localeCompare(rb);
  });
}

export const Leaderboard: React.FC<{ entries: LeaderboardEntry[] }> = ({ entries }) => {
  const top = sortEntries(entries).slice(0, 10);
  return (
    <div
      aria-label="leaderboard"
      style={{ position: "absolute", top: 8, right: 8, background: "#0b1020", border: "1px solid #334155", borderRadius: 6, padding: 8, color: "#e2e8f0", fontSize: 12 }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Top 10</div>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {top.map((e, i) => (
          <li key={`${e.run_id ?? e.player_id}-${i}`} style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            <span style={{ opacity: 0.7 }}>{i + 1}.</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
            <span>{e.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
