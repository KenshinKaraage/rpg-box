import type { GameContext } from '../runtime/GameContext';
import type { ValueSource } from '../values';
import { resolveValue } from '../values';

import { EventAction } from './EventAction';

export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId = '';
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: ValueSource = { type: 'literal', value: 0 };

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const resolved = resolveValue(this.value, context);

    if (this.operation === 'set') {
      context.variable.set(this.variableId, resolved);
      return;
    }

    const current = context.variable.get(this.variableId) as number;
    const operand = resolved as number;
    let result: number;

    switch (this.operation) {
      case 'add':
        result = current + operand;
        break;
      case 'subtract':
        result = current - operand;
        break;
      case 'multiply':
        result = current * operand;
        break;
      case 'divide':
        result = current / operand;
        break;
    }

    context.variable.set(this.variableId, result);
  }

  toJSON(): Record<string, unknown> {
    return { variableId: this.variableId, operation: this.operation, value: this.value };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.variableId = data.variableId as string;
    this.operation = data.operation as VariableOpAction['operation'];
    this.value = data.value as ValueSource;
  }
}
