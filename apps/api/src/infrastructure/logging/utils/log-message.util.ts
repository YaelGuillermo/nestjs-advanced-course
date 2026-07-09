// src/infrastructure/logging/utils/log-message.util.ts
import type { SerializableLogMessage } from '../types/logging.types';

export function normalizeLogMessage(message: SerializableLogMessage): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}
