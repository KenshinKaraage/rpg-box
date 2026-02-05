/**
 * 画像フィールドタイプ
 *
 * アセットから画像を選択するフィールド
 * 値はアセットID（string）またはnull
 */

import type { ReactNode } from 'react';

import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import { FieldType, type FieldEditorProps, type ValidationResult } from './FieldType';

/**
 * 画像フィールドタイプ
 * 値: アセットID (string) または null
 */
export class ImageFieldType extends FieldType<string | null> {
  readonly type = 'image';
  readonly label = '画像';

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
      return { valid: false, message: '画像を選択してください' };
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
      <ImageFieldEditor value={value} onChange={onChange} initialFolderId={this.initialFolderId} />
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
}
