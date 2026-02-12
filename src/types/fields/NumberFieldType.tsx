'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';
import { NumberFieldEditor } from '@/features/data-editor/components/fields/NumberFieldEditor';

/**
 * 数値フィールドタイプ
 *
 * 数値入力用のフィールド定義。min/max/stepプロパティで入力制約を設定可能。
 *
 * @example
 * ```typescript
 * const hpField = new NumberFieldType();
 * hpField.id = 'hp';
 * hpField.name = 'HP';
 * hpField.min = 1;
 * hpField.max = 9999;
 * ```
 */
export class NumberFieldType extends FieldType<number> {
  readonly type = 'number';
  readonly label = '数値';

  /** 最小値 */
  min?: number;

  /** 最大値 */
  max?: number;

  /** ステップ値（入力の増減単位） */
  step?: number;

  getDefaultValue(): number {
    return 0;
  }

  validate(value: number): ValidationResult {
    // 必須チェック
    if (Number.isNaN(value)) {
      if (this.required) {
        return { valid: false, message: '値を入力してください' };
      }
      return { valid: true };
    }

    // 最小値チェック
    if (this.min !== undefined && value < this.min) {
      return { valid: false, message: `${this.min}以上の値を入力してください` };
    }

    // 最大値チェック
    if (this.max !== undefined && value > this.max) {
      return { valid: false, message: `${this.max}以下の値を入力してください` };
    }

    return { valid: true };
  }

  serialize(value: number): unknown {
    if (Number.isNaN(value)) {
      return null;
    }
    return value;
  }

  deserialize(data: unknown): number {
    if (data === null || data === undefined) {
      return NaN;
    }
    const num = Number(data);
    return num;
  }

  getValue(data: unknown): number {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
    }
    return Number(data);
  }

  renderEditor(props: FieldEditorProps<number>): ReactNode {
    return (
      <NumberFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        min={this.min}
        max={this.max}
        step={this.step}
      />
    );
  }
}
