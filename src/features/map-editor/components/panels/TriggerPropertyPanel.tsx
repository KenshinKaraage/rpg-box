'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
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
import { useStore } from '@/stores';
import { EventEditorModal } from '@/features/event-editor/components/EventEditorModal';
import type { TalkTriggerComponent } from '@/types/components/triggers/TalkTriggerComponent';
import type { AutoTriggerComponent } from '@/types/components/triggers/AutoTriggerComponent';
import type { InputTriggerComponent } from '@/types/components/triggers/InputTriggerComponent';
import type { TouchTriggerComponent } from '@/types/components/triggers/TouchTriggerComponent';
import type { StepTriggerComponent } from '@/types/components/triggers/StepTriggerComponent';
import type { ComponentPanelProps } from '@/types/components/Component';
import type { EditableAction } from '@/types/ui/actions/UIAction';

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
  const [modalOpen, setModalOpen] = useState(false);
  const eventTemplates = useStore((s) => s.eventTemplates);

  const hasLocalActions = component.actions && component.actions.length > 0;

  return (
    <div className="space-y-2">
      {/* イベント編集ボタン */}
      <div className="space-y-1">
        <Label className="text-xs">イベント</Label>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => setModalOpen(true)}
        >
          <Pencil className="mr-1.5 h-3 w-3" />
          {hasLocalActions
            ? `${component.actions.length} アクション`
            : 'イベントを編集...'}
        </Button>
      </div>

      {/* テンプレート参照（オプション） */}
      <div className="space-y-1">
        <Label className="text-xs">テンプレート参照</Label>
        <Select
          value={component.eventId || ''}
          onValueChange={(v) => onChange({ eventId: v === '__none__' ? '' : v })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="なし（ローカルイベント）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">なし</SelectItem>
            {eventTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {component.eventId && hasLocalActions && (
          <div className="text-[10px] text-muted-foreground">
            ローカルアクションが優先されます
          </div>
        )}
      </div>

      {/* トリガー固有設定 */}
      {component.type === 'talkTrigger' && (
        <>
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
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="talk-face-player"
              checked={(component as TalkTriggerComponent).facePlayer}
              onCheckedChange={(v) => onChange({ facePlayer: v === true })}
            />
            <Label htmlFor="talk-face-player" className="text-xs">
              話しかけた時にこちらを向く
            </Label>
          </div>
        </>
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

      {/* イベント編集モーダル */}
      <EventEditorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        actions={component.actions ?? ([] as EditableAction[])}
        onSave={(actions) => onChange({ actions })}
      />
    </div>
  );
}
