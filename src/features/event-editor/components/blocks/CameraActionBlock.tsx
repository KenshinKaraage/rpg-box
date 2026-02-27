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
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { CameraAction } from '@/engine/actions/CameraAction';

const OPERATIONS = [
  { value: 'zoom', label: 'ズーム' },
  { value: 'pan', label: 'パン' },
  { value: 'effect', label: 'エフェクト' },
  { value: 'reset', label: 'リセット' },
] as const;

const EFFECTS = [
  { value: 'shake', label: 'シェイク' },
  { value: 'flash', label: 'フラッシュ' },
  { value: 'fadeIn', label: 'フェードイン' },
  { value: 'fadeOut', label: 'フェードアウト' },
] as const;

function cloneAction(action: CameraAction): CameraAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function CameraActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const camAction = action as CameraAction;

  const handleOperationChange = (value: string) => {
    const updated = cloneAction(camAction);
    updated.operation = value as CameraAction['operation'];
    onChange(updated);
  };

  const handleNumberChange = (
    field: 'scale' | 'x' | 'y' | 'duration' | 'intensity',
    value: string
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = cloneAction(camAction);
    updated[field] = num;
    onChange(updated);
  };

  const handleEffectChange = (value: string) => {
    const updated = cloneAction(camAction);
    updated.effect = value as CameraAction['effect'];
    onChange(updated);
  };

  const handleColorChange = (value: string) => {
    const updated = cloneAction(camAction);
    updated.color = value;
    onChange(updated);
  };

  const { operation } = camAction;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">カメラ</Label>
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
          <Label className="w-20 text-xs text-muted-foreground">操作</Label>
          <Select value={operation} onValueChange={handleOperationChange}>
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

        {operation === 'zoom' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">スケール</Label>
              <Input
                type="number"
                value={camAction.scale ?? ''}
                onChange={(e) => handleNumberChange('scale', e.target.value)}
                step={0.1}
                min={0.1}
                className="w-24"
                data-testid="scale-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">期間</Label>
              <Input
                type="number"
                value={camAction.duration ?? ''}
                onChange={(e) => handleNumberChange('duration', e.target.value)}
                min={0}
                className="w-24"
                data-testid="duration-input"
              />
            </div>
          </>
        )}

        {operation === 'pan' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={camAction.x ?? ''}
                onChange={(e) => handleNumberChange('x', e.target.value)}
                className="w-24"
                data-testid="x-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={camAction.y ?? ''}
                onChange={(e) => handleNumberChange('y', e.target.value)}
                className="w-24"
                data-testid="y-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">期間</Label>
              <Input
                type="number"
                value={camAction.duration ?? ''}
                onChange={(e) => handleNumberChange('duration', e.target.value)}
                min={0}
                className="w-24"
                data-testid="duration-input"
              />
            </div>
          </>
        )}

        {operation === 'effect' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">種類</Label>
              <Select value={camAction.effect ?? ''} onValueChange={handleEffectChange}>
                <SelectTrigger className="w-32" data-testid="effect-select">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {EFFECTS.map((ef) => (
                    <SelectItem key={ef.value} value={ef.value}>
                      {ef.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">強度</Label>
              <Input
                type="number"
                value={camAction.intensity ?? ''}
                onChange={(e) => handleNumberChange('intensity', e.target.value)}
                min={0}
                className="w-24"
                data-testid="intensity-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">期間</Label>
              <Input
                type="number"
                value={camAction.duration ?? ''}
                onChange={(e) => handleNumberChange('duration', e.target.value)}
                min={0}
                className="w-24"
                data-testid="duration-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">カラー</Label>
              <Input
                value={camAction.color ?? ''}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#ffffff"
                className="w-24"
                data-testid="color-input"
              />
            </div>
          </>
        )}

        {operation === 'reset' && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">期間</Label>
            <Input
              type="number"
              value={camAction.duration ?? ''}
              onChange={(e) => handleNumberChange('duration', e.target.value)}
              min={0}
              className="w-24"
              data-testid="duration-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
