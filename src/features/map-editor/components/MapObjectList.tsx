'use client';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapObject } from '@/types/map';

interface MapObjectListProps {
  objects: MapObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
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
