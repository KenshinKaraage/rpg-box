'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Music, X, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { AssetPickerModal } from '@/features/asset-manager';

interface AudioFieldEditorProps {
  /** 選択中のアセットID */
  value: string | null;
  /** 値変更ハンドラ */
  onChange: (value: string | null) => void;
  /** 初期表示フォルダID */
  initialFolderId?: string;
}

/**
 * 音声フィールドエディタ
 * アセットから音声を選択するためのフィールドエディタ
 */
export function AudioFieldEditor({ value, onChange, initialFolderId }: AudioFieldEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ストアからアセットとフォルダを取得
  const assets = useStore((state) => state.assets);
  const assetFolders = useStore((state) => state.assetFolders);

  // 選択中のアセットを取得
  const selectedAsset = useMemo(
    () => (value ? assets.find((a) => a.id === value) : null),
    [assets, value]
  );

  // クリーンアップ: 値が変更されたか、コンポーネントがアンマウントされた時に音声を停止
  // 理由: Audioはブラウザの外部リソースであり、適切なクリーンアップが必要です。
  // - 値変更時: 別の音声が選択されたため、現在の再生を停止
  // - アンマウント時: コンポーネント消滅後に音声が鳴り続けるのを防ぐ
  useEffect(() => {
    setIsPlaying(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [value]);

  const handleSelect = (assetId: string | null) => {
    onChange(assetId);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  // 再生/一時停止の切り替え - イベント駆動、useEffectは不要
  // Audioインスタンスと'ended'リスナーのライフサイクルはハンドラ内で管理
  const handlePlayPause = useCallback(() => {
    if (!selectedAsset) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 既存の音声があれば先に停止
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 新しいAudioインスタンスを作成
      const audio = new Audio(selectedAsset.data);
      // 'ended'リスナーはコンポーネントのライフサイクルではなく、Audioインスタンスに紐づける
      audio.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current = audio;
      audio.play().catch(() => {
        // 自動再生の制限（ブラウザポリシー）を適切にハンドリング
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [selectedAsset, isPlaying]);

  // 未選択状態
  if (!value) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Music className="h-4 w-4" />
          音声を選択...
        </button>

        <AssetPickerModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assets={assets}
          folders={assetFolders}
          assetType="audio"
          onSelect={handleSelect}
          selectedAssetId={value}
          initialFolderId={initialFolderId}
        />
      </>
    );
  }

  // アセットが見つからない場合
  if (!selectedAsset) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-lg">
          🎵
        </div>
        <div className="flex-1">
          <p className="text-sm text-destructive">アセットが見つかりません</p>
          <p className="text-xs text-muted-foreground">ID: {value}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">クリア</span>
        </Button>
      </div>
    );
  }

  // 選択済み状態
  return (
    <>
      <div className="flex items-center gap-3">
        {/* アイコン */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted text-lg">
          🎵
        </div>

        {/* ファイル名 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm" title={selectedAsset.name}>
            {selectedAsset.name}
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlayPause}
            title={isPlaying ? '停止' : '再生'}
          >
            {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="sr-only">{isPlaying ? '停止' : '再生'}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            変更
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} title="選択解除">
            <X className="h-4 w-4" />
            <span className="sr-only">クリア</span>
          </Button>
        </div>
      </div>

      <AssetPickerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assets={assets}
        folders={assetFolders}
        assetType="audio"
        onSelect={handleSelect}
        selectedAssetId={value}
        initialFolderId={initialFolderId}
      />
    </>
  );
}
