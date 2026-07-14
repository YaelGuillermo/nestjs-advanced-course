// src/common/limits/types/dynamic-limit.types.ts
export type DynamicLimitModeSource = 'query' | 'body' | 'params';

export type DynamicLimitUnitStrategy =
  | {
      type: 'fixed';
      units: number;
    }
  | {
      type: 'linked-list';
      linkField: string;
      includeRoot?: boolean;
      maxDepth?: number;
    }
  | {
      type: 'direct-children';
      parentField?: string;
      includeRoot?: boolean;
    };

export interface DynamicLimitOptions {
  defaultUnits?: number;
  modeField?: string;
  modeSource?: DynamicLimitModeSource;
  modeStrategies?: Readonly<Record<string, DynamicLimitUnitStrategy>>;
}
