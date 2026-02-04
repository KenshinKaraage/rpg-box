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
