'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/stores';

interface SpriteAnimPreviewProps {
  imageId?: string;
  spriteMode: 'single' | 'directional';
  frameWidth: number;
  frameHeight: number;
  animFrameCount: number;
  animIntervalMs: number;
  animFramePattern: number[];
}

/**
 * スプライトアニメーションプレビュー
 * - single モード: 1行でアニメーション表示
 * - directional モード: 上下左右の4方向を同時プレビュー
 */
export function SpriteAnimPreview({
  imageId,
  spriteMode,
  frameWidth,
  frameHeight,
  animFrameCount,
  animIntervalMs,
  animFramePattern,
}: SpriteAnimPreviewProps) {
  const assets = useStore((s) => s.assets);
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const asset = imageId ? assets.find((a) => a.id === imageId) : null;
  const dataUrl = (asset?.data as string) ?? null;

  // 実効パターン: 指定があればそれ、なければ線形
  const pattern = animFramePattern.length > 0
    ? animFramePattern
    : Array.from({ length: animFrameCount }, (_, i) => i);

  // アニメーションタイマー
  useEffect(() => {
    if (!dataUrl || pattern.length <= 1) return;
    timerRef.current = setInterval(() => {
      setStep((prev) => (prev + 1) % pattern.length);
    }, animIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dataUrl, pattern.length, animIntervalMs]);

  // パラメータ変更時にリセット
  useEffect(() => {
    setStep(0);
  }, [imageId, frameWidth, frameHeight, animFrameCount, animFramePattern.length]);

  if (!dataUrl || frameWidth <= 0 || frameHeight <= 0) {
    return <div className="text-[10px] text-muted-foreground p-2">画像未設定</div>;
  }

  const currentFrame = pattern[step % pattern.length] ?? 0;

  if (spriteMode === 'directional') {
    // 4方向: row 0=下, 1=左, 2=右, 3=上
    const directions = [
      { label: '下', row: 0 },
      { label: '左', row: 1 },
      { label: '右', row: 2 },
      { label: '上', row: 3 },
    ];
    return (
      <div className="space-y-1 rounded border p-2">
        <div className="text-[10px] text-muted-foreground">プレビュー（{pattern[step % pattern.length]}フレーム）</div>
        <div className="flex gap-2 justify-center">
          {directions.map((dir) => (
            <div key={dir.label} className="flex flex-col items-center gap-0.5">
              <div
                style={{
                  width: frameWidth,
                  height: frameHeight,
                  backgroundImage: `url(${dataUrl})`,
                  backgroundPosition: `-${currentFrame * frameWidth}px -${dir.row * frameHeight}px`,
                  backgroundSize: 'auto',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                }}
              />
              <span className="text-[9px] text-muted-foreground">{dir.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // single モード
  return (
    <div className="space-y-1 rounded border p-2">
      <div className="text-[10px] text-muted-foreground">プレビュー（{currentFrame}フレーム）</div>
      <div className="flex justify-center">
        <div
          style={{
            width: frameWidth,
            height: frameHeight,
            backgroundImage: `url(${dataUrl})`,
            backgroundPosition: `-${currentFrame * frameWidth}px 0px`,
            backgroundSize: 'auto',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
