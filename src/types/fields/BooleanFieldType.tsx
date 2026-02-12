'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';
import { BooleanFieldEditor } from '@/features/data-editor/components/fields/BooleanFieldEditor';

/**
 * 真偽値フィールドタイプ
 *
 * チェックボックスによるON/OFF入力用のフィールド定義。
 *
 * @example
 * ```typescript
 * const enabledField = new BooleanFieldType();
 * enabledField.id = 'enabled';
 * enabledField.name = '有効';
 * enabledField.label = 'この設定を有効にする';
 * ```
 */
export class BooleanFieldType extends FieldType<boolean> {
  readonly type = 'boolean';
  readonly label = '真偽値';

  /** チェックボックスの横に表示するラベル */
  checkboxLabel?: string;

  getDefaultValue(): boolean {
    return false;
  }

  validate(value: boolean): ValidationResult {
    // 必須の場合、trueであることを要求
    if (this.required && !value) {
      return { valid: false, message: 'チェックを入れてください' };
    }

    return { valid: true };
  }

  serialize(value: boolean): unknown {
    return value;
  }

  deserialize(data: unknown): boolean {
    if (data === null || data === undefined) {
      return false;
    }
    return Boolean(data);
  }

  getValue(data: unknown): boolean {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
    }
    return Boolean(data);
  }

  renderEditor(props: FieldEditorProps<boolean>): ReactNode {
    return (
      <BooleanFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        checkboxLabel={this.checkboxLabel}
      />
    );
  }
}
