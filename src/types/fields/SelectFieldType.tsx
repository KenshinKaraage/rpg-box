'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { SelectFieldEditor } from '@/features/data-editor/components/fields/SelectFieldEditor';
import { SelectFieldConfig } from '@/features/data-editor/components/fields/SelectFieldConfig';

/**
 * 選択オプションの型定義
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 選択フィールドタイプ
 *
 * ドロップダウン選択用のフィールド定義。固定の選択肢から1つを選ぶ。
 *
 * @example
 * ```typescript
 * const typeField = new SelectFieldType();
 * typeField.id = 'type';
 * typeField.name = '種類';
 * typeField.options = [
 *   { value: 'normal', label: '通常' },
 *   { value: 'rare', label: 'レア' },
 *   { value: 'legendary', label: '伝説' },
 * ];
 * ```
 */
export class SelectFieldType extends FieldType<string> {
  readonly type = 'select';
  readonly label = '選択';
  readonly tsType = 'string';

  /** 選択肢 */
  options: SelectOption[] = [];

  /** 選択肢ごとの表示フィールド: { optionValue: [fieldId, ...] } */
  visibilityMap?: Record<string, string[]>;

  getDefaultValue(): string {
    const firstOption = this.options[0];
    return firstOption?.value ?? '';
  }

  validate(value: string): ValidationResult {
    // 必須チェック
    if (this.required && !value) {
      return { valid: false, message: '選択してください' };
    }

    // 空文字で非必須の場合はOK
    if (!value && !this.required) {
      return { valid: true };
    }

    // 有効な選択肢かチェック
    const isValidOption = this.options.some((opt) => opt.value === value);
    if (!isValidOption) {
      return { valid: false, message: '有効な選択肢を選んでください' };
    }

    return { valid: true };
  }

  serialize(value: string): unknown {
    return value;
  }

  deserialize(data: unknown): string {
    if (data === null || data === undefined) {
      return '';
    }
    return String(data);
  }

  getValue(data: unknown): string {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
    }
    return String(data);
  }

  renderEditor(props: FieldEditorProps<string>): ReactNode {
    return (
      <SelectFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        options={this.options}
      />
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <SelectFieldConfig
        options={this.options}
        visibilityMap={this.visibilityMap}
        context={props.context}
        onChange={props.onChange}
      />
    );
  }
}
