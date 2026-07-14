// src/common/utils/duration.util.ts
const DURATION_UNIT_TO_SECONDS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
} as const;

type DurationUnit = keyof typeof DURATION_UNIT_TO_SECONDS;

function isDurationUnit(value: string): value is DurationUnit {
  return value in DURATION_UNIT_TO_SECONDS;
}

export function parseDurationToSeconds(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) {
      throw new Error(
        'Invalid duration number. Expected a positive finite number.',
      );
    }

    return Math.floor(input);
  }

  const raw = input.trim();

  if (!raw) {
    throw new Error('Invalid duration. Value cannot be empty.');
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const match = raw.match(/^(\d+)\s*([smhd])$/i);

  if (!match) {
    throw new Error(
      `Invalid duration format: "${raw}". Use formats like "15m", "7d" or "900".`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!isDurationUnit(unit)) {
    throw new Error(`Invalid duration unit: "${unit}".`);
  }

  return amount * DURATION_UNIT_TO_SECONDS[unit];
}

export function parseDurationToMilliseconds(input: string | number): number {
  return parseDurationToSeconds(input) * 1000;
}
