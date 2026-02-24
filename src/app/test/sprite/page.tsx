'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { importDefaultAssets } from '@/lib/importDefaultAssets';
import type { ImageMetadata } from '@/types/assets';

const CHIP_COLUMNS = 8; // ソースなし時のプレースホルダー列数
const DISPLAY_SIZE = 32;

type ImageSource =
  | { kind: 'file'; data: string; width: number; height: number }
  | { kind: 'asset'; assetId: string; data: string; width: number; height: number };

export default function SpriteTestPage() {
  const [source, setSource] = useState<ImageSource | null>(null);
  const [tileWidth, setTileWidth] = useState(32);
  const [tileHeight, setTileHeight] = useState(32);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [isImporting, setIsImporting] = useState(false);

  const assets = useStore((state) => state.assets);
  const assetFolders = useStore((state) => state.assetFolders);
  const addAsset = useStore((state) => state.addAsset);
  const addFolder = useStore((state) => state.addFolder);
  const imageAssets = useMemo(() => assets.filter((a) => a.type === 'image'), [assets]);

  const handleImportDefaults = async () => {
    setIsImporting(true);
    try {
      await importDefaultAssets(assets, addAsset, addFolder, assetFolders);
    } finally {
      setIsImporting(false);
    }
  };

  // ── ファイルアップロード ──────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      // new Image() で寸法取得（ファイル由来は metadata がないため）
      const img = new Image();
      img.onload = () => {
        setSource({ kind: 'file', data, width: img.naturalWidth, height: img.naturalHeight });
        setSelectedIndex(null);
      };
      img.src = data;
    };
    reader.readAsDataURL(file);
  };

  // ── ストアのアセットから選択 ──────────────────────────
  const handleAssetSelect = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    // ChipsetEditor と同じ経路: metadata から width/height を読む
    const meta = asset.metadata as ImageMetadata | null;
    if (!meta?.width || !meta?.height) {
      alert(`アセット "${asset.name}" のメタデータに幅・高さがありません`);
      return;
    }
    setSource({ kind: 'asset', assetId, data: asset.data, width: meta.width, height: meta.height });
    setSelectedIndex(null);
  };

  // ── チップ数計算（ソースなし時はプレースホルダー）──
  const cols = source ? Math.max(1, Math.floor(source.width / tileWidth)) : CHIP_COLUMNS;
  const rows = source ? Math.max(1, Math.floor(source.height / tileHeight)) : 8;
  const chipCount = cols * rows;

  // ── チップスタイル計算（ChipsetEditor と同じロジック）──
  const chipStyles = useMemo<(React.CSSProperties | null)[]>(() => {
    if (!source) return Array(CHIP_COLUMNS * 8).fill(null);
    const scale = DISPLAY_SIZE / tileWidth;
    const c = Math.max(1, Math.floor(source.width / tileWidth));
    const r = Math.max(1, Math.floor(source.height / tileHeight));
    const count = c * r;
    console.log('[chipStyles] source:', {
      kind: source.kind,
      width: source.width,
      height: source.height,
      dataLen: source.data.length,
    });
    console.log('[chipStyles] scale:', scale, 'cols:', c, 'rows:', r, 'count:', count);
    return Array.from({ length: count }, (_, i) => ({
      backgroundImage: `url(${source.data})`,
      backgroundSize: `${source.width * scale}px ${source.height * scale}px`,
      backgroundPosition: `-${(i % c) * DISPLAY_SIZE}px -${Math.floor(i / c) * DISPLAY_SIZE}px`,
      backgroundRepeat: 'no-repeat',
    }));
  }, [source, tileWidth, tileHeight]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-bold">スプライト表示テスト</h1>
      <p className="text-sm text-muted-foreground">
        ChipsetEditor の sprite 表示ロジックの動作確認用ページです。
      </p>

      {/* ── 画像ソース選択 ── */}
      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">画像ソース</p>

        {/* ① ファイルアップロード */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">① ファイルから直接読み込み</Label>
          <Input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* ② ストアのアセットから選択 */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            ② ストアの画像アセットから選択（ChipsetEditor と同じ経路）
          </Label>
          {imageAssets.length === 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">画像アセットがありません</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleImportDefaults}
                disabled={isImporting}
              >
                {isImporting ? 'インポート中...' : 'デフォルトをインポート'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {imageAssets.map((a) => {
                const meta = a.metadata as ImageMetadata | null;
                const isSelected = source?.kind === 'asset' && source.assetId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleAssetSelect(a.id)}
                    className={[
                      'rounded border px-3 py-1.5 text-xs',
                      isSelected
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-border hover:bg-muted',
                    ].join(' ')}
                  >
                    {a.name}
                    {meta ? (
                      <span className="ml-1 text-muted-foreground">
                        ({meta.width}×{meta.height})
                      </span>
                    ) : (
                      <span className="ml-1 text-destructive">metadata なし</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* タイルサイズ */}
        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">タイル幅 (px)</Label>
            <Input
              type="number"
              value={tileWidth}
              min={1}
              onChange={(e) => setTileWidth(parseInt(e.target.value, 10) || 32)}
              className="w-24"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">タイル高さ (px)</Label>
            <Input
              type="number"
              value={tileHeight}
              min={1}
              onChange={(e) => setTileHeight(parseInt(e.target.value, 10) || 32)}
              className="w-24"
            />
          </div>
          {source && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSource(null);
                setSelectedIndex(null);
              }}
            >
              リセット
            </Button>
          )}
        </div>

        {/* 現在のソース情報 */}
        {source && (
          <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {source.kind === 'file' ? '📁 ファイル' : '🗂 アセット'}
            </span>
            　{source.width} × {source.height}px　→　{cols} 列 × {rows} 行 = {chipCount} チップ
          </div>
        )}
      </div>

      {/* ── 診断: 先頭 min(8, chipCount) チップを div で直接レンダリング ── */}
      {chipStyles[0] && (
        <div className="space-y-1 rounded-lg border border-dashed p-3">
          <p className="text-xs font-medium text-muted-foreground">
            診断: 先頭 {Math.min(8, chipStyles.length)} チップを &lt;div&gt; で直接表示
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.min(8, chipStyles.length) }, (_, i) => (
              <div
                key={i}
                style={{
                  ...chipStyles[i],
                  width: 32,
                  height: 32,
                  border: '1px solid #ccc',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            source: {source?.width}×{source?.height}px | data length: {source?.data.length}
          </p>
          <pre className="text-xs text-muted-foreground">
            {JSON.stringify(
              {
                ...chipStyles[0],
                backgroundImage: chipStyles[0]?.backgroundImage?.slice(0, 60) + '…',
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* ── チップグリッド ── */}
      <div className="space-y-2">
        <Label className="text-sm">
          チップグリッド（{source ? `${chipCount} チップ / ` : ''}
          {DISPLAY_SIZE}×{DISPLAY_SIZE}px）
        </Label>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${cols}, ${DISPLAY_SIZE}px)` }}
        >
          {Array.from({ length: chipCount }, (_, i) => {
            const style = chipStyles[i] ?? null;
            const isSelected = selectedIndex === i;
            return (
              <button
                key={i}
                className={[
                  'relative overflow-hidden rounded border text-xs',
                  isSelected ? 'border-primary ring-1 ring-primary' : 'border-border',
                  !style ? 'flex items-center justify-center bg-muted/30' : '',
                ].join(' ')}
                style={
                  style
                    ? { ...style, width: `${DISPLAY_SIZE}px`, height: `${DISPLAY_SIZE}px` }
                    : { width: `${DISPLAY_SIZE}px`, height: `${DISPLAY_SIZE}px` }
                }
                onClick={() => setSelectedIndex(i === selectedIndex ? null : i)}
                title={`チップ #${i}  (col=${i % cols}, row=${Math.floor(i / cols)})`}
              >
                {!style && <span className="text-[10px] text-muted-foreground/50">{i}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 選択チップの詳細 ── */}
      {selectedIndex !== null && (
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-semibold">チップ #{selectedIndex} の CSS</p>
          {chipStyles[selectedIndex] ? (
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(
                {
                  ...chipStyles[selectedIndex],
                  backgroundImage:
                    (chipStyles[selectedIndex]?.backgroundImage?.length ?? 0) > 80
                      ? chipStyles[selectedIndex]?.backgroundImage?.slice(0, 80) + '…'
                      : chipStyles[selectedIndex]?.backgroundImage,
                },
                null,
                2
              )}
            </pre>
          ) : (
            <p className="text-muted-foreground">画像未設定</p>
          )}
          {source && (
            <p className="text-xs text-muted-foreground">
              scale = {DISPLAY_SIZE} / {tileWidth} = {(DISPLAY_SIZE / tileWidth).toFixed(3)}
            </p>
          )}
        </div>
      )}

      {/* ── 元画像プレビュー ── */}
      {source && (
        <div className="space-y-2">
          <Label className="text-sm">元画像</Label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source.data} alt="original" className="max-w-full rounded border" />
        </div>
      )}
    </div>
  );
}
