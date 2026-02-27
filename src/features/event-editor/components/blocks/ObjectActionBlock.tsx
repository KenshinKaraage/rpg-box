'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { ObjectAction } from '@/engine/actions/ObjectAction';

const OPERATIONS = [
  { value: 'move', label: '移動' },
  { value: 'rotate', label: '回転' },
  { value: 'autoWalk', label: '自動歩行' },
] as const;

function cloneAction(action: ObjectAction): ObjectAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function ObjectActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const objAction = action as ObjectAction;

  const handleTargetIdChange = (targetId: string) => {
    const updated = cloneAction(objAction);
    updated.targetId = targetId;
    onChange(updated);
  };

  const handleOperationChange = (operation: string) => {
    const updated = cloneAction(objAction);
    updated.operation = operation as ObjectAction['operation'];
    onChange(updated);
  };

  const handleNumberChange = (field: keyof ObjectAction, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = cloneAction(objAction);
    (updated as unknown as Record<string, unknown>)[field] = num;
    onChange(updated);
  };

  const handleEnabledChange = (checked: boolean) => {
    const updated = cloneAction(objAction);
    updated.enabled = checked;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">オブジェクト操作</Label>
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
          <Label className="w-16 text-xs text-muted-foreground">対象ID</Label>
          <Input
            value={objAction.targetId}
            onChange={(e) => handleTargetIdChange(e.target.value)}
            placeholder="対象ID"
            className="flex-1"
            data-testid="target-id-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">操作</Label>
          <Select value={objAction.operation} onValueChange={handleOperationChange}>
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

        {objAction.operation === 'move' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={objAction.x ?? ''}
                onChange={(e) => handleNumberChange('x', e.target.value)}
                className="w-24"
                data-testid="x-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={objAction.y ?? ''}
                onChange={(e) => handleNumberChange('y', e.target.value)}
                className="w-24"
                data-testid="y-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">速度</Label>
              <Input
                type="number"
                value={objAction.speed ?? ''}
                onChange={(e) => handleNumberChange('speed', e.target.value)}
                className="w-24"
                data-testid="speed-input"
              />
            </div>
          </>
        )}

        {objAction.operation === 'rotate' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">角度</Label>
              <Input
                type="number"
                value={objAction.angle ?? ''}
                onChange={(e) => handleNumberChange('angle', e.target.value)}
                className="w-24"
                data-testid="angle-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">時間</Label>
              <Input
                type="number"
                value={objAction.duration ?? ''}
                onChange={(e) => handleNumberChange('duration', e.target.value)}
                className="w-24"
                data-testid="duration-input"
              />
            </div>
          </>
        )}

        {objAction.operation === 'autoWalk' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">有効</Label>
              <Checkbox
                checked={objAction.enabled ?? false}
                onCheckedChange={(checked) => handleEnabledChange(checked === true)}
                data-testid="enabled-checkbox"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">速度</Label>
              <Input
                type="number"
                value={objAction.speed ?? ''}
                onChange={(e) => handleNumberChange('speed', e.target.value)}
                className="w-24"
                data-testid="speed-input"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
