/**
 * データタイプとデータエントリの型定義
 *
 * データ設定ページで使用するランタイム型
 * - DataType: データの構造定義（フィールドは FieldType インスタンス）
 * - DataEntry: 個々のデータレコード
 */

import type { FieldType } from './fields/FieldType';
import { hydrateFields } from './fields';
import { StringFieldType } from './fields/StringFieldType';

// =============================================================================
// インターフェース
// =============================================================================

/**
 * データタイプ（データベースのスキーマ）
 */
export interface DataType {
  /** 一意識別子（英数字+アンダースコア） */
  id: string;

  /** データタイプ名 */
  name: string;

  /** フィールド一覧（FieldType インスタンス配列） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldType<any>[];

  /** 最大エントリ数（省略時は MAX_DATA_ENTRIES_PER_TYPE） */
  maxEntries?: number;

  /** 説明（オプション） */
  description?: string;
}

/**
 * データエントリ（データベースのレコード）
 */
export interface DataEntry {
  /** 一意識別子（英数字+アンダースコア） */
  id: string;

  /** 所属するデータタイプID */
  typeId: string;

  /** フィールド値（フィールドID → 値） */
  values: Record<string, unknown>;
}

// =============================================================================
// 定数
// =============================================================================

/** データタイプの最大数 */
export const MAX_DATA_TYPES = 100;

/** データタイプあたりの最大エントリ数 */
export const MAX_DATA_ENTRIES_PER_TYPE = 1000;

/** 名前フィールドID（全データ型で必須・削除不可） */
export const NAME_FIELD_ID = 'name';

/** データID のバリデーションパターン（英数字+アンダースコア、先頭は英字またはアンダースコア） */
const ID_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// =============================================================================
// ファクトリ関数
// =============================================================================

/**
 * 新しいデータタイプを作成
 */
export function createDataType(id: string, name: string): DataType {
  const nameField = new StringFieldType();
  nameField.id = NAME_FIELD_ID;
  nameField.name = '名前';
  nameField.required = true;

  return {
    id,
    name,
    fields: [nameField],
  };
}

/**
 * 新しいデータエントリを作成
 * フィールドのデフォルト値で values を初期化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDataEntry(id: string, typeId: string, fields: FieldType<any>[]): DataEntry {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.id] = field.getDefaultValue();
  }
  return {
    id,
    typeId,
    values,
  };
}

// =============================================================================
// バリデーション
// =============================================================================

/**
 * データIDのバリデーション
 */
export function validateDataId(id: string): { valid: boolean; message?: string } {
  if (!id) {
    return { valid: false, message: 'IDは必須です' };
  }
  if (!ID_PATTERN.test(id)) {
    return { valid: false, message: 'IDは英数字とアンダースコアのみ、先頭は数字不可です' };
  }
  return { valid: true };
}

/**
 * データIDの一意性チェック
 */
export function isDataIdUnique(id: string, existingIds: string[]): boolean {
  return !existingIds.includes(id);
}

/**
 * プレーンオブジェクト（JSON由来）の DataType を FieldType インスタンス付きに復元
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hydrateDataType(plain: any): DataType {
  return {
    ...plain,
    fields: hydrateFields(plain.fields ?? []),
  };
}
