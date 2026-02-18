import type { GameContext } from '../runtime/GameContext';

// =============================================================================
// ValueSource discriminated union
// =============================================================================

export interface LiteralValueSource {
  type: 'literal';
  value: number | string | boolean;
}

export interface VariableValueSource {
  type: 'variable';
  variableId: string;
}

export interface DataValueSource {
  type: 'data';
  dataTypeId: string;
  entryId: string;
  fieldId: string;
}

export interface RandomValueSource {
  type: 'random';
  min: number;
  max: number;
}

export type ValueSource =
  | LiteralValueSource
  | VariableValueSource
  | DataValueSource
  | RandomValueSource;

// =============================================================================
// Handler interface
// =============================================================================

export interface ValueSourceHandler<T extends ValueSource = ValueSource> {
  type: string;
  resolve(source: T, context: GameContext): unknown;
}
