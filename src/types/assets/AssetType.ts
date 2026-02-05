/**
 * アセットタイプ基底クラス
 *
 * FieldTypeと同じ継承+レジストリパターンで拡張性を確保
 * - 新しいアセットタイプはこのクラスを継承
 * - registerAssetType()でレジストリに登録
 */

import type { ReactNode } from 'react';

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 基本メタデータ（全アセットタイプ共通）
 */
export interface BaseAssetMetadata {
  /** ファイルサイズ（バイト） */
  fileSize: number;
}

/**
 * アセットタイプ基底クラス
 *
 * @template M メタデータの型
 */
export abstract class AssetType<M extends BaseAssetMetadata = BaseAssetMetadata> {
  /** アセットタイプ識別子（'image', 'audio' など） */
  abstract readonly type: string;

  /** UI表示用ラベル（'画像', '音声' など） */
  abstract readonly label: string;

  /** 対応する拡張子（'.png', '.jpg' など） */
  abstract readonly extensions: string[];

  /**
   * ファイルからメタデータを抽出
   * @param file 対象ファイル
   * @returns メタデータ
   */
  abstract extractMetadata(file: File): Promise<M>;

  /**
   * プレビューを描画
   * @param data Base64またはURL
   * @param metadata メタデータ
   * @returns React要素
   */
  abstract renderPreview(data: string, metadata: M): ReactNode;

  /**
   * ファイルのバリデーション
   * デフォルト実装は拡張子チェックのみ
   * @param file 対象ファイル
   * @returns バリデーション結果
   */
  validate(file: File): ValidationResult {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.extensions.includes(ext)) {
      return {
        valid: false,
        message: `対応形式: ${this.extensions.join(', ')}`,
      };
    }
    return { valid: true };
  }

  /**
   * メタデータをシリアライズ
   * @param metadata メタデータ
   * @returns シリアライズされたデータ
   */
  serializeMetadata(metadata: M): unknown {
    return metadata;
  }

  /**
   * メタデータをデシリアライズ
   * @param data シリアライズされたデータ
   * @returns メタデータ
   */
  deserializeMetadata(data: unknown): M {
    return data as M;
  }
}
