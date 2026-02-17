'use client';

import type { ReactNode } from 'react';
import {
  FieldType,
  type ValidationResult,
  type FieldEditorProps,
  type FieldConfigProps,
} from './FieldType';
import type { ClassValue } from './ClassFieldType';
import { ClassFieldConfig } from '@/features/data-editor/components/fields/ClassFieldConfig';
import { ClassListFieldEditor } from '@/features/data-editor/components/fields/ClassListFieldEditor';

/**
 * クラスリストフィールドタイプ
 *
 * クラスの複数インスタンスを配列で管理するフィールド。
 * 習得スキル（レベル+スキル）、ドロップアイテム（アイテム+確率）など、
 * 同一クラス構造の複数レコードを持つ場合に使用。
 *
 * @example
 * ```typescript
 * const learnedSkills = new ClassListFieldType();
 * learnedSkills.id = 'learned_skills';
 * learnedSkills.name = '習得スキル';
 * learnedSkills.classId = 'class_learned_skill';
 * ```
 */
export class ClassListFieldType extends FieldType<ClassValue[]> {
  readonly type = 'classList';
  readonly label = 'クラスリスト';
  readonly tsType = 'Record<string, unknown>[]';

  /** 参照するクラスID */
  classId: string = '';

  getDefaultValue(): ClassValue[] {
    return [];
  }

  validate(value: ClassValue[]): ValidationResult {
    if (this.required && value.length === 0) {
      return { valid: false, message: '1件以上追加してください' };
    }
    return { valid: true };
  }

  serialize(value: ClassValue[]): unknown {
    return value;
  }

  deserialize(data: unknown): ClassValue[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter((item): item is ClassValue => item !== null && typeof item === 'object');
  }

  getValue(data: unknown): ClassValue[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter((item): item is ClassValue => item !== null && typeof item === 'object');
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <ClassFieldConfig classId={this.classId} context={props.context} onChange={props.onChange} />
    );
  }

  renderEditor(props: FieldEditorProps<ClassValue[]>): ReactNode {
    return (
      <ClassListFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        classId={this.classId}
      />
    );
  }
}
