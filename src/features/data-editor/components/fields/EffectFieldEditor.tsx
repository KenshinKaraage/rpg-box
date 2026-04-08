'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import type { EffectValue } from '@/types/fields/EffectFieldType';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EffectFieldEditorProps {
  value: EffectValue;
  onChange: (value: EffectValue) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * エフェクトフィールドエディタ
 * エフェクト画像選択 + フレーム設定 + アニメーションプレビュー
 */
export function EffectFieldEditor({ value, onChange, disabled, error }: EffectFieldEditorProps) {
  const assets = useStore((s) => s.assets);
  const imageAssets = assets.filter((a) => a.type === 'image');

  const update = (updates: Partial<EffectValue>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      {/* 画像選択 */}
      <div className="space-y-1">
        <Label className="text-xs">エフェクト画像</Label>
        <Select
          value={value.effectId || '__none__'}
          onValueChange={(v) => update({ effectId: v === '__none__' ? '' : v })}
          disabled={disabled}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="画像を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">なし</SelectItem>
            {imageAssets.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* フレーム設定 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">フレーム幅</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={value.frameWidth}
            min={0}
            onChange={(e) => update({ frameWidth: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">フレーム高さ</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={value.frameHeight}
            min={0}
            onChange={(e) => update({ frameHeight: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">フレーム数</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={value.frameCount}
            min={1}
            onChange={(e) => update({ frameCount: parseInt(e.target.value) || 1 })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">間隔(ms)</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={value.intervalMs}
            min={1}
            onChange={(e) => update({ intervalMs: parseInt(e.target.value) || 100 })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* プレビュー */}
      {value.effectId && value.frameWidth > 0 && value.frameHeight > 0 && (
        <EffectPreview
          assetId={value.effectId}
          frameWidth={value.frameWidth}
          frameHeight={value.frameHeight}
          frameCount={value.frameCount}
          intervalMs={value.intervalMs}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/**
 * エフェクトアニメーションプレビュー
 */
function EffectPreview({
  assetId,
  frameWidth,
  frameHeight,
  frameCount,
  intervalMs,
}: {
  assetId: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  intervalMs: number;
}) {
  const assets = useStore((s) => s.assets);
  const asset = assets.find((a) => a.id === assetId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  // アニメーションループ
  useEffect(() => {
    if (frameCount <= 1) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, intervalMs);
    return () => clearInterval(id);
  }, [frameCount, intervalMs]);

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !asset?.data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = asset.data as string;
    img.onload = () => {
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(
        img,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
    };
    // キャッシュ済みの場合
    if (img.complete && img.naturalWidth > 0) {
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(
        img,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
    }
  }, [asset, frame, frameWidth, frameHeight]);

  if (!asset?.data) return null;

  return (
    <div className="space-y-1">
      <Label className="text-xs">プレビュー</Label>
      <div className="flex items-center justify-center rounded border bg-black p-2">
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}
