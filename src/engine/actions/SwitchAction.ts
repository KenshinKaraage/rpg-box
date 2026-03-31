import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';
import { deserializeActions } from './index';
import type { ConditionOperand } from './ConditionalAction';

export interface SwitchCase {
  value: unknown;
  actions: EventAction[];
}

export class SwitchAction extends EventAction {
  readonly type = 'switch';

  /** 判定対象（ゲーム変数 or オブジェクト変数） */
  operand: ConditionOperand = { type: 'variable', variableId: '' };

  /** ケース一覧 */
  cases: SwitchCase[] = [];

  /** デフォルトアクション（どのケースにも一致しない場合） */
  defaultActions: EventAction[] = [];

  async execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const value = this.resolveOperand(context);

    for (const c of this.cases) {
      // eslint-disable-next-line eqeqeq
      if (value == c.value) {
        await run(c.actions);
        return;
      }
    }

    if (this.defaultActions.length > 0) {
      await run(this.defaultActions);
    }
  }

  private resolveOperand(context: GameContext): unknown {
    switch (this.operand.type) {
      case 'variable':
        return context.variable.get(this.operand.variableId);
      case 'objectVariable':
        return context.getObjectVariable(this.operand.objectName, this.operand.variableName);
      case 'literal':
        return this.operand.value;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operand: this.operand,
      cases: this.cases.map((c) => ({
        value: c.value,
        actions: c.actions.map((a) => ({ type: a.type, data: a.toJSON() })),
      })),
      defaultActions: this.defaultActions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operand = data.operand as ConditionOperand;
    const cases = data.cases as { value: unknown; actions: { type: string; data: Record<string, unknown> }[] }[];
    this.cases = (cases ?? []).map((c) => ({
      value: c.value,
      actions: deserializeActions(c.actions),
    }));
    if (Array.isArray(data.defaultActions)) {
      this.defaultActions = deserializeActions(
        data.defaultActions as { type: string; data: Record<string, unknown> }[]
      );
    }
  }
}
