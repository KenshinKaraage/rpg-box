'use client';

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getComponent } from '@/types/components';
import '@/types/components/register';
import type { Prefab } from '@/types/map';

/** コンポーネントタイプの表示名マッピング */
const COMPONENT_LABELS: Record<string, string> = {
  transform: 'Transform（位置・回転・スケール）',
  sprite: 'Sprite（スプライト）',
  collider: 'Collider（当たり判定）',
  movement: 'Movement（移動）',
  variables: 'Variables（変数）',
  controller: 'Controller（操作）',
  effect: 'Effect（エフェクト）',
  objectCanvas: 'ObjectCanvas（UI）',
  talkTrigger: 'Talk Trigger（話しかけ）',
  touchTrigger: 'Touch Trigger（接触）',
  stepTrigger: 'Step Trigger（踏み込み）',
  autoTrigger: 'Auto Trigger（自動）',
  inputTrigger: 'Input Trigger（キー入力）',
};

/** カテゴリ分類 */
const COMPONENT_CATEGORIES: { label: string; types: string[] }[] = [
  { label: '基本', types: ['transform', 'sprite', 'collider'] },
  { label: '動作', types: ['movement', 'controller', 'effect', 'objectCanvas', 'variables'] },
  {
    label: 'トリガー',
    types: ['talkTrigger', 'touchTrigger', 'stepTrigger', 'autoTrigger', 'inputTrigger'],
  },
];

interface ComponentEditorProps {
  prefab: Prefab | null;
  onUpdatePrefab: (id: string, updates: Partial<Prefab>) => void;
}

/**
 * コンポーネントエディタ
 *
 * 選択中のプレハブに付与されたコンポーネント一覧を表示し、
 * 各コンポーネントのプロパティパネルを呼び出す。
 * コンポーネントの追加・削除も行う（T157 + T158 統合）。
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

  const toggleCollapsed = (index: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleComponentChange = (index: number, updates: Record<string, unknown>) => {
    const updatedComponents = prefab.components.map((c, i) => {
      if (i !== index) return c;
      const cloned = c.clone();
      Object.assign(cloned, updates);
      return cloned;
    });
    onUpdatePrefab(prefab.id, { components: updatedComponents });
  };

  const handleDeleteComponent = (index: number) => {
    const updatedComponents = prefab.components.filter((_, i) => i !== index);
    onUpdatePrefab(prefab.id, { components: updatedComponents });
  };

  const handleAddComponent = (type: string) => {
    const Constructor = getComponent(type);
    if (!Constructor) return;
    const newComponent = new Constructor();
    onUpdatePrefab(prefab.id, { components: [...prefab.components, newComponent] });
  };

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">{prefab.name}</h2>
        <p className="text-xs text-muted-foreground">{prefab.components.length} コンポーネント</p>
      </div>

      {/* コンポーネント一覧 */}
      <div className="flex-1 overflow-auto">
        {prefab.components.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            コンポーネントがありません
          </div>
        )}
        {prefab.components.map((component, index) => {
          const label = COMPONENT_LABELS[component.type] ?? component.type;
          const isCollapsed = collapsed.has(index);
          const panel = component.renderPropertyPanel({
            onChange: (updates) => handleComponentChange(index, updates),
          });

          return (
            <div key={index} className="border-b" data-testid={`component-${component.type}`}>
              {/* コンポーネントヘッダー */}
              <div className="flex items-center gap-1 px-3 py-2">
                <button
                  className="flex flex-1 items-center gap-1 text-left text-xs font-medium"
                  onClick={() => toggleCollapsed(index)}
                  aria-label={isCollapsed ? 'コンポーネントを展開' : 'コンポーネントを折り畳み'}
                  data-testid={`collapse-${component.type}`}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  {label}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComponent(index)}
                  aria-label={`${label}を削除`}
                  data-testid={`delete-component-${component.type}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* プロパティパネル */}
              {!isCollapsed && panel && <div className="px-3 pb-3">{panel}</div>}
            </div>
          );
        })}
      </div>

      {/* コンポーネント追加 */}
      <div className="border-t p-3">
        <Select onValueChange={handleAddComponent} value="">
          <SelectTrigger className="h-8 text-xs" data-testid="add-component-select">
            <SelectValue placeholder="コンポーネントを追加..." />
          </SelectTrigger>
          <SelectContent>
            {COMPONENT_CATEGORIES.map((category) => (
              <div key={category.label}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {category.label}
                </div>
                {category.types.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    {COMPONENT_LABELS[type] ?? type}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
