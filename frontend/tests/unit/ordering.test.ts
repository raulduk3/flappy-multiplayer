type Entry = { score: number; elapsed_ms: number; run_id: string };

function order(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score; // DESC
    if (a.elapsed_ms !== b.elapsed_ms) return a.elapsed_ms - b.elapsed_ms; // ASC
    return a.run_id.localeCompare(b.run_id); // lexical ASC
  });
}

describe("Ordering mirrors server tie-breaks (FR-009/FR-024)", () => {
  it("orders by score desc, elapsed asc, run_id asc", () => {
    const input: Entry[] = [
      { score: 10, elapsed_ms: 1000, run_id: "b" },
      { score: 10, elapsed_ms: 900, run_id: "z" },
      { score: 9, elapsed_ms: 800, run_id: "a" },
      { score: 10, elapsed_ms: 900, run_id: "a" },
    ];
    const out = order(input);
    // assert full object order
    expect(out).toEqual([
      { score: 10, elapsed_ms: 900, run_id: "a" },
      { score: 10, elapsed_ms: 900, run_id: "z" },
      { score: 10, elapsed_ms: 1000, run_id: "b" },
      { score: 9, elapsed_ms: 800, run_id: "a" },
    ]);
  });
});
