'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      onUpdate(script.id, { name: localName });
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== (script.description ?? '')) {
      onUpdate(script.id, { description: localDesc });
    }
  };

  return (
    <div className="flex h-full flex-col">
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
              <IconPicker value={script.icon} onChange={(icon) => onUpdate(script.id, { icon })} />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <ColorPresetPicker
                value={script.color}
                onChange={(color) => onUpdate(script.id, { color })}
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
