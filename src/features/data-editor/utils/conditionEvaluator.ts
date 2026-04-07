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
 * displayCondition と visibilityMap の両方を考慮する。
 * visibilityMap は選択肢フィールドが持ち、選択値ごとに表示するフィールドIDを管理する。
 * visibilityMap による制御が displayCondition より優先される。
 *
 * @param fields フィールド一覧
 * @param fieldValues 現在のフィールド値マップ
 * @returns フィールドIDごとの表示状態マップ
 */
export function computeFieldVisibility(
  fields: Array<{
    id: string;
    displayCondition?: DisplayCondition;
    visibilityMap?: Record<string, string[]>;
  }>,
  fieldValues: Record<string, unknown>
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  // visibilityMap から管理されているフィールドを収集
  const managedFields = new Set<string>();
  for (const field of fields) {
    if (!field.visibilityMap) continue;
    const currentValue = String(fieldValues[field.id] ?? '');
    const visibleIds = field.visibilityMap[currentValue] ?? [];
    // この select フィールドの全選択肢に含まれるフィールドIDを管理対象に
    for (const ids of Object.values(field.visibilityMap)) {
      for (const id of ids) managedFields.add(id);
    }
    // 現在の選択値で表示するフィールドを設定
    for (const id of visibleIds) {
      visibility[id] = true;
    }
  }

  // 残りのフィールドの表示状態を計算
  for (const field of fields) {
    if (field.id in visibility) continue; // visibilityMap で既に true に設定済み
    if (managedFields.has(field.id)) {
      // visibilityMap で管理されているが、現在の選択値では表示対象でない
      visibility[field.id] = false;
      continue;
    }
    if (!field.displayCondition) {
      visibility[field.id] = true;
    } else {
      visibility[field.id] = evaluateDisplayCondition(field.displayCondition, fieldValues);
    }
  }

  return visibility;
}
