// Engraving filter (T012)
const DENY_SUBSTRINGS = ["badword"]; // placeholder minimal list
const NAME_REGEX = /^[A-Za-z0-9 _-]{1,24}$/;

export interface FilterResult {
  accepted: boolean;
  reason?: "filtered" | "charset" | "length";
}

export function filterEngraving(name: string): FilterResult {
  if (name.length < 1 || name.length > 24)
    return { accepted: false, reason: "length" };
  if (!NAME_REGEX.test(name)) return { accepted: false, reason: "charset" };
  const lower = name.toLowerCase();
  for (const bad of DENY_SUBSTRINGS)
    if (lower.includes(bad)) return { accepted: false, reason: "filtered" };
  return { accepted: true };
}
