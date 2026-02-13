'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { TextareaFieldEditor } from '@/features/data-editor/components/fields/TextareaFieldEditor';
import { TextareaFieldConfig } from '@/features/data-editor/components/fields/TextareaFieldConfig';

/**
 * 複数行テキストフィールドタイプ
 *
 * 複数行のテキスト入力用のフィールド定義。説明文やメモなどに使用。
 *
 * @example
 * ```typescript
 * const descField = new TextareaFieldType();
 * descField.id = 'description';
 * descField.name = '説明';
 * descField.maxLength = 2000;
 * descField.rows = 5;
 * ```
 */
export class TextareaFieldType extends FieldType<string> {
  readonly type = 'textarea';
  readonly label = 'テキストエリア';

  /** 最大文字数 */
  maxLength?: number;

  /** 表示行数 */
  rows?: number;

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
      <TextareaFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        maxLength={this.maxLength}
        placeholder={this.placeholder}
        rows={this.rows}
      />
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <TextareaFieldConfig
        maxLength={this.maxLength}
        rows={this.rows}
        placeholder={this.placeholder}
        onChange={props.onChange}
      />
    );
  }
}
