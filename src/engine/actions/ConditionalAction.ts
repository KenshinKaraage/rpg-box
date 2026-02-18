import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export interface Condition {
  variableId: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: unknown;
}

export class ConditionalAction extends EventAction {
  readonly type = 'conditional';
  condition: Condition = { variableId: '', operator: '==', value: 0 };
  thenActions: EventAction[] = [];
  elseActions: EventAction[] = [];

  async execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const actual = context.variable.get(this.condition.variableId);
    const expected = this.condition.value;
    const result = this.evaluate(actual, expected);
    if (result) {
      await run(this.thenActions);
    } else {
      await run(this.elseActions);
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
    this.condition = data.condition as Condition;
  }
}
