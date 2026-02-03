'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';

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

  /** 選択肢 */
  options: SelectOption[] = [];

  /** プレースホルダーテキスト */
  placeholder?: string;

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
    const { value, onChange, disabled, error } = props;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="space-y-1">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
        >
          {this.placeholder && (
            <option value="" disabled>
              {this.placeholder}
            </option>
          )}
          {this.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
}
