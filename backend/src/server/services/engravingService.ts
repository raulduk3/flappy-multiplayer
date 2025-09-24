// Engraving service (T023)
import { Run } from "../models/Run.ts";
import { filterEngraving } from "../engraving/filter.ts";

export interface EngraveResult {
  accepted: boolean;
  reason?: string;
  name?: string;
}

export function submitEngraving(
  run: Run,
  name: string,
  now = Date.now(),
): EngraveResult {
  if (run.state !== "ended") return { accepted: false, reason: "not-ended" };
  if (run.engraving) return { accepted: false, reason: "immutable" };
  if (now > run.engraving_deadline_ms)
    return { accepted: false, reason: "window-expired" };
  const f = filterEngraving(name);
  if (!f.accepted) return { accepted: false, reason: f.reason };
  run.setEngraving(name, now);
  return { accepted: true, name };
}
