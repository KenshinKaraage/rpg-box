'use client';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapLayer } from '@/types/map';

interface LayerTabsProps {
  layers: MapLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function LayerTabs({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
}: LayerTabsProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm
            ${selectedLayerId === layer.id ? 'bg-accent' : 'hover:bg-muted'}`}
          onClick={() => onSelectLayer(layer.id)}
        >
          <span className="flex-1 truncate">{layer.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            aria-label={layer.visible !== false ? '非表示にする' : '表示する'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
          >
            {layer.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        </div>
      ))}
    </div>
  );
}
