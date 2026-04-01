'use client';
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
  const fw = sprite.frameWidth || 0;
  const fh = sprite.frameHeight || 0;
  if (fw === 0 || fh === 0) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="shrink-0" style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} />;
  }
  const scale = size / fh;
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          display: 'block',
          width: 'auto',
          height: 'auto',
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      />
    </div>
  );
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
          <ObjectThumbnail obj={obj} size={20} />
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
