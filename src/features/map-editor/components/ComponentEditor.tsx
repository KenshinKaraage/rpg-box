'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldType } from '@/types/fields';
import { parseComponentFields } from '@/lib/componentScriptUtils';
import { useStore } from '@/stores';
import type { Prefab, PrefabComponent } from '@/types/map';

interface ComponentEditorProps {
  prefab: Prefab | null;
  onUpdatePrefab: (id: string, updates: Partial<Prefab>) => void;
}

/**
 * コンポーネントエディタ
 *
 * 選択中のプレハブに付与されたコンポーネント一覧を表示し、
 * 各コンポーネントのプロパティパネルをスクリプトのフィールド定義から生成する。
 * コンポーネントの追加・削除・フィールド値編集も行う。
 */
export function ComponentEditor({ prefab, onUpdatePrefab }: ComponentEditorProps) {
  const scripts = useStore((s) => s.scripts);
  const componentScripts = useMemo(
    () => scripts.filter((s) => s.type === 'component' && !s.parentId),
    [scripts]
  );
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

  const handleAdd = (scriptId: string) => {
    const script = componentScripts.find((s) => s.id === scriptId);
    if (!script) return;
    const fields = parseComponentFields(script.content) ?? [];
    const fieldValues = Object.fromEntries(fields.map((f) => [f.name, f.defaultValue]));
    const newComp: PrefabComponent = { scriptId, fieldValues };
    onUpdatePrefab(prefab.id, { components: [...prefab.components, newComp] });
  };

  const handleFieldChange = (compIndex: number, fieldName: string, value: unknown) => {
    const updated = prefab.components.map((c, i) =>
      i === compIndex ? { ...c, fieldValues: { ...c.fieldValues, [fieldName]: value } } : c
    );
    onUpdatePrefab(prefab.id, { components: updated });
  };

  const handleDelete = (index: number) => {
    onUpdatePrefab(prefab.id, {
      components: prefab.components.filter((_, i) => i !== index),
    });
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
        {prefab.components.map((comp, index) => {
          const script = componentScripts.find((s) => s.id === comp.scriptId);
          const fields = script ? (parseComponentFields(script.content) ?? []) : [];
          const isCollapsed = collapsed.has(index);
          const label = script?.name ?? comp.scriptId;

          return (
            <div
              key={`${comp.scriptId}-${index}`}
              className="border-b"
              data-testid={`component-${comp.scriptId}`}
            >
              {/* コンポーネントヘッダー */}
              <div className="flex items-center gap-1 px-3 py-2">
                <button
                  className="flex flex-1 items-center gap-1 text-left text-xs font-medium"
                  onClick={() => toggleCollapsed(index)}
                  aria-label={isCollapsed ? 'コンポーネントを展開' : 'コンポーネントを折り畳み'}
                  data-testid={`collapse-${comp.scriptId}`}
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
                  onClick={() => handleDelete(index)}
                  aria-label={`${label}を削除`}
                  data-testid={`delete-component-${comp.scriptId}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* フィールドエディタ */}
              {!isCollapsed && fields.length > 0 && (
                <div className="space-y-2 px-3 pb-3">
                  {fields.map((field) => {
                    const FieldClass = getFieldType(field.fieldType);
                    const fieldInstance = FieldClass ? new FieldClass() : null;
                    const currentValue = comp.fieldValues[field.name] ?? field.defaultValue;

                    return (
                      <div key={field.name} className="space-y-1">
                        <Label
                          htmlFor={`field-${index}-${field.name}`}
                          className="text-xs text-muted-foreground"
                        >
                          {field.label}
                        </Label>
                        {fieldInstance ? (
                          fieldInstance.renderEditor({
                            value: currentValue,
                            onChange: (v) => handleFieldChange(index, field.name, v),
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            未対応の型: {field.fieldType}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* スクリプトが見つからない場合 */}
              {!isCollapsed && !script && (
                <div className="px-3 pb-3 text-xs text-muted-foreground">
                  スクリプトが見つかりません: {comp.scriptId}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* コンポーネント追加 */}
      <div className="border-t p-3">
        <Select onValueChange={handleAdd} value="">
          <SelectTrigger
            className="h-8 text-xs"
            data-testid="add-component-select"
            aria-label="コンポーネントを追加"
          >
            <SelectValue placeholder="コンポーネントを追加..." />
          </SelectTrigger>
          <SelectContent>
            {componentScripts.map((script) => (
              <SelectItem key={script.id} value={script.id} className="text-xs">
                {script.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
