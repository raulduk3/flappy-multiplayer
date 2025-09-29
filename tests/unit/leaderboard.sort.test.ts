import { describe, it, expect } from "vitest";
import type { LeaderboardEntry } from "../../src/shared/types";

type LBRow = LeaderboardEntry & { distance: number };

function sort(entries: LBRow[]) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.distance !== a.distance) return b.distance - a.distance; // farther distance wins ties on score
    return a.ended_at - b.ended_at; // earlier wins remaining ties
  }).slice(0, 10);
}

describe("leaderboard sorting", () => {
  it("sorts by score desc, then distance desc, then earlier end, trims to 10", () => {
    const now = 1730000000000;
    const entries: LBRow[] = [
      { player_id: "p1", color: "#111111", score: 10, distance: 1000, ended_at: now + 10 },
      { player_id: "p2", color: "#222222", score: 12, distance: 1200, ended_at: now + 20 },
      { player_id: "p3", color: "#333333", score: 12, distance: 1300, ended_at: now + 5 },
      { player_id: "p4", color: "#444444", score: 8, distance: 800, ended_at: now + 1 },
      { player_id: "p5", color: "#555555", score: 12, distance: 1100, ended_at: now + 30 },
      { player_id: "p6", color: "#666666", score: 9, distance: 900, ended_at: now + 2 },
      { player_id: "p7", color: "#777777", score: 7, distance: 700, ended_at: now + 3 },
      { player_id: "p8", color: "#888888", score: 6, distance: 600, ended_at: now + 4 },
      { player_id: "p9", color: "#999999", score: 5, distance: 500, ended_at: now + 5 },
      { player_id: "p10", color: "#aaaaaa", score: 4, distance: 400, ended_at: now + 6 },
      { player_id: "p11", color: "#bbbbbb", score: 3, distance: 300, ended_at: now + 7 },
    ];

    const sorted = sort(entries);
    expect(sorted.map((e) => e.player_id)).toEqual([
      // highest score (12), tie-break by farther distance, then earlier ended_at
      "p3", "p2", "p5",
      // then score=10,9,8,7,6,5,4
      "p1", "p6", "p4", "p7", "p8", "p9", "p10",
    ]);
    expect(sorted.length).toBe(10);
  });
});
