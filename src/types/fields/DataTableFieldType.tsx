'use client';

import type { ReactNode } from 'react';
import {
  FieldType,
  type ValidationResult,
  type FieldEditorProps,
  type FieldConfigProps,
} from './FieldType';
import { DataTableFieldEditor } from '@/features/data-editor/components/fields/DataTableFieldEditor';
import { DataTableFieldConfig } from '@/features/data-editor/components/fields/DataTableFieldConfig';

/**
 * データテーブルの行
 */
export interface DataTableRow {
  /** 参照先データエントリID */
  id: string;
  /** カラム値（列IDをキーとした値のマップ） */
  values: Record<string, unknown>;
}

/**
 * データテーブルの列定義
 */
export interface DataTableColumn {
  /** 列ID */
  id: string;
  /** 列名 */
  name: string;
  /** 列のフィールドタイプ名 */
  fieldType: string;
  /** フィールドタイプ設定 */
  config?: Record<string, unknown>;
}

/**
 * データテーブルフィールドタイプ
 *
 * 他のデータタイプのエントリを行として参照し、
 * カスタム列で追加値を管理するフィールド。
 * 属性耐性（属性→耐性%）、異常状態耐性（状態→耐性%）など、
 * データとカラム値の紐づけに使用。
 *
 * @example
 * ```typescript
 * const resistance = new DataTableFieldType();
 * resistance.id = 'element_resistance';
 * resistance.name = '属性耐性';
 * resistance.referenceTypeId = 'element_type';
 * resistance.columns = [
 *   { id: 'rate', name: '耐性率', fieldType: 'number' }
 * ];
 * ```
 */
export class DataTableFieldType extends FieldType<DataTableRow[]> {
  readonly type = 'dataTable';
  readonly label = 'データテーブル';

  /** 参照先DataType ID */
  referenceTypeId: string = '';

  /** カラム定義 */
  columns: DataTableColumn[] = [];

  getDefaultValue(): DataTableRow[] {
    return [];
  }

  validate(value: DataTableRow[]): ValidationResult {
    if (this.required && value.length === 0) {
      return { valid: false, message: '1件以上追加してください' };
    }
    return { valid: true };
  }

  serialize(value: DataTableRow[]): unknown {
    return value;
  }

  deserialize(data: unknown): DataTableRow[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(
      (item): item is DataTableRow =>
        item !== null &&
        typeof item === 'object' &&
        'id' in item &&
        typeof (item as DataTableRow).id === 'string'
    );
  }

  getValue(data: unknown): DataTableRow[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(
      (item): item is DataTableRow =>
        item !== null &&
        typeof item === 'object' &&
        'id' in item &&
        typeof (item as DataTableRow).id === 'string'
    );
  }

  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <DataTableFieldConfig
        referenceTypeId={this.referenceTypeId}
        columns={this.columns}
        context={props.context}
        onChange={props.onChange}
      />
    );
  }

  renderEditor(props: FieldEditorProps<DataTableRow[]>): ReactNode {
    return (
      <DataTableFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
        referenceTypeId={this.referenceTypeId}
        columns={this.columns}
      />
    );
  }
}
