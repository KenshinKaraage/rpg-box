'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import { getAllComponents, getComponent } from '@/types/components';
import type { Component } from '@/types/components/Component';
import type { MapObject } from '@/types/map';

interface MapPropertyPanelProps {
  selectedObjectId: string | null;
  mapId: string;
  layerId: string | null;
}

export function MapPropertyPanel({ selectedObjectId, mapId, layerId }: MapPropertyPanelProps) {
  const maps = useStore((s) => s.maps);
  const updateObject = useStore((s) => s.updateObject);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (!selectedObjectId || !layerId) {
    return <div className="p-4 text-sm text-muted-foreground">オブジェクトを選択してください</div>;
  }

  const map = maps.find((m) => m.id === mapId);
  const layer = map?.layers.find((l) => l.id === layerId);
  const obj = layer?.objects?.find((o) => o.id === selectedObjectId);

  if (!obj) return null;

  const toggleCollapsed = (type: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleNameChange = (name: string) => {
    updateObject(mapId, layerId, obj.id, { name });
  };

  const handleComponentChange = (index: number, updates: Record<string, unknown>) => {
    const comp = obj.components[index];
    if (!comp) return;

    // Transform の位置変更時は重複チェック
    if (comp.type === 'transform' && ('x' in updates || 'y' in updates)) {
      const current = comp as unknown as { x: number; y: number };
      const newX = (updates.x as number) ?? current.x;
      const newY = (updates.y as number) ?? current.y;
      const otherObjects = layer?.objects?.filter((o) => o.id !== obj.id) ?? [];
      const occupied = otherObjects.some((o) => {
        const t = o.components.find((c) => c.type === 'transform');
        if (!t) return false;
        const pos = t as unknown as { x: number; y: number };
        return pos.x === newX && pos.y === newY;
      });
      if (occupied) return; // 被る位置には設定できない
    }

    const cloned = comp.clone();
    cloned.deserialize({ ...cloned.serialize(), ...updates });
    const newComponents = [...obj.components];
    newComponents[index] = cloned;
    updateObject(mapId, layerId, obj.id, { components: newComponents });
  };

  const handleAddComponent = (type: string) => {
    const CompClass = getComponent(type);
    if (!CompClass) return;
    // Check if already exists
    if (obj.components.some((c) => c.type === type)) return;
    const instance = new CompClass();
    const newComponents = [...obj.components, instance];
    updateObject(mapId, layerId, obj.id, { components: newComponents });
  };

  const handleDeleteComponent = (index: number) => {
    const comp = obj.components[index];
    if (!comp || comp.type === 'transform') return; // Transform is required
    const newComponents = obj.components.filter((_, i) => i !== index);
    updateObject(mapId, layerId, obj.id, { components: newComponents });
  };

  // Available components that aren't already on the object
  const existingTypes = new Set(obj.components.map((c) => c.type));
  const availableComponents = getAllComponents().filter(
    ([type]) => !existingTypes.has(type)
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header: object name */}
      <div className="border-b px-4 py-3">
        <Label htmlFor="obj-name" className="text-xs text-muted-foreground">名前</Label>
        <Input
          id="obj-name"
          value={obj.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1 h-8 text-sm"
        />
        {obj.prefabId && (
          <div className="mt-1 text-xs text-muted-foreground">
            プレハブ: {obj.prefabId}
          </div>
        )}
      </div>

      {/* Component list */}
      <div className="min-h-0 flex-1 overflow-auto">
        {obj.components.map((comp, index) => (
          <div key={comp.type} className="border-b">
            <div
              className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-accent"
              onClick={() => toggleCollapsed(comp.type)}
            >
              <span className="text-sm font-medium">{comp.label}</span>
              <div className="flex items-center gap-1">
                {comp.type !== 'transform' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteComponent(index);
                    }}
                    aria-label={`${comp.label}を削除`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                {collapsed.has(comp.type) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </div>
            </div>
            {!collapsed.has(comp.type) && (
              <div className="px-4 pb-3">
                {comp.renderPropertyPanel({
                  onChange: (updates) => handleComponentChange(index, updates),
                })}
              </div>
            )}
          </div>
        ))}

        {/* Add component */}
        {availableComponents.length > 0 && (
          <div className="p-4">
            <Select onValueChange={handleAddComponent}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="コンポーネントを追加..." />
              </SelectTrigger>
              <SelectContent>
                {availableComponents.map(([type, CompClass]) => {
                  const temp = new CompClass();
                  return (
                    <SelectItem key={type} value={type}>
                      {temp.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
