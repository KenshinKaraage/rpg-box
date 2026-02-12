/**
 * 音声アセットタイプ
 */

import type { ReactNode } from 'react';
import { AssetType, type BaseAssetMetadata, type ValidationResult } from './AssetType';

/**
 * 音声メタデータ
 */
export interface AudioMetadata extends BaseAssetMetadata {
  /** 再生時間（秒） */
  duration?: number;
}

/**
 * 音声アセットタイプ
 */
export class AudioAssetType extends AssetType<AudioMetadata> {
  readonly type = 'audio';
  readonly label = '音声';
  readonly extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'];

  /**
   * ファイルからメタデータを抽出
   */
  async extractMetadata(file: File): Promise<AudioMetadata> {
    return new Promise((resolve) => {
      const metadata: AudioMetadata = {
        fileSize: file.size,
      };

      // Audioで再生時間を取得（ブラウザ環境のみ）
      if (typeof Audio !== 'undefined') {
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        audio.addEventListener('loadedmetadata', () => {
          metadata.duration = audio.duration;
          URL.revokeObjectURL(url);
          resolve(metadata);
        });

        audio.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          resolve(metadata); // エラー時もファイルサイズだけで返す
        });

        audio.src = url;
      } else {
        resolve(metadata);
      }
    });
  }

  /**
   * プレビューを描画
   */
  renderPreview(data: string, metadata: AudioMetadata): ReactNode {
    const durationStr = metadata.duration ? formatDuration(metadata.duration) : '--:--';

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
          🎵
        </div>
        <span className="text-sm text-muted-foreground">{durationStr}</span>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio src={data} controls className="w-full max-w-xs" />
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

/**
 * 秒数をMM:SS形式にフォーマット
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
