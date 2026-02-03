'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';

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
    const { value, onChange, disabled, error } = props;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="space-y-1">
        <textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={this.placeholder}
          maxLength={this.maxLength}
          rows={this.rows ?? 4}
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
        />
        {this.maxLength && (
          <p className="text-xs text-muted-foreground">
            {value.length} / {this.maxLength}
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
}
