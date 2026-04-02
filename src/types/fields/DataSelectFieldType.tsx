/**
 * データ参照フィールドタイプ
 *
 * 指定されたデータタイプのDataEntryを一件参照するフィールド
 * 値はエントリID（string）またはnull
 */

import type { ReactNode } from 'react';

import { DataSelectFieldEditor } from '@/features/data-editor/components/fields/DataSelectFieldEditor';
import { DataSelectFieldConfig } from '@/features/data-editor/components/fields/DataSelectFieldConfig';
import {
  FieldType,
  type FieldEditorProps,
  type FieldConfigProps,
  type ValidationResult,
} from './FieldType';

/**
 * データ参照フィールドタイプ
 * 値: DataEntry ID (string) または null
 */
export class DataSelectFieldType extends FieldType<string | null> {
  readonly type = 'dataSelect';
  readonly label = 'データ参照';
  readonly tsType = 'string';

  /** 参照先DataType ID */
  referenceTypeId: string = '';
  /** null（未選択）を許可するか */
  allowNull: boolean = true;

  /**
   * デフォルト値（未選択）
   */
  getDefaultValue(): string | null {
    return null;
  }

  /**
   * バリデーション
   */
  validate(value: string | null): ValidationResult {
    if (this.required && !value) {
      return { valid: false, message: 'エントリを選択してください' };
    }
    return { valid: true };
  }

  /**
   * シリアライズ
   */
  serialize(value: string | null): unknown {
    return value;
  }

  /**
   * デシリアライズ
   */
  deserialize(data: unknown): string | null {
    if (typeof data === 'string') {
      return data;
    }
    return null;
  }

  /**
   * エディタを描画
   */
  renderEditor({ value, onChange, disabled, error }: FieldEditorProps<string | null>): ReactNode {
    return (
      <DataSelectFieldEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        referenceTypeId={this.referenceTypeId}
        allowNull={this.allowNull}
      />
    );
  }

  /**
   * 値を取得
   */
  getValue(data: unknown): string | null {
    if (typeof data === 'string') {
      return data;
    }
    return null;
  }

  /**
   * フィールド設定UIを描画
   */
  renderConfig(props: FieldConfigProps): ReactNode {
    return (
      <DataSelectFieldConfig
        referenceTypeId={this.referenceTypeId}
        allowNull={this.allowNull}
        context={props.context}
        onChange={props.onChange}
      />
    );
  }
}
