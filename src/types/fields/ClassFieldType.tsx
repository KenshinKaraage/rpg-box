import type { ReactNode } from 'react';
import { FieldType, ValidationResult, FieldEditorProps, FieldConfigProps } from './FieldType';
import { ClassFieldConfig } from '@/features/data-editor/components/fields/ClassFieldConfig';
import { ClassFieldEditor } from '@/features/data-editor/components/fields/ClassFieldEditor';

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
 * classId でクラスを参照し、ClassFieldEditor がストアからクラス定義を
 * 取得してフィールドを展開表示する。validate/serialize/deserialize は
 * ClassValue（Record<string, unknown>）をパススルーする。
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

  getDefaultValue(): ClassValue {
    return {};
  }

  validate(value: ClassValue): ValidationResult {
    if (this.required && Object.keys(value).length === 0) {
      return { valid: false, message: '値を入力してください' };
    }
    return { valid: true };
  }

  serialize(value: ClassValue): unknown {
    return value;
  }

  deserialize(data: unknown): ClassValue {
    if (data === null || data === undefined) {
      return {};
    }
    if (typeof data !== 'object') {
      return {};
    }
    return data as ClassValue;
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
