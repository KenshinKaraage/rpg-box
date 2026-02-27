import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export type ConditionOperand =
  | { type: 'literal'; value: number | string | boolean }
  | { type: 'variable'; variableId: string };

export interface Condition {
  left: ConditionOperand;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  right: ConditionOperand;
}

export class ConditionalAction extends EventAction {
  readonly type = 'conditional';
  condition: Condition = {
    left: { type: 'variable', variableId: '' },
    operator: '==',
    right: { type: 'literal', value: 0 },
  };
  thenActions: EventAction[] = [];
  elseActions: EventAction[] = [];

  async execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const actual = this.resolveOperand(this.condition.left, context);
    const expected = this.resolveOperand(this.condition.right, context);
    const result = this.evaluate(actual, expected);
    if (result) {
      await run(this.thenActions);
    } else {
      await run(this.elseActions);
    }
  }

  private resolveOperand(operand: ConditionOperand, context: GameContext): unknown {
    switch (operand.type) {
      case 'literal':
        return operand.value;
      case 'variable':
        return context.variable.get(operand.variableId);
    }
  }

  private evaluate(actual: unknown, expected: unknown): boolean {
    switch (this.condition.operator) {
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case '>':
        return (actual as number) > (expected as number);
      case '<':
        return (actual as number) < (expected as number);
      case '>=':
        return (actual as number) >= (expected as number);
      case '<=':
        return (actual as number) <= (expected as number);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      condition: this.condition,
      thenActions: this.thenActions.map((a) => ({ type: a.type, data: a.toJSON() })),
      elseActions: this.elseActions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    const cond = data.condition as Record<string, unknown>;
    // Legacy format: { variableId, operator, value }
    if ('variableId' in cond) {
      this.condition = {
        left: { type: 'variable', variableId: cond.variableId as string },
        operator: cond.operator as Condition['operator'],
        right: { type: 'literal', value: cond.value as number | string | boolean },
      };
    } else {
      this.condition = cond as unknown as Condition;
    }
  }
}
