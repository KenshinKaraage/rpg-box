'use client';
import { useEffect, useRef } from 'react';
import { Trash2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import type { MapObject } from '@/types/map';
import type { SpriteComponent } from '@/types/components/SpriteComponent';

interface MapObjectListProps {
  objects: MapObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
}

function SpriteThumbnail({ src, fw, fh, size }: { src: string; fw: number; fh: number; size: number }) {
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
  return <canvas ref={canvasRef} width={size} height={size} className="shrink-0" style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

function ObjectThumbnail({ obj, size }: { obj: MapObject; size: number }) {
  const assets = useStore((s) => s.assets);
  const sprite = obj.components.find((c) => c.type === 'sprite') as SpriteComponent | undefined;
  if (!sprite?.imageId) {
    return <Square className="shrink-0 text-muted-foreground" style={{ width: size, height: size }} />;
  }
  const asset = assets.find((a) => a.id === sprite.imageId);
  const src = asset?.data as string | undefined;
  if (!src) {
    return <Square className="shrink-0 text-muted-foreground" style={{ width: size, height: size }} />;
  }
  return <SpriteThumbnail src={src} fw={sprite.frameWidth || 0} fh={sprite.frameHeight || 0} size={size} />;
}

export function MapObjectList({
  objects,
  selectedObjectId,
  onSelectObject,
  onDeleteObject,
}: MapObjectListProps) {
  if (objects.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">オブジェクトなし</div>;
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {objects.map((obj) => (
        <div
          key={obj.id}
          className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm
            ${selectedObjectId === obj.id ? 'bg-accent' : 'hover:bg-muted'}`}
          onClick={() => onSelectObject(obj.id)}
        >
          <ObjectThumbnail obj={obj} size={32} />
          <span className="flex-1 truncate">{obj.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            aria-label={`${obj.name}を削除`}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteObject(obj.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
