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
  subFieldId?: string;
}

export interface ObjectVariableValueSource {
  type: 'objectVariable';
  objectName: string;
  variableName: string;
}

export interface RandomValueSource {
  type: 'random';
  min: number;
  max: number;
}

export type ValueSource =
  | LiteralValueSource
  | VariableValueSource
  | ObjectVariableValueSource
  | DataValueSource
  | RandomValueSource;

// =============================================================================
// Handler interface
// =============================================================================

export interface ValueSourceHandler<T extends ValueSource = ValueSource> {
  type: string;
  label: string;
  defaultValue: () => T;
  resolve(source: T, context: GameContext): unknown;
}
