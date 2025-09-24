// Track seed & deterministic PRNG utilities (T003)
// Using splitmix64 for simple high-quality 64-bit mixing.

export type Seed64 = bigint; // 0..2^64-1
const MASK_64 = (1n << 64n) - 1n;

export function randomSeed(): Seed64 {
  // Use crypto if available (Node 20+) else fallback to Math.random (should not happen in server env)
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(2);
    (crypto as any).getRandomValues(buf);
    return ((BigInt(buf[0]) << 32n) | BigInt(buf[1])) & MASK_64;
  } else {
    // Node.js crypto
    const { randomBytes } = require("crypto");
    const b = randomBytes(8);
    let v = 0n;
    for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]);
    return v & MASK_64;
  }
}

export function splitmix64(next: Seed64): { value: Seed64; next: Seed64 } {
  // Returns a new pseudo-random 64-bit value and the next state.
  let z = (next + 0x9e3779b97f4a7c15n) & MASK_64;
  let x = z;
  x = ((x ^ (x >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK_64;
  x = ((x ^ (x >> 27n)) * 0x94d049bb133111ebn) & MASK_64;
  x = x ^ (x >> 31n);
  return { value: x & MASK_64, next: z & MASK_64 };
}

export interface PipeWindow {
  id: number;
  x: number;
  gap_y: number;
  gap_height: number;
}

// Deterministic window generator: given initial seed and index produce a window.
// Simple approach: call splitmix step (index+1) times; derive parameters.
export function generatePipeWindow(seed: Seed64, index: number): PipeWindow {
  let s = seed;
  for (let i = 0; i <= index; i++) {
    const r = splitmix64(s);
    s = r.next; // iterate state
  }
  // Use last mixed value parts for parameters
  const value = Number(s & 0xffffffffn); // lower bits
  const gapY = (value % 400) + 80; // vertical offset (tune bounds)
  const gapHeight = 160; // constant for now, future: derive from value >>> bits
  const x = index * 300; // spacing between pipes
  return { id: index, x, gap_y: gapY, gap_height: gapHeight };
}
