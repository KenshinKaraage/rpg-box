'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/stores';
import { useUndoEditSession } from '@/hooks/useUndoEditSession';
import type { Script } from '@/types/script';
import { IconPicker } from './IconPicker';
import { ColorPresetPicker } from './ColorPresetPicker';

interface ComponentScriptSettingsPanelProps {
  script: Script | null;
  onUpdate: (id: string, updates: Partial<Script>) => void;
}

/**
 * コンポーネントスクリプト用設定パネル
 *
 * 名前・アイコン・カラー・説明のみ。
 * 引数/返り値/呼び出しID等はコンポーネントスクリプトでは不要。
 */
export function ComponentScriptSettingsPanel({
  script,
  onUpdate,
}: ComponentScriptSettingsPanelProps) {
  const scripts = useStore((s) => s.scripts);
  const pushUndoState = useStore((s) => s.pushUndoState);
  const { endEditSession } = useUndoEditSession('script', script?.id ?? null);
  const [localName, setLocalName] = useState('');
  const [localDesc, setLocalDesc] = useState('');

  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setLocalName(script.name);
    setLocalDesc(script.description ?? '');
  }
  if (!script && prevScriptId !== null) {
    setPrevScriptId(null);
  }

  if (!script) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        スクリプトを選択してください
      </div>
    );
  }

  const handleNameBlur = () => {
    if (localName !== script.name) {
      pushUndoState('script', { scripts });
      endEditSession();
      onUpdate(script.id, { name: localName });
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== (script.description ?? '')) {
      pushUndoState('script', { scripts });
      endEditSession();
      onUpdate(script.id, { description: localDesc });
    }
  };

  /** 単発の設定変更（アイコン/カラー）用。1回のUndoを積んでセッションを断ち切る */
  const handleDiscreteUpdate = (updates: Partial<Script>) => {
    pushUndoState('script', { scripts });
    endEditSession();
    onUpdate(script.id, updates);
  };

  return (
    <div className="flex h-full flex-col" onBlur={endEditSession}>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="comp-script-name">名前</Label>
            <Input
              id="comp-script-name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>

          {/* Icon & Color */}
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>アイコン</Label>
              <IconPicker value={script.icon} onChange={(icon) => handleDiscreteUpdate({ icon })} />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <ColorPresetPicker
                value={script.color}
                onChange={(color) => handleDiscreteUpdate({ color })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="comp-script-desc">説明</Label>
            <Textarea
              id="comp-script-desc"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={handleDescBlur}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
