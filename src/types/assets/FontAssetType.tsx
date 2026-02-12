/**
 * フォントアセットタイプ
 */

import type { ReactNode } from 'react';
import { AssetType, type BaseAssetMetadata, type ValidationResult } from './AssetType';

/**
 * フォントメタデータ
 */
export interface FontMetadata extends BaseAssetMetadata {
  /** フォント名（将来的に抽出可能） */
  fontFamily?: string;
}

/**
 * フォントアセットタイプ
 */
export class FontAssetType extends AssetType<FontMetadata> {
  readonly type = 'font';
  readonly label = 'フォント';
  readonly extensions = ['.ttf', '.otf', '.woff', '.woff2'];

  /**
   * ファイルからメタデータを抽出
   */
  async extractMetadata(file: File): Promise<FontMetadata> {
    return {
      fileSize: file.size,
      // フォント名の抽出は将来的に対応
    };
  }

  /**
   * プレビューを描画
   */
  renderPreview(data: string, _metadata: FontMetadata): ReactNode {
    // フォントを動的に読み込んでプレビュー表示
    const fontFaceId = `preview-font-${Date.now()}`;

    return (
      <div className="flex flex-col items-center gap-4">
        <style>
          {`
            @font-face {
              font-family: '${fontFaceId}';
              src: url('${data}');
            }
          `}
        </style>
        <div className="text-4xl" style={{ fontFamily: `'${fontFaceId}', sans-serif` }}>
          Aa あア 漢字
        </div>
        <div
          className="text-lg text-muted-foreground"
          style={{ fontFamily: `'${fontFaceId}', sans-serif` }}
        >
          The quick brown fox jumps over the lazy dog.
        </div>
      </div>
    );
  }

  /**
   * バリデーション
   */
  validate(file: File): ValidationResult {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
    if (!this.extensions.includes(ext)) {
      return {
        valid: false,
        message: `対応形式: ${this.extensions.join(', ')}`,
      };
    }
    return { valid: true };
  }
}
