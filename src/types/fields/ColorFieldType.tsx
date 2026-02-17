'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { ColorFieldEditor } from '@/features/data-editor/components/fields/ColorFieldEditor';
import { ColorFieldConfig } from '@/features/data-editor/components/fields/ColorFieldConfig';

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
  readonly label = '色';
  readonly tsType = 'string';

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
    return (
      <ColorFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        showHexInput={this.showHexInput}
        defaultColor={this.getDefaultValue()}
      />
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return <ColorFieldConfig showHexInput={this.showHexInput} onChange={props.onChange} />;
  }
}
