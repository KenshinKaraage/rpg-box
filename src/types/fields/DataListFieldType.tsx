'use client';

import type { ReactNode } from 'react';
import {
  FieldType,
  type ValidationResult,
  type FieldEditorProps,
  type FieldConfigProps,
} from './FieldType';
import { DataListFieldEditor } from '@/features/data-editor/components/fields/DataListFieldEditor';
import { DataListFieldConfig } from '@/features/data-editor/components/fields/DataListFieldConfig';

/**
 * データ参照（複数）フィールドタイプ
 *
 * 他のデータタイプのエントリを複数選択するフィールド。
 * 値は選択されたエントリIDの配列（string[]）。
 *
 * @example
 * ```typescript
 * const tagsField = new DataListFieldType();
 * tagsField.id = 'tags';
 * tagsField.name = 'タグ';
 * tagsField.referenceTypeId = 'tag_type'; // 参照先データタイプ
 * ```
 */
export class DataListFieldType extends FieldType<string[]> {
  readonly type = 'dataList';
  readonly label = 'データ参照(複数)';
  readonly tsType = 'string[]';

  /** 参照先DataType ID */
  referenceTypeId: string = '';

  getDefaultValue(): string[] {
    return [];
  }

  validate(value: string[]): ValidationResult {
    if (this.required && value.length === 0) {
      return { valid: false, message: '1件以上選択してください' };
    }
    return { valid: true };
  }

  serialize(value: string[]): unknown {
    return value;
  }

  deserialize(data: unknown): string[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter((item): item is string => typeof item === 'string');
  }

  getValue(data: unknown): string[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter((item): item is string => typeof item === 'string');
  }

  renderEditor(props: FieldEditorProps<string[]>): ReactNode {
    const { value, onChange, disabled, error } = props;
    return (
      <DataListFieldEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        referenceTypeId={this.referenceTypeId}
      />
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <DataListFieldConfig
        referenceTypeId={this.referenceTypeId}
        context={props.context}
        onChange={props.onChange}
      />
    );
  }
}
