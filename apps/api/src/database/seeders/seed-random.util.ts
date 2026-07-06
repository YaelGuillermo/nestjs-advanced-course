// src/database/seeders/seed-random.util.ts
export interface SeedRandom {
  next(): number;
  int(min: number, max: number): number;
  bool(probabilityTrue?: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  hex(length: number): string;
}

const DEFAULT_SEED = 20260517;
const HEX_CHARS = '0123456789abcdef';

function normalizeSeed(seed?: number | null): number {
  if (!Number.isFinite(seed ?? NaN)) {
    return DEFAULT_SEED;
  }

  const normalized = Math.trunc(seed as number) >>> 0;
  return normalized === 0 ? DEFAULT_SEED : normalized;
}

export function createSeedRandom(seed?: number | null): SeedRandom {
  let state = normalizeSeed(seed);

  function next(): number {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  }

  function int(min: number, max: number): number {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);

    if (upper < lower) {
      throw new Error(`Invalid random range: min=${min}, max=${max}.`);
    }

    return Math.floor(next() * (upper - lower + 1)) + lower;
  }

  function bool(probabilityTrue = 0.5): boolean {
    return next() < probabilityTrue;
  }

  function pick<T>(items: readonly T[]): T {
    if (!items.length) {
      throw new Error('Cannot pick from an empty collection.');
    }

    return items[int(0, items.length - 1)];
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = int(0, index);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  }

  function hex(length: number): string {
    return Array.from(
      { length },
      () => HEX_CHARS[int(0, HEX_CHARS.length - 1)],
    ).join('');
  }

  return {
    next,
    int,
    bool,
    pick,
    shuffle,
    hex,
  };
}
