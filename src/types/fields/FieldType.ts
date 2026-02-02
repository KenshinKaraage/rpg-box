import type { ReactNode } from 'react';

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** バリデーション成功かどうか */
  valid: boolean;
  /** エラーメッセージ（失敗時） */
  message?: string;
}

/**
 * フィールドの表示条件
 * 他のフィールドの値に基づいて、このフィールドの表示/非表示を制御する
 */
export interface DisplayCondition {
  /** 条件判定に使用するフィールドID */
  fieldId: string;
  /** 表示する条件の値 */
  value: unknown;
}

/**
 * エディタコンポーネントに渡すProps
 */
export interface FieldEditorProps<T = unknown> {
  /** 現在の値 */
  value: T;
  /** 値が変更されたときのコールバック */
  onChange: (value: T) => void;
  /** フィールドが無効化されているか */
  disabled?: boolean;
  /** エラーメッセージ */
  error?: string;
}

/**
 * フィールドタイプの基底抽象クラス
 *
 * データベースのフィールド定義に使用される型システムの基盤。
 * 各フィールドタイプ（Number, String, Select等）はこのクラスを継承して実装する。
 *
 * @example
 * ```typescript
 * class NumberFieldType extends FieldType<number> {
 *   readonly type = 'number';
 *   min?: number;
 *   max?: number;
 *
 *   getDefaultValue(): number {
 *     return 0;
 *   }
 *
 *   validate(value: number): ValidationResult {
 *     if (this.min !== undefined && value < this.min) {
 *       return { valid: false, message: `${this.min}以上の値を入力してください` };
 *     }
 *     return { valid: true };
 *   }
 *   // ...
 * }
 * ```
 */
export abstract class FieldType<T = unknown> {
  /**
   * フィールドタイプの識別子
   * 各サブクラスで固有の値を定義する
   */
  abstract readonly type: string;

  /**
   * フィールドID（英数字とアンダースコアのみ）
   * データベース内で一意に識別するために使用
   */
  id: string;

  /**
   * フィールドの表示名
   * UIに表示されるラベル
   */
  name: string;

  /**
   * 必須フィールドかどうか
   * trueの場合、値が空だとバリデーションエラーになる
   */
  required: boolean;

  /**
   * フィールドの表示条件
   * 指定された場合、条件を満たすときのみフィールドが表示される
   */
  displayCondition?: DisplayCondition;

  /**
   * コンストラクタ
   * @param id フィールドID
   * @param name 表示名
   * @param required 必須かどうか（デフォルト: false）
   */
  constructor(id: string, name: string, required: boolean = false) {
    this.id = id;
    this.name = name;
    this.required = required;
  }

  /**
   * フィールドのデフォルト値を取得
   * 新規レコード作成時に使用される
   * @returns デフォルト値
   */
  abstract getDefaultValue(): T;

  /**
   * 値のバリデーションを実行
   * @param value バリデーション対象の値
   * @returns バリデーション結果
   */
  abstract validate(value: T): ValidationResult;

  /**
   * 値をシリアライズ（保存用の形式に変換）
   * @param value シリアライズする値
   * @returns シリアライズされたデータ
   */
  abstract serialize(value: T): unknown;

  /**
   * データをデシリアライズ（保存形式から復元）
   * @param data デシリアライズするデータ
   * @returns 復元された値
   */
  abstract deserialize(data: unknown): T;

  /**
   * エディタUIをレンダリング
   * @param props エディタに渡すProps
   * @returns Reactノード
   */
  abstract renderEditor(props: FieldEditorProps<T>): ReactNode;

  /**
   * ゲーム実行時に値を取得
   * @param data 保存されているデータ
   * @returns 実行時に使用する値
   */
  abstract getValue(data: unknown): T;
}
