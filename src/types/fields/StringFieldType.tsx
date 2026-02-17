'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { StringFieldEditor } from '@/features/data-editor/components/fields/StringFieldEditor';
import { StringFieldConfig } from '@/features/data-editor/components/fields/StringFieldConfig';

/**
 * 文字列フィールドタイプ
 *
 * テキスト入力用のフィールド定義。maxLengthで入力制約を設定可能。
 *
 * @example
 * ```typescript
 * const nameField = new StringFieldType();
 * nameField.id = 'name';
 * nameField.name = '名前';
 * nameField.maxLength = 50;
 * nameField.placeholder = 'キャラクター名を入力';
 * ```
 */
export class StringFieldType extends FieldType<string> {
  readonly type = 'string';
  readonly label = '文字列';
  readonly tsType = 'string';

  /** 最大文字数 */
  maxLength?: number;

  /** プレースホルダーテキスト */
  placeholder?: string;

  getDefaultValue(): string {
    return '';
  }

  validate(value: string): ValidationResult {
    // 必須チェック
    if (this.required && !value.trim()) {
      return { valid: false, message: '値を入力してください' };
    }

    // 最大文字数チェック
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return { valid: false, message: `${this.maxLength}文字以内で入力してください` };
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
      <StringFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        maxLength={this.maxLength}
        placeholder={this.placeholder}
      />
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <StringFieldConfig
        maxLength={this.maxLength}
        placeholder={this.placeholder}
        onChange={props.onChange}
      />
    );
  }
}
