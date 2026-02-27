'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { MapAction } from '@/engine/actions/MapAction';

const OPERATIONS = [
  { value: 'changeMap', label: 'マップ移動' },
  { value: 'getChip', label: 'チップ取得' },
] as const;

const TRANSITIONS = [
  { value: 'fade', label: 'フェード' },
  { value: 'none', label: 'なし' },
] as const;

function cloneAction(action: MapAction): MapAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function MapActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const mapAction = action as MapAction;
  const maps = useStore((state) => state.maps);
  const variables = useStore((state) => state.variables);

  const handleOperationChange = (operation: string) => {
    const updated = cloneAction(mapAction);
    updated.operation = operation as MapAction['operation'];
    onChange(updated);
  };

  const handleStringChange = (field: keyof MapAction, value: string) => {
    const updated = cloneAction(mapAction);
    (updated as unknown as Record<string, unknown>)[field] = value;
    onChange(updated);
  };

  const handleNumberChange = (field: keyof MapAction, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const updated = cloneAction(mapAction);
    (updated as unknown as Record<string, unknown>)[field] = num;
    onChange(updated);
  };

  const handleTransitionChange = (transition: string) => {
    const updated = cloneAction(mapAction);
    updated.transition = transition as MapAction['transition'];
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">マップ操作</Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          aria-label="削除"
          data-testid="delete-action"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-24 text-xs text-muted-foreground">操作</Label>
          <Select value={mapAction.operation} onValueChange={handleOperationChange}>
            <SelectTrigger className="w-32" data-testid="operation-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mapAction.operation === 'changeMap' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">マップ</Label>
              <Select
                value={mapAction.targetMapId ?? ''}
                onValueChange={(val) => handleStringChange('targetMapId', val)}
              >
                <SelectTrigger className="flex-1" data-testid="target-map-select">
                  <SelectValue placeholder="マップを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {maps.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name || m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={mapAction.x ?? ''}
                onChange={(e) => handleNumberChange('x', e.target.value)}
                className="w-24"
                data-testid="x-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={mapAction.y ?? ''}
                onChange={(e) => handleNumberChange('y', e.target.value)}
                className="w-24"
                data-testid="y-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">遷移</Label>
              <Select value={mapAction.transition ?? 'fade'} onValueChange={handleTransitionChange}>
                <SelectTrigger className="w-32" data-testid="transition-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {mapAction.operation === 'getChip' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">ソースマップ</Label>
              <Select
                value={mapAction.sourceMapId ?? ''}
                onValueChange={(val) => handleStringChange('sourceMapId', val)}
              >
                <SelectTrigger className="flex-1" data-testid="source-map-select">
                  <SelectValue placeholder="マップを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {maps.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name || m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">チップX</Label>
              <Input
                type="number"
                value={mapAction.chipX ?? ''}
                onChange={(e) => handleNumberChange('chipX', e.target.value)}
                className="w-24"
                data-testid="chip-x-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">チップY</Label>
              <Input
                type="number"
                value={mapAction.chipY ?? ''}
                onChange={(e) => handleNumberChange('chipY', e.target.value)}
                className="w-24"
                data-testid="chip-y-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">レイヤー</Label>
              <Input
                type="number"
                value={mapAction.layer ?? ''}
                onChange={(e) => handleNumberChange('layer', e.target.value)}
                className="w-24"
                data-testid="layer-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-xs text-muted-foreground">結果変数</Label>
              <Select
                value={mapAction.resultVariableId ?? ''}
                onValueChange={(val) => handleStringChange('resultVariableId', val)}
              >
                <SelectTrigger className="flex-1" data-testid="result-variable-select">
                  <SelectValue placeholder="変数を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {variables.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name || v.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
