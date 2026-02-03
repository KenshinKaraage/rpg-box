'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';
import { Input } from '@/components/ui/input';

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
    const { value, onChange, disabled, error } = props;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="space-y-1">
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={this.placeholder}
          maxLength={this.maxLength}
          className={error ? 'border-red-500' : ''}
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
