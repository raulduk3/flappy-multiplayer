export function logStaleSnapshot(info: { serverTick: number; lastAppliedTick: number }) {
  // Include a machine-readable tag for grep-based diagnostics
  console.warn(
    `[stale_snapshot] serverTick=${info.serverTick} lastAppliedTick=${info.lastAppliedTick}`,
  );
}

export function logDuplicateInput(info: { seq: number; lastAppliedSeq: number }) {
  console.info(
    `[duplicate_input] seq=${info.seq} lastAppliedSeq=${info.lastAppliedSeq}`,
  );
}
