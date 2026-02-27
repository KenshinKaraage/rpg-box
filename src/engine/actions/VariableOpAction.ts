import type { GameContext } from '../runtime/GameContext';
import type { ValueSource } from '../values';
import { resolveValue } from '../values';

import { EventAction } from './EventAction';

export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId = '';
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: ValueSource = { type: 'literal', value: 0 };
  arrayIndex?: ValueSource;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const resolved = resolveValue(this.value, context);
    const index = this.arrayIndex ? (resolveValue(this.arrayIndex, context) as number) : undefined;

    if (index !== undefined) {
      const arr = context.variable.get(this.variableId) as unknown[];
      if (!Array.isArray(arr)) return;

      if (this.operation === 'set') {
        arr[index] = resolved;
        context.variable.set(this.variableId, arr);
        return;
      }

      const current = arr[index] as number;
      const operand = resolved as number;
      arr[index] = this.compute(current, operand);
      context.variable.set(this.variableId, arr);
      return;
    }

    if (this.operation === 'set') {
      context.variable.set(this.variableId, resolved);
      return;
    }

    const current = context.variable.get(this.variableId) as number;
    const operand = resolved as number;
    context.variable.set(this.variableId, this.compute(current, operand));
  }

  private compute(current: number, operand: number): number {
    switch (this.operation) {
      case 'add':
        return current + operand;
      case 'subtract':
        return current - operand;
      case 'multiply':
        return current * operand;
      case 'divide':
        return current / operand;
      default:
        return operand;
    }
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      variableId: this.variableId,
      operation: this.operation,
      value: this.value,
    };
    if (this.arrayIndex) json.arrayIndex = this.arrayIndex;
    return json;
  }

  fromJSON(data: Record<string, unknown>): void {
    this.variableId = data.variableId as string;
    this.operation = data.operation as VariableOpAction['operation'];
    this.value = data.value as ValueSource;
    this.arrayIndex = data.arrayIndex as ValueSource | undefined;
  }
}
