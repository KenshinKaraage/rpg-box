/**
 * フィールドセットの型定義
 *
 * フィールドセットは再利用可能なフィールドの集合を定義
 * - ステータス（HP, MP, ATK, DEF等）
 * - エフェクト関連
 * - スキル結果 等
 */

import type { FieldType } from './fields/FieldType';

/**
 * フィールドセットインターフェース
 */
export interface FieldSet {
  /** 一意識別子 */
  id: string;

  /** フィールドセット名 */
  name: string;

  /** フィールド一覧（FieldType継承クラスのインスタンス） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldType<any>[];

  /** 説明（オプション） */
  description?: string;
}

/**
 * 新しいフィールドセットを作成
 */
export function createFieldSet(id: string, name: string): FieldSet {
  return {
    id,
    name,
    fields: [],
  };
}
