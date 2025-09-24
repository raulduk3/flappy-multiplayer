// Tick metrics instrumentation (T038)
// Lightweight counters to measure tick duration and snapshot sizes.
// Intentionally minimal; can be replaced by a real metrics backend later.

export interface TickMetricsSnapshot {
  ticks: number;
  last_tick_ms: number;
  avg_tick_ms: number;
  max_tick_ms: number;
  last_snapshot_bytes: number;
}

class TickMetrics {
  private _ticks = 0;
  private _totalTickMs = 0;
  private _maxTick = 0;
  private _lastTick = 0;
  private _lastSnapshotBytes = 0;

  beginTick(): number {
    return Date.now();
  }
  endTick(start: number, snapshotSize: number) {
    const dur = Date.now() - start;
    this._ticks++;
    this._lastTick = dur;
    this._totalTickMs += dur;
    if (dur > this._maxTick) this._maxTick = dur;
    this._lastSnapshotBytes = snapshotSize;
  }
  snapshot(): TickMetricsSnapshot {
    return {
      ticks: this._ticks,
      last_tick_ms: this._lastTick,
      avg_tick_ms: this._ticks ? this._totalTickMs / this._ticks : 0,
      max_tick_ms: this._maxTick,
      last_snapshot_bytes: this._lastSnapshotBytes,
    };
  }
  reset() {
    this._ticks = 0;
    this._totalTickMs = 0;
    this._maxTick = 0;
    this._lastTick = 0;
    this._lastSnapshotBytes = 0;
  }
}

export const tickMetrics = new TickMetrics();
