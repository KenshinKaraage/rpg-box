/**
 * カスタムクラス（構造体）の型定義
 *
 * 変数で使用するカスタムクラスを定義
 * - 複数のフィールドを持つ構造体として機能
 * - フィールドタイプはFieldTypeを使用
 */

import type { FieldType } from './fields/FieldType';

/**
 * カスタムクラスインターフェース
 */
export interface CustomClass {
  /** 一意識別子 */
  id: string;

  /** クラス名 */
  name: string;

  /** フィールド一覧（FieldType配列） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldType<any>[];

  /** 説明（オプション） */
  description?: string;
}

/**
 * 新しいカスタムクラスを作成
 */
export function createCustomClass(id: string, name: string): CustomClass {
  return {
    id,
    name,
    fields: [],
  };
}

/**
 * クラス参照が循環参照を引き起こすか判定する。
 *
 * editingClassId のフィールドに candidateClassId を参照するクラス型を
 * 追加した場合、循環参照が発生するかチェックする。
 * candidateClassId から辿れるクラス参照チェーンに editingClassId が
 * 含まれていれば循環参照。自己参照も循環とみなす。
 *
 * @param editingClassId 編集中のクラスID
 * @param candidateClassId 参照候補のクラスID
 * @param classes 全クラス定義
 * @returns 循環参照が発生する場合 true
 */
export function wouldCreateCycle(
  editingClassId: string,
  candidateClassId: string,
  classes: CustomClass[]
): boolean {
  if (candidateClassId === editingClassId) return true;

  const visited = new Set<string>();

  function reachesTarget(classId: string): boolean {
    if (classId === editingClassId) return true;
    if (visited.has(classId)) return false;
    visited.add(classId);

    const cls = classes.find((c) => c.id === classId);
    if (!cls) return false;

    return cls.fields.some((f) => {
      if (f.type !== 'class') return false;
      const refClassId = (f as FieldType<unknown> & { classId?: string }).classId;
      return refClassId ? reachesTarget(refClassId) : false;
    });
  }

  return reachesTarget(candidateClassId);
}
