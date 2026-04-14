'use client';

import { useEffect, useRef } from 'react';

/** スプライトの1フレーム目を Canvas で切り出して表示 */
export function SpriteThumbnail({
  src,
  fw,
  fh,
  size,
}: {
  src: string;
  fw: number;
  fh: number;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const img = new Image();
    img.onload = () => {
      const srcW = fw || img.width;
      const srcH = fh || img.height;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, size, size);
    };
    img.src = src;
  }, [src, fw, fh, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}
