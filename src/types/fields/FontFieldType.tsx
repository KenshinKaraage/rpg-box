/**
 * フォントフィールドタイプ
 *
 * アセットからフォントを選択するフィールド
 * 値はアセットID（string）またはnull
 */

import type { ReactNode } from 'react';

import { FontFieldEditor } from '@/features/data-editor/components/fields/FontFieldEditor';
import { FieldType, type FieldEditorProps, type ValidationResult } from './FieldType';

export class FontFieldType extends FieldType<string | null> {
  readonly type = 'font';
  readonly label = 'フォント';
  readonly tsType = 'string';

  getDefaultValue(): string | null {
    return null;
  }

  validate(value: string | null): ValidationResult {
    if (this.required && !value) {
      return { valid: false, message: 'フォントを選択してください' };
    }
    return { valid: true };
  }

  serialize(value: string | null): unknown {
    return value;
  }

  deserialize(data: unknown): string | null {
    if (typeof data === 'string') {
      return data;
    }
    return null;
  }

  renderEditor({ value, onChange }: FieldEditorProps<string | null>): ReactNode {
    return <FontFieldEditor value={value} onChange={onChange} />;
  }

  getValue(data: unknown): string | null {
    if (typeof data === 'string') {
      return data;
    }
    return null;
  }
}
