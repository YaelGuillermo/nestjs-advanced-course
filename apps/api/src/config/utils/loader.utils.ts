// src/config/utils/loader.utils.ts
export function requiredEnvValue<T>(
  value: T | undefined | null,
  variableName: string,
): T {
  if (value === undefined || value === null) {
    throw new Error(
      `Missing validated environment value: ${variableName}. This should have been caught by validateEnv().`,
    );
  }

  return value;
}

export function freezeConfig<T extends object>(config: T): T {
  return Object.freeze(config);
}
