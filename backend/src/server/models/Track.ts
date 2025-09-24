// Track & pipe window generation (T009)
import {
  generatePipeWindow,
  Seed64,
} from "../../../../shared/src/track/seed.ts";

export interface PipeWindow {
  id: number;
  x: number;
  gap_y: number;
  gap_height: number;
}

export class Track {
  readonly seed: Seed64;
  private windows: PipeWindow[] = [];

  constructor(seed: Seed64) {
    this.seed = seed;
  }

  getWindow(index: number): PipeWindow {
    if (!this.windows[index]) {
      this.windows[index] = generatePipeWindow(this.seed, index);
    }
    return this.windows[index];
  }

  getSlice(start: number, count: number): PipeWindow[] {
    const out: PipeWindow[] = [];
    for (let i = 0; i < count; i++) out.push(this.getWindow(start + i));
    return out;
  }
}
