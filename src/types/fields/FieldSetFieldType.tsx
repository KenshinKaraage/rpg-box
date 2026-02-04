'use client';

import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps } from './FieldType';
import { Label } from '@/components/ui/label';
import type { FieldSet } from '@/types/fieldSet';

/**
 * フィールドセット値の型
 */
export type FieldSetValue = Record<string, unknown>;

/**
 * フィールドセットフィールドタイプ
 *
 * 他のフィールドセットを参照し、そのフィールドを展開表示するフィールド。
 * 複数のフィールドをグループ化して再利用する際に使用。
 *
 * @example
 * ```typescript
 * const statusField = new FieldSetFieldType();
 * statusField.id = 'base_status';
 * statusField.name = '基本ステータス';
 * statusField.fieldSetId = 'fs_status'; // ステータスフィールドセットを参照
 * ```
 */
export class FieldSetFieldType extends FieldType<FieldSetValue> {
  readonly type = 'fieldSet';
  readonly label = 'フィールドセット';

  /** 参照するフィールドセットID */
  fieldSetId: string = '';

  /** フィールドセット（実行時に設定） */
  private _fieldSet: FieldSet | null = null;

  /**
   * フィールドセットを設定
   * エディタ描画時に呼び出す
   */
  setFieldSet(fieldSet: FieldSet): void {
    this._fieldSet = fieldSet;
  }

  /**
   * フィールドセットを取得
   */
  getFieldSet(): FieldSet | null {
    return this._fieldSet;
  }

  getDefaultValue(): FieldSetValue {
    return {};
  }

  validate(value: FieldSetValue): ValidationResult {
    // 必須チェック
    if (this.required && Object.keys(value).length === 0) {
      return { valid: false, message: '値を入力してください' };
    }

    // 各フィールドのバリデーション
    if (this._fieldSet) {
      for (const field of this._fieldSet.fields) {
        const fieldValue = value[field.id];
        if (field.required && (fieldValue === undefined || fieldValue === null)) {
          return { valid: false, message: `${field.name}は必須です` };
        }
        if (fieldValue !== undefined) {
          const result = field.validate(fieldValue);
          if (!result.valid) {
            return { valid: false, message: `${field.name}: ${result.message}` };
          }
        }
      }
    }

    return { valid: true };
  }

  serialize(value: FieldSetValue): unknown {
    if (!this._fieldSet) {
      return value;
    }

    const serialized: FieldSetValue = {};
    for (const field of this._fieldSet.fields) {
      const fieldValue = value[field.id];
      if (fieldValue !== undefined) {
        serialized[field.id] = field.serialize(fieldValue);
      }
    }
    return serialized;
  }

  deserialize(data: unknown): FieldSetValue {
    if (data === null || data === undefined) {
      return {};
    }
    if (typeof data !== 'object') {
      return {};
    }

    if (!this._fieldSet) {
      return data as FieldSetValue;
    }

    const deserialized: FieldSetValue = {};
    const dataObj = data as Record<string, unknown>;
    for (const field of this._fieldSet.fields) {
      const fieldData = dataObj[field.id];
      if (fieldData !== undefined) {
        deserialized[field.id] = field.deserialize(fieldData);
      }
    }
    return deserialized;
  }

  getValue(data: unknown): FieldSetValue {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
    }
    if (typeof data !== 'object') {
      return this.getDefaultValue();
    }
    return data as FieldSetValue;
  }

  renderEditor(props: FieldEditorProps<FieldSetValue>): ReactNode {
    const { value, onChange, disabled, error } = props;

    if (!this._fieldSet) {
      return (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          フィールドセットが設定されていません
        </div>
      );
    }

    const handleFieldChange = (fieldId: string, fieldValue: unknown) => {
      onChange({
        ...value,
        [fieldId]: fieldValue,
      });
    };

    return (
      <div className="space-y-3">
        {this._fieldSet.fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.renderEditor({
              value: value[field.id] ?? field.getDefaultValue(),
              onChange: (newValue) => handleFieldChange(field.id, newValue),
              disabled,
            })}
          </div>
        ))}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
}
