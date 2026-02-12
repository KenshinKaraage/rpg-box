import type { DisplayCondition } from '@/types/fields/FieldType';

/**
 * 表示条件を評価する
 *
 * フィールドの displayCondition に基づき、現在のフィールド値で条件を満たすか判定する。
 * 条件は単純な等価比較（選択フィールドの値 === 期待値）。
 *
 * @param condition 表示条件
 * @param fieldValues 現在のフィールド値マップ (fieldId -> value)
 * @returns 条件を満たす場合 true
 */
export function evaluateDisplayCondition(
  condition: DisplayCondition,
  fieldValues: Record<string, unknown>
): boolean {
  const currentValue = fieldValues[condition.fieldId];
  return currentValue === condition.value;
}

/**
 * 複数フィールドの表示状態を一括計算
 *
 * @param fields フィールド一覧（displayCondition を持つ可能性がある）
 * @param fieldValues 現在のフィールド値マップ
 * @returns フィールドIDごとの表示状態マップ
 */
export function computeFieldVisibility(
  fields: Array<{ id: string; displayCondition?: DisplayCondition }>,
  fieldValues: Record<string, unknown>
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  for (const field of fields) {
    if (!field.displayCondition) {
      visibility[field.id] = true;
    } else {
      visibility[field.id] = evaluateDisplayCondition(field.displayCondition, fieldValues);
    }
  }

  return visibility;
}
