/**
 * 画像フィールドタイプ
 *
 * アセットから画像を選択するフィールド
 * 値はアセットID（string）またはnull
 */

import type { ReactNode } from 'react';

import { FieldType, type FieldEditorProps, type ValidationResult } from './FieldType';

/**
 * 画像フィールドタイプ
 * 値: アセットID (string) または null
 */
export class ImageFieldType extends FieldType<string | null> {
  readonly type = 'image';
  readonly label = '画像';

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
   * TODO: AssetPickerModal との連携
   */
  renderEditor({ value, onChange }: FieldEditorProps<string | null>): ReactNode {
    return (
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex items-center gap-2 rounded border bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">画像ID:</span>
            <span>{value}</span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-2 text-destructive hover:underline"
            >
              解除
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              // TODO: AssetPickerModal を開く
              // 仮実装: プロンプトでIDを入力
              const assetId = window.prompt('アセットIDを入力');
              if (assetId) {
                onChange(assetId);
              }
            }}
            className="rounded border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            画像を選択...
          </button>
        )}
      </div>
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
