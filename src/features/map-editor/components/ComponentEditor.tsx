'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAllComponents } from '@/types/components';
import type { Prefab } from '@/types/map';

interface ComponentEditorProps {
  prefab: Prefab | null;
  onUpdatePrefab: (id: string, updates: Partial<Prefab>) => void;
}

/**
 * プレハブコンポーネントエディタ
 *
 * Component[] を直接編集する。MapPropertyPanel と同じパターンで
 * 各 Component の renderPropertyPanel() を使用。
 */
export function ComponentEditor({ prefab, onUpdatePrefab }: ComponentEditorProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  if (!prefab) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        プレハブを選択してください
      </div>
    );
  }

  const components = prefab.prefab.components;

  const toggleCollapsed = (index: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddComponent = (type: string) => {
    const entry = getAllComponents().find(([t]) => t === type);
    if (!entry) return;
    const [, CompClass] = entry;
    const instance = new CompClass();
    onUpdatePrefab(prefab.id, {
      prefab: { components: [...components, instance] },
    });
  };

  const handleUpdateComponent = () => {
    // Force re-render by creating new array with same references
    // (component was mutated by its property panel)
    onUpdatePrefab(prefab.id, {
      prefab: { components: [...components] },
    });
  };

  const handleDeleteComponent = (index: number) => {
    onUpdatePrefab(prefab.id, {
      prefab: { components: components.filter((_, i) => i !== index) },
    });
  };

  // コンポーネント追加候補
  const allComponentTypes = getAllComponents().map(([type, C]) => {
    const instance = new C();
    return { type, label: instance.label };
  });

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <div>
          <h2 className="text-sm font-semibold">{prefab.name}</h2>
          <p className="text-xs text-muted-foreground">{components.length} コンポーネント</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3 w-3" />
              追加
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allComponentTypes.map((ct) => (
              <DropdownMenuItem key={ct.type} onClick={() => handleAddComponent(ct.type)}>
                {ct.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* コンポーネント一覧 */}
      <div className="flex-1 overflow-auto">
        {components.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            コンポーネントがありません
          </div>
        )}
        {components.map((comp, index) => {
          const isCollapsed = collapsed.has(index);
          return (
            <div key={`${comp.type}-${index}`} className="border-b">
              {/* コンポーネントヘッダー */}
              <div className="flex items-center gap-1 px-3 py-2">
                <button
                  className="flex flex-1 items-center gap-1 text-left text-xs font-medium"
                  onClick={() => toggleCollapsed(index)}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  {comp.label}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComponent(index)}
                  aria-label={`${comp.label}を削除`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* プロパティパネル */}
              {!isCollapsed && (
                <div className="px-3 pb-3">
                  {comp.renderPropertyPanel({
                    onChange: () => handleUpdateComponent(),
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
