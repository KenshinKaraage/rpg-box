'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TalkTriggerComponent } from '@/types/components/triggers/TalkTriggerComponent';
import type { AutoTriggerComponent } from '@/types/components/triggers/AutoTriggerComponent';
import type { InputTriggerComponent } from '@/types/components/triggers/InputTriggerComponent';
import type { TouchTriggerComponent } from '@/types/components/triggers/TouchTriggerComponent';
import type { StepTriggerComponent } from '@/types/components/triggers/StepTriggerComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

type TriggerComponent =
  | TalkTriggerComponent
  | TouchTriggerComponent
  | StepTriggerComponent
  | AutoTriggerComponent
  | InputTriggerComponent;

interface Props extends ComponentPanelProps {
  component: TriggerComponent;
}

export function TriggerPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">イベント ID</Label>
        <Input
          className="h-7 text-xs"
          value={component.eventId}
          onChange={(e) => onChange({ eventId: e.target.value })}
        />
      </div>

      {component.type === 'talkTrigger' && (
        <div className="space-y-1">
          <Label className="text-xs">方向</Label>
          <Select
            value={(component as TalkTriggerComponent).direction}
            onValueChange={(v) => onChange({ direction: v })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">正面</SelectItem>
              <SelectItem value="any">全方向</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {component.type === 'autoTrigger' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">間隔 (ms)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              min={0}
              value={(component as AutoTriggerComponent).interval}
              onChange={(e) => onChange({ interval: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="auto-run-once"
              checked={(component as AutoTriggerComponent).runOnce}
              onCheckedChange={(v) => onChange({ runOnce: v === true })}
            />
            <Label htmlFor="auto-run-once" className="text-xs">
              1回のみ実行
            </Label>
          </div>
        </>
      )}

      {component.type === 'inputTrigger' && (
        <div className="space-y-1">
          <Label className="text-xs">キー</Label>
          <Input
            className="h-7 text-xs"
            value={(component as InputTriggerComponent).key}
            onChange={(e) => onChange({ key: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
