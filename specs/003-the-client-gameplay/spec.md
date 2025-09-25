# Feature Specification: Client Gameplay Loop & Canvas Rendering

**Feature Branch**: `003-the-client-gameplay`  
**Created**: 2025-09-24  
**Status**: Draft  
**Input**: User description: "The client gameplay loop and Canvas rendering: a Next.js client renders the Game view at 60 fps using Canvas 2D rectangles only for all graphics (player birds, bots, pipes, track); the client is a thin graphical layer over a server-driven state machine and must never author authoritative state; inputs are captured from keyboard, mouse, and touch, tagged with monotonically increasing sequence numbers, queued while disconnected, and sent to the server; local prediction applies gravity and flap impulses for at most 150 ms while awaiting authoritative snapshots; on receipt of a snapshot the client reconciles immediately, snapping if divergence exceeds a threshold, and redraws the scene; the Game page contains three sub-states: pre-run (spectate with idle local bird), run (active prediction + reconciliation), and engrave (shown when server ends the run, inline text field and Save button); an in-room leaderboard overlays the top-right during pre-run, run, and engrave, showing the top ten with dense tie display; rendering must scale responsively while preserving aspect ratio from a canonical 288×512 logical resolution, supporting Chrome, Firefox, Safari, and Edge at screen sizes from 1024×768 upward; styling remains minimal retro brutalist with centered monospace UI cards outside the canvas; connection status and errors must be visible (disabled Start until connected, reconnect indicator), and stale snapshots or inputs must be ignored based on last-applied server_tick and sequence numbers."

---

## Clarifications

### Session 2025-09-24

- Q: How should outbound inputs be sent? → A: Single-message per flap immediately

- Q: Engrave name rules (limits & charset)? → A: Max 24 chars, printable ASCII (no emojis)

- Q: Reconciliation snap threshold? → A: Single metric: 10 px radial distance

- Q: Max delta clamp after tab inactivity? → A: 50 ms

- Q: Render ordering vs leaderboard tie-break? → A: Follow server’s tie‑break exactly (elapsed_ms ASC, then run_id)

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a player visiting the game site, I want to view an always-updating game scene and start a run with immediate visual feedback, while the server remains the single source of truth for game outcomes, so that gameplay feels smooth, fair, and responsive even under minor network latency.

### Acceptance Scenarios

1. **Given** the user loads the Game page while connected to the server, **when** they press the Start / flap key, **then** their local bird becomes active and the server-driven snapshots begin updating the scene with authoritative positions.
2. **Given** the user begins a run and issues flap inputs, **when** network latency briefly delays snapshots (<150 ms), **then** the client extrapolates locally (gravity + flap impulse) and no lerp unless below 10 px; otherwise snap (≤1 frame) on the next snapshot without exceeding divergence thresholds.
3. **Given** the server ends the run (e.g., collision), **when** a runEnd snapshot arrives, **then** the UI transitions to the engrave state showing a name input and Save button while freezing (authoritative) final bird position.
4. **Given** the user loses connection mid run, **when** connection is re-established, **then** queued input events (with increasing sequence numbers) are sent in order and stale server snapshots (older or duplicate server_tick) are ignored.
5. **Given** multiple players and bots are present, **when** snapshots update, **then** the leaderboard overlay shows top ten entries with tie groups compactly (no blank ranks) across all display states (pre-run, run, engrave).
6. **Given** the viewport is resized (>=1024×768), **when** the game canvas rerenders, **then** logical 288×512 scene is scaled to fit while preserving aspect ratio with no stretching and centered or letterboxed as needed.
7. **Given** an unsupported stale snapshot (server_tick <= last applied) arrives, **when** processing occurs, **then** it is discarded with no visual regression.
8. **Given** user attempts to start a run before WebSocket ready, **when** clicking Start, **then** the control is disabled and a connection status indicator clarifies the state (e.g., "Connecting…").
9. **Given** user provides engraving text post-run, **when** they click Save, **then** the input is disabled pending server acknowledgement and success returns to pre-run spectating state (or displays confirmation).
10. **Given** divergence between predicted local bird position and authoritative snapshot exceeds a threshold, **when** reconciliation happens, **then** a snap correction (no gradual lerp) is applied immediately.

### Edge Cases

- Window refocus after tab suspension: next frame must not apply an excessively large delta that causes unnatural jump.
- Burst of queued inputs on reconnect: system processes in order, ignoring any with sequence <= last acknowledged.
- Attempt to engrave with empty or whitespace name: Save disabled or prevented. No empty names.
- Extremely high latency (>150 ms): prediction stops at 150 ms and freezes local position until authoritative update. Visual overlay.
- Canvas render failure (WebGL not used, but 2D context unavailable): show fallback error UI.

