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
import { useStore } from '@/stores';
import { getScriptIcon } from '@/features/script-editor/components/IconPicker';
import type { Prefab } from '@/types/map';
import type { Component } from '@/types/components/Component';
import type { Script } from '@/types/script';

/** スクリプトのicon/colorがあればそちらを優先、なければComponentのデフォルト */
function resolveIconColor(comp: Component, scripts: Script[]): { icon?: string; color?: string } {
  const script = scripts.find((s) => s.id === comp.type && s.type === 'component');
  return {
    icon: script?.icon ?? comp.icon,
    color: script?.color ?? comp.color,
  };
}

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
  const scripts = useStore((s) => s.scripts);

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

  const handleUpdateComponent = (index: number, updates: Record<string, unknown>) => {
    const comp = components[index];
    if (!comp) return;
    const cloned = comp.clone();
    cloned.deserialize({ ...cloned.serialize(), ...updates });
    const newComponents = [...components];
    newComponents[index] = cloned;
    onUpdatePrefab(prefab.id, {
      prefab: { components: newComponents },
    });
  };

  const handleDeleteComponent = (index: number) => {
    onUpdatePrefab(prefab.id, {
      prefab: { components: components.filter((_, i) => i !== index) },
    });
  };

  // コンポーネント追加候補（スクリプトのicon/colorを優先）
  const allComponentTypes = getAllComponents().map(([type, C]) => {
    const instance = new C();
    const { icon, color } = resolveIconColor(instance, scripts);
    return { type, label: instance.label, icon, color };
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
            {allComponentTypes.map((ct) => {
              const Icon = getScriptIcon(ct.icon);
              return (
                <DropdownMenuItem key={ct.type} onClick={() => handleAddComponent(ct.type)}>
                  <Icon
                    className="mr-2 h-4 w-4"
                    style={ct.color ? { color: ct.color } : undefined}
                  />
                  {ct.label}
                </DropdownMenuItem>
              );
            })}
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
          const { icon, color } = resolveIconColor(comp, scripts);
          const Icon = getScriptIcon(icon);
          return (
            <div key={`${comp.type}-${index}`} className="border-b">
              {/* コンポーネントヘッダー */}
              <div
                className="flex items-center gap-1 px-3 py-2"
                style={color ? { backgroundColor: color + '12' } : undefined}
              >
                <button
                  className="flex flex-1 items-center gap-1 text-left text-xs font-medium"
                  onClick={() => toggleCollapsed(index)}
                  style={color ? { color } : undefined}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronUp className="h-3 w-3 shrink-0" />
                  )}
                  <Icon className="h-3.5 w-3.5 shrink-0" />
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
                    onChange: (updates) => handleUpdateComponent(index, updates),
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
