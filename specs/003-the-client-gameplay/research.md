# Research: Client Gameplay Loop & Canvas Rendering

Date: 2025-09-24
Branch: 003-the-client-gameplay
Spec: ./spec.md

## Decisions and Rationale

1) Input dispatch model
- Decision: Send one message per flap immediately; include monotonically increasing seq.
- Rationale: Minimizes input latency; aligns with server dedupe (backend input handler tracks lastSeq).
- Alternatives: Batch inputs → increases latency and complexity; rejected.

2) Prediction window and reconciliation
- Decision: Predict locally for ≤150 ms; on snapshot receipt, snap if radial divergence > 10 px; otherwise replace state with authoritative immediately (no smoothing required by spec).
- Rationale: Keeps visual responsiveness under jitter without prolonged divergence; simple and deterministic.
- Alternatives: Lerp/SMOOTH over time → can hide divergence but violates spec’s explicit snapping behavior for large errors.

3) Frame delta clamping
- Decision: Clamp dt to 50 ms after tab resume/inactivity.
- Rationale: Prevents physics/extrapolation spikes; matches clarification.
- Alternatives: No clamp or larger clamp → causes visual jumps.

4) Rendering primitives
- Decision: Use Canvas 2D rectangles only for core entities (players, bots, pipes, track).
- Rationale: Simplicity, performance, and retro/brutalist aesthetic; consistent with constitution.
- Alternatives: Images/SVG/WebGL → unnecessary complexity; violates constraint for core entities.

5) Resolution and scaling
- Decision: Logical scene 288×512; scale uniformly to fit >=1024×768 window; preserve aspect ratio; center/letterbox as needed.
- Rationale: Stable design baseline; easy deterministic transforms.
- Alternatives: Responsive re-layout/variable logic resolution → adds complexity and inconsistency.

6) Ordering & leaderboard ties
- Decision: Maintain client-side ordering consistent with server tie-break: score DESC, elapsed_ms ASC, run_id lexical; render layering follows this to reduce flicker.
- Rationale: Visual consistency with server governance; avoids flicker during ties.
- Alternatives: Arbitrary or separate render order → inconsistency.

7) Engraving constraints
- Decision: 1–24 printable ASCII; disable Save when invalid; show inline error.
- Rationale: Matches backend validation and tests; avoids surprises.
- Alternatives: Unicode support → deferred.

8) Connection states
- Decision: Explicit UI states: connecting, connected, reconnecting, error; disable Start until connected; queued inputs while disconnected.
- Rationale: Clear UX and predictable behavior under network changes.

## Patterns and References

- Server-authoritative real-time clients: prediction + reconciliation with sequence numbers.
- Browser Canvas 2D best practices: reuse context, avoid layout thrash, minimal allocations inside frame loop.
- Accessibility: controls outside canvas must be keyboard reachable and screen-reader labeled.

## Open Questions (minor, non-blocking)

- Exact dense tie display styling for leaderboard (visual format).
- Whether an explicit Cancel action is shown in the engrave UI.

