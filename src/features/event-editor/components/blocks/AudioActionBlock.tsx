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
import type { AudioAction } from '@/engine/actions/AudioAction';

const OPERATIONS = [
  { value: 'playBGM', label: 'BGM再生' },
  { value: 'stopBGM', label: 'BGM停止' },
  { value: 'playSE', label: 'SE再生' },
] as const;

function cloneAction(action: AudioAction): AudioAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function AudioActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const audioAction = action as AudioAction;
  const { operation } = audioAction;

  const showAudioId = operation === 'playBGM' || operation === 'playSE';
  const showVolume = operation === 'playBGM' || operation === 'playSE';
  const showFadeIn = operation === 'playBGM';
  const showFadeOut = operation === 'stopBGM';
  const showPitch = operation === 'playBGM' || operation === 'playSE';

  const handleOperationChange = (value: string) => {
    const updated = cloneAction(audioAction);
    updated.operation = value as AudioAction['operation'];
    onChange(updated);
  };

  const handleAudioIdChange = (value: string) => {
    const updated = cloneAction(audioAction);
    updated.audioId = value;
    onChange(updated);
  };

  const handleNumberChange = (field: 'volume' | 'fadeIn' | 'fadeOut' | 'pitch', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const updated = cloneAction(audioAction);
    updated[field] = num;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">オーディオ</Label>
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
            <SelectTrigger className="w-40" data-testid="operation-select">
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

        {showAudioId && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">オーディオID</Label>
            <Input
              value={audioAction.audioId ?? ''}
              onChange={(e) => handleAudioIdChange(e.target.value)}
              placeholder="オーディオID"
              className="flex-1"
              data-testid="audio-id-input"
            />
          </div>
        )}

        {showVolume && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">ボリューム</Label>
            <Input
              type="number"
              value={audioAction.volume ?? ''}
              onChange={(e) => handleNumberChange('volume', e.target.value)}
              min={0}
              max={100}
              className="w-24"
              data-testid="volume-input"
            />
          </div>
        )}

        {showFadeIn && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">フェードイン</Label>
            <Input
              type="number"
              value={audioAction.fadeIn ?? ''}
              onChange={(e) => handleNumberChange('fadeIn', e.target.value)}
              min={0}
              className="w-24"
              data-testid="fade-in-input"
            />
          </div>
        )}

        {showFadeOut && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">フェードアウト</Label>
            <Input
              type="number"
              value={audioAction.fadeOut ?? ''}
              onChange={(e) => handleNumberChange('fadeOut', e.target.value)}
              min={0}
              className="w-24"
              data-testid="fade-out-input"
            />
          </div>
        )}

        {showPitch && (
          <div className="flex items-center gap-2">
            <Label className="w-20 text-xs text-muted-foreground">ピッチ</Label>
            <Input
              type="number"
              value={audioAction.pitch ?? ''}
              onChange={(e) => handleNumberChange('pitch', e.target.value)}
              min={50}
              max={200}
              className="w-24"
              data-testid="pitch-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
