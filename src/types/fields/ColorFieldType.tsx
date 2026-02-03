'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';
import { Input } from '@/components/ui/input';

/** HEX色コードの正規表現（#rrggbb または #rgb） */
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

/**
 * 色フィールドタイプ
 *
 * カラーピッカーによる色選択用のフィールド定義。HEX形式で保存。
 *
 * @example
 * ```typescript
 * const bgColorField = new ColorFieldType();
 * bgColorField.id = 'backgroundColor';
 * bgColorField.name = '背景色';
 * bgColorField.showHexInput = true;
 * ```
 */
export class ColorFieldType extends FieldType<string> {
  readonly type = 'color';

  /** HEX入力欄を表示するかどうか */
  showHexInput?: boolean;

  getDefaultValue(): string {
    return '#000000';
  }

  validate(value: string): ValidationResult {
    // 必須チェック
    if (this.required && !value) {
      return { valid: false, message: '色を選択してください' };
    }

    // 空文字で非必須の場合はOK
    if (!value && !this.required) {
      return { valid: true };
    }

    // HEX形式チェック
    if (!HEX_COLOR_REGEX.test(value)) {
      return { valid: false, message: '有効な色コードを入力してください（例: #ff0000）' };
    }

    return { valid: true };
  }

  serialize(value: string): unknown {
    return value.toLowerCase();
  }

  deserialize(data: unknown): string {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
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

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || this.getDefaultValue()}
            onChange={handleColorChange}
            disabled={disabled}
            className="h-10 w-14 cursor-pointer rounded border border-input p-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {this.showHexInput && (
            <Input
              type="text"
              value={value}
              onChange={handleTextChange}
              disabled={disabled}
              placeholder="#000000"
              className={`w-28 font-mono ${error ? 'border-red-500' : ''}`}
            />
          )}
          {!this.showHexInput && (
            <span className="font-mono text-sm text-muted-foreground">{value}</span>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
}
