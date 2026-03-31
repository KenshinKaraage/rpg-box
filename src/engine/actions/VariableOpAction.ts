import type { GameContext } from '../runtime/GameContext';
import type { ValueSource } from '../values';
import { resolveValue } from '../values';

import { EventAction } from './EventAction';

/** 変数ターゲット: ゲーム変数 or オブジェクト変数 */
export type VariableTarget =
  | { scope: 'game' }
  | { scope: 'object'; objectName: string };

export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId = '';
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: ValueSource = { type: 'literal', value: 0 };
  arrayIndex?: ValueSource;
  /** 変数の所在（未指定 = ゲーム変数） */
  target?: VariableTarget;

  private getVar(context: GameContext): unknown {
    if (this.target?.scope === 'object') {
      return context.getObjectVariable(this.target.objectName, this.variableId);
    }
    return context.variable.get(this.variableId);
  }

  private setVar(context: GameContext, value: unknown): void {
    if (this.target?.scope === 'object') {
      context.setObjectVariable(this.target.objectName, this.variableId, value);
      return;
    }
    context.variable.set(this.variableId, value);
  }

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const resolved = resolveValue(this.value, context);
    const index = this.arrayIndex ? (resolveValue(this.arrayIndex, context) as number) : undefined;

    if (index !== undefined) {
      const arr = this.getVar(context) as unknown[];
      if (!Array.isArray(arr)) return;

      if (this.operation === 'set') {
        arr[index] = resolved;
        this.setVar(context, arr);
        return;
      }

      const current = arr[index] as number;
      const operand = resolved as number;
      arr[index] = this.compute(current, operand);
      this.setVar(context, arr);
      return;
    }

    if (this.operation === 'set') {
      this.setVar(context, resolved);
      return;
    }

    const current = this.getVar(context) as number;
    const operand = resolved as number;
    this.setVar(context, this.compute(current, operand));
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
    if (this.target) json.target = this.target;
    return json;
  }

  fromJSON(data: Record<string, unknown>): void {
    this.variableId = data.variableId as string;
    this.operation = data.operation as VariableOpAction['operation'];
    this.value = data.value as ValueSource;
    this.arrayIndex = data.arrayIndex as ValueSource | undefined;
    this.target = data.target as VariableTarget | undefined;
  }
}
