/**
 * 音声フィールドタイプ
 *
 * アセットから音声を選択するフィールド
 * 値はアセットID（string）またはnull
 */

import type { ReactNode } from 'react';

import { AudioFieldEditor } from '@/features/data-editor/components/fields/AudioFieldEditor';
import { AudioFieldConfig } from '@/features/data-editor/components/fields/AudioFieldConfig';
import {
  FieldType,
  type FieldEditorProps,
  type FieldConfigProps,
  type ValidationResult,
} from './FieldType';

/**
 * 音声フィールドタイプ
 * 値: アセットID (string) または null
 */
export class AudioFieldType extends FieldType<string | null> {
  readonly type = 'audio';
  readonly label = '音声';

  /** 初期表示フォルダID */
  initialFolderId?: string;

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
      return { valid: false, message: '音声を選択してください' };
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
  renderEditor({ value, onChange }: FieldEditorProps<string | null>): ReactNode {
    return (
      <AudioFieldEditor value={value} onChange={onChange} initialFolderId={this.initialFolderId} />
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

  renderConfig(props: FieldConfigProps): ReactNode {
    return <AudioFieldConfig initialFolderId={this.initialFolderId} onChange={props.onChange} />;
  }
}