- Attempt to engrave with disallowed characters (non-ASCII or emojis): show inline validation error; Save remains disabled.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The client MUST render the game scene at a target 60 frames per second using only Canvas 2D rectangle primitives (no images, SVG, WebGL, or gradients for core entities).
- **FR-002**: The client MUST treat all server snapshots as authoritative and MUST NOT generate or mutate official game state (score, collisions, run end outcomes) locally.
- **FR-003**: The client MUST capture flap input events from keyboard, mouse, and touch and assign a strictly monotonically increasing local sequence number to each dispatched input.
- **FR-004**: The client MUST queue input events if the connection is not open and transmit them in original order upon reconnection.
- **FR-005**: The client MUST ignore any snapshot whose server_tick is <= the last applied server_tick.
- **FR-006**: The client MUST apply local prediction (gravity & flap impulse) for at most 150 ms of wall-clock time since last authoritative bird position.
- **FR-007**: The client MUST reconcile on snapshot receipt by replacing predicted positions; if the radial distance between predicted and authoritative positions exceeds 10 px, it MUST snap immediately (no smoothing).
- **FR-008**: The client MUST provide three UI sub-states: pre-run (spectator idle bird), run (active prediction + inputs), and engrave (post-run name entry) with clear transitions.
- **FR-009**: The client MUST display a top-ten leaderboard overlay in all three sub-states with dense tie handling (players with equal score share the same rank index display style). Leaderboard display follows server ordering exactly; allow only dense-tie visual formatting.
- **FR-010**: The client MUST preserve the canonical logical resolution (288×512) and scale uniformly to available space without altering aspect ratio for window sizes >= 1024×768.
- **FR-011**: The client MUST disable the Start/Flap initiation control until the connection is established.
- **FR-012**: The client MUST show a visible reconnecting indicator when the WebSocket is not open after at least one successful connection.
- **FR-013**: The client MUST send each flap input as an individual message immediately upon capture (no batching) and include its sequence number; the server or client logic MUST be able to detect duplicates or gaps using these sequence numbers.
- **FR-014**: The client MUST ignore any input acknowledgement or echo referencing a sequence number less than or equal to the last applied.
- **FR-015**: The client MUST transition to engrave state upon receipt of a run end authoritative message referencing the local player’s active run_id.
- **FR-016**: The engrave state MUST allow entering a name up to 24 characters using printable ASCII only (no emojis), and disable the Save button when invalid or while awaiting server confirmation.
- **FR-017**: The client MUST return to pre-run spectating after successful engraving submission (or after a decline path if user cancels). 
- **FR-018**: The client MUST visually differentiate connection states: connecting, connected, reconnecting, error.
- **FR-019**: The client MUST prevent animation drift after tab inactivity by clamping frame delta time to a maximum of 50 ms on resume.
- **FR-020**: The client MUST ensure all rendering & input logic functions on Chrome, Firefox, Safari, and Edge at desktop resolutions >= 1024×768.
- **FR-021**: The client MUST provide minimal “retro brutalist” styling with monospace UI components outside the canvas (cards, buttons, input fields aligned center). High-contrast palette, centered card design, grays, keyboard focus ring, ARIA labels for controls
- **FR-022**: The client MUST log (diagnostically) any discarded snapshot or input (stale or duplicate) for debugging visibility. Console only.
- **FR-023**: The client MUST stop further local prediction once the FR-006 150 ms prediction limit is reached, and remain paused until a snapshot advances server_tick.
- **FR-024**: The client MUST maintain an internal ordering of remote entities (players, bots) consistent with the server’s leaderboard tie-break: score DESC, then elapsed_ms ASC, then run_id lexical; this ordering SHOULD be used for render layering to avoid flicker.
- **FR-025**: The client MUST support immediate resizing without requiring a page reload.

### Key Entities

- **Local Player Session**: Represents the user’s current participation state (pre-run, run, engrave), last authoritative positions, last prediction start time, last applied server_tick, last sequence number sent.
- **Input Event**: Captures a flap action timestamp and assigned sequential ID; queued until sent; may be purged after acknowledgement.
- **Snapshot Representation**: Authoritative bundle containing server_tick, entities (players, bots), leaderboard entries, and run state flags referenced for reconciliation.
- **Leaderboard Entry**: Abstracted view of participant (name/placeholder, score, rank index/tie grouping metadata).
- **Render Model**: Logical transformation layer mapping canonical resolution coordinates to scaled canvas coordinates.

---

## Review & Acceptance Checklist

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs) (VIOLATION: Mentions Next.js & Canvas – retain? → Remove Next.js reference if targeting business spec)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders (MOSTLY; some technical phrasing remains for clarity)
- [x] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain (present – requires follow-up)
- [x] Requirements are testable and unambiguous where not marked
- [ ] Success criteria are measurable (Some qualitative; add quantitative later) 
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified implicitly (server authoritative)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---

