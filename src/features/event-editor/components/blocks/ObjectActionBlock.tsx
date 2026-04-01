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
  { value: 'face', label: '向き変更' },
  { value: 'visible', label: '表示/非表示' },
] as const;

const MOVE_TYPES = [
  { value: 'teleport', label: 'テレポート' },
  { value: 'walk', label: '歩行' },
] as const;

const DIRECTIONS = [
  { value: 'up', label: '上' },
  { value: 'down', label: '下' },
  { value: 'left', label: '左' },
  { value: 'right', label: '右' },
] as const;

function cloneAction(action: ObjectAction): ObjectAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function ObjectActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const objAction = action as ObjectAction;

  const handleChange = (updates: Partial<ObjectAction>) => {
    const updated = cloneAction(objAction);
    Object.assign(updated, updates);
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">オブジェクト操作</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {/* 対象オブジェクト名 */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">対象</Label>
          <Input
            value={objAction.targetName}
            onChange={(e) => handleChange({ targetName: e.target.value })}
            placeholder="オブジェクト名（self = 自分）"
            className="flex-1 h-7 text-xs"
          />
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">操作</Label>
          <Select value={objAction.operation} onValueChange={(v) => handleChange({ operation: v as ObjectAction['operation'] })}>
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((op) => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* move: moveType + X, Y */}
        {objAction.operation === 'move' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">方式</Label>
              <Select value={objAction.moveType ?? 'teleport'} onValueChange={(v) => handleChange({ moveType: v as ObjectAction['moveType'] })}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVE_TYPES.map((mt) => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 text-xs text-muted-foreground">位置</Label>
              <Input
                type="number"
                value={objAction.x ?? ''}
                onChange={(e) => handleChange({ x: parseInt(e.target.value) || 0 })}
                placeholder="X"
                className="w-16 h-7 text-xs"
              />
              <Input
                type="number"
                value={objAction.y ?? ''}
                onChange={(e) => handleChange({ y: parseInt(e.target.value) || 0 })}
                placeholder="Y"
                className="w-16 h-7 text-xs"
              />
            </div>
          </>
        )}

        {/* face: direction */}
        {objAction.operation === 'face' && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-muted-foreground">向き</Label>
            <Select value={objAction.direction ?? 'down'} onValueChange={(v) => handleChange({ direction: v as ObjectAction['direction'] })}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIRECTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* visible: checkbox */}
        {objAction.operation === 'visible' && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-muted-foreground">表示</Label>
            <Checkbox
              checked={objAction.visible ?? true}
              onCheckedChange={(v) => handleChange({ visible: v === true })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
