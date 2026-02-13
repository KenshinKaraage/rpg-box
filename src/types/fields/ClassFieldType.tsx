import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { ClassFieldConfig } from '@/features/data-editor/components/fields/ClassFieldConfig';
import { ClassFieldEditor } from '@/features/data-editor/components/fields/ClassFieldEditor';
import type { CustomClass } from '@/types/customClass';

/**
 * クラス値の型
 */
export type ClassValue = Record<string, unknown>;

/**
 * クラスフィールドタイプ
 *
 * 他のクラスを参照し、そのフィールドを展開表示するフィールド。
 * 複数のフィールドをグループ化して再利用する際に使用。
 *
 * @example
 * ```typescript
 * const statusField = new ClassFieldType();
 * statusField.id = 'base_status';
 * statusField.name = '基本ステータス';
 * statusField.classId = 'class_status'; // ステータスクラスを参照
 * ```
 */
export class ClassFieldType extends FieldType<ClassValue> {
  readonly type = 'class';
  readonly label = 'クラス';

  /** 参照するクラスID */
  classId: string = '';

  /** クラス（実行時に設定） */
  private _class: CustomClass | null = null;

  /**
   * クラスを設定
   * エディタ描画時に呼び出す
   */
  setClass(customClass: CustomClass): void {
    this._class = customClass;
  }

  /**
   * クラスを取得
   */
  getClass(): CustomClass | null {
    return this._class;
  }

  getDefaultValue(): ClassValue {
    return {};
  }

  validate(value: ClassValue): ValidationResult {
    // 必須チェック
    if (this.required && Object.keys(value).length === 0) {
      return { valid: false, message: '値を入力してください' };
    }

    // 各フィールドのバリデーション
    if (this._class) {
      for (const field of this._class.fields) {
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

  serialize(value: ClassValue): unknown {
    if (!this._class) {
      return value;
    }

    const serialized: ClassValue = {};
    for (const field of this._class.fields) {
      const fieldValue = value[field.id];
      if (fieldValue !== undefined) {
        serialized[field.id] = field.serialize(fieldValue);
      }
    }
    return serialized;
  }

  deserialize(data: unknown): ClassValue {
    if (data === null || data === undefined) {
      return {};
    }
    if (typeof data !== 'object') {
      return {};
    }

    if (!this._class) {
      return data as ClassValue;
    }

    const deserialized: ClassValue = {};
    const dataObj = data as Record<string, unknown>;
    for (const field of this._class.fields) {
      const fieldData = dataObj[field.id];
      if (fieldData !== undefined) {
        deserialized[field.id] = field.deserialize(fieldData);
      }
    }
    return deserialized;
  }

  getValue(data: unknown): ClassValue {
    if (data === null || data === undefined) {
      return this.getDefaultValue();
    }
    if (typeof data !== 'object') {
      return this.getDefaultValue();
    }
    return data as ClassValue;
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <ClassFieldConfig classId={this.classId} context={props.context} onChange={props.onChange} />
    );
  }

  renderEditor(props: FieldEditorProps<ClassValue>): ReactNode {
    return (
      <ClassFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        classId={this.classId}
      />
    );
  }
}
