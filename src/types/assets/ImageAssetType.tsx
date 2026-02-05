/**
 * 画像アセットタイプ
 */

import type { ReactNode } from 'react';

import { AssetType, type BaseAssetMetadata } from './AssetType';

/**
 * 画像メタデータ
 */
export interface ImageMetadata extends BaseAssetMetadata {
  /** 画像の幅（px） */
  width: number;
  /** 画像の高さ（px） */
  height: number;
}

/**
 * 画像アセットタイプ
 */
export class ImageAssetType extends AssetType<ImageMetadata> {
  readonly type = 'image';
  readonly label = '画像';
  readonly extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

  /**
   * 画像ファイルからメタデータを抽出
   */
  async extractMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();

        img.onload = () => {
          resolve({
            fileSize: file.size,
            width: img.width,
            height: img.height,
          });
        };

        img.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'));
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * 画像プレビューを描画
   */
  renderPreview(data: string, metadata: ImageMetadata): ReactNode {
    return (
      <div className="flex flex-col items-center gap-2">
        {/* Base64 data URLのため、next/imageではなくimgを使用 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data} alt="" className="max-h-64 max-w-full object-contain" />
        <div className="text-xs text-muted-foreground">
          {metadata.width} × {metadata.height} px
        </div>
      </div>
    );
  }
}
