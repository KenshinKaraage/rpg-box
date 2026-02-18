import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId = '';
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: number | string = 0;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    if (this.operation === 'set') {
      context.variable.set(this.variableId, this.value);
      return;
    }

    const current = context.variable.get(this.variableId) as number;
    const operand = this.value as number;
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
    this.value = data.value as number | string;
  }
}
