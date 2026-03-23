'use client';

import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import { SetPropertyAction, type PropertyValueSource } from '@/types/ui/actions/SetPropertyAction';
import {
  useComponentOptions,
  getPropertyDefsForComponent,
} from '@/features/ui-editor/hooks/useComponentProperties';
import { PropertyField } from '../ComponentPropertyEditor';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: SetPropertyAction): SetPropertyAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function SetPropertyBlock({ action, onChange, onDelete, functionArgs }: ActionBlockProps) {
  const a = action as SetPropertyAction;
  const hasArgs = functionArgs && functionArgs.length > 0;

  const components = useComponentOptions(a.targetId, 'all');
  const propertyDefs = getPropertyDefsForComponent(a.component);
  const selectedDef = a.property ? propertyDefs.find((d) => d.key === a.property) : undefined;

  const valueSource = a.valueSource ?? { source: 'literal' as const, value: 0 };

  const handleFieldChange = (field: string, value: unknown) => {
    const updated = cloneAction(a);
    (updated as unknown as Record<string, unknown>)[field] = value;
    onChange(updated);
  };

  const handleComponentChange = (comp: string) => {
    const updated = cloneAction(a);
    updated.component = comp;
    updated.property = '';
    updated.valueSource = { source: 'literal', value: undefined };
    onChange(updated);
  };

  const handlePropertyChange = (prop: string) => {
    const updated = cloneAction(a);
    updated.property = prop;
    updated.valueSource = { source: 'literal', value: undefined };
    onChange(updated);
  };

  const handleValueSourceChange = (source: PropertyValueSource['source']) => {
    const updated = cloneAction(a);
    if (source === 'arg' && functionArgs && functionArgs.length > 0) {
      updated.valueSource = { source: 'arg', argId: functionArgs[0]!.id };
    } else {
      updated.valueSource = { source: 'literal', value: undefined };
    }
    onChange(updated);
  };

  const handleArgSelect = (argId: string) => {
    const updated = cloneAction(a);
    updated.valueSource = { source: 'arg', argId };
    onChange(updated);
  };

  const handleLiteralChange = (value: unknown) => {
    const updated = cloneAction(a);
    updated.valueSource = { source: 'literal', value };
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">プロパティ設定</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {/* Target object */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象</Label>
          <UIObjectSelector
            value={a.targetId}
            onChange={(id) => handleFieldChange('targetId', id)}
            className="h-7 flex-1 text-xs"
          />
        </div>

        {/* Component selection */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">コンポーネント</Label>
          <Select
            value={a.component || 'transform'}
            onValueChange={handleComponentChange}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="component-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.type} value={c.type}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property selection */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">プロパティ</Label>
          <Select
            value={a.property || '__none__'}
            onValueChange={(v) => handlePropertyChange(v === '__none__' ? '' : v)}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="property-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {propertyDefs.map((def) => (
                <SelectItem key={def.key} value={def.key}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value input */}
        {selectedDef && (
          <div className="space-y-1">
            {hasArgs && (
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs text-muted-foreground">値ソース</Label>
                <Select
                  value={valueSource.source}
                  onValueChange={(v) => handleValueSourceChange(v as PropertyValueSource['source'])}
                >
                  <SelectTrigger className="h-7 text-xs" data-testid="value-source-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="literal">固定値</SelectItem>
                    <SelectItem value="arg">引数</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {valueSource.source === 'arg' && hasArgs ? (
              <div className="flex items-center gap-2">
                <Label className="w-20 shrink-0 text-xs text-muted-foreground">引数</Label>
                <Select
                  value={valueSource.argId}
                  onValueChange={handleArgSelect}
                >
                  <SelectTrigger className="h-7 text-xs" data-testid="arg-select">
                    <SelectValue placeholder="引数を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {functionArgs!.map((arg) => (
                      <SelectItem key={arg.id} value={arg.id}>
                        {arg.name}（{arg.fieldType}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <PropertyField
                def={{ ...selectedDef, label: '値' }}
                value={valueSource.source === 'literal' ? valueSource.value : undefined}
                onChange={handleLiteralChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
