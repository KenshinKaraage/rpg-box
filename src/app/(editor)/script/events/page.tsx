'use client';

import { useMemo, useState } from 'react';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import {
  ScriptList,
  ScriptEditor,
  ScriptSettingsPanel,
  ScriptTestPanel,
} from '@/features/script-editor';
import { useStore } from '@/stores';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { createScript } from '@/types/script';
import type { Script } from '@/types/script';

type RightTab = 'settings' | 'test';

export default function EventScriptPage() {
  const scripts = useStore((state) => state.scripts);
  const selectedScriptId = useStore((state) => state.selectedScriptId);
  const addScript = useStore((state) => state.addScript);
  const updateScript = useStore((state) => state.updateScript);
  const deleteScript = useStore((state) => state.deleteScript);
  const selectScript = useStore((state) => state.selectScript);
  const [rightTab, setRightTab] = useState<RightTab>('settings');

  // Top-level event scripts
  const eventScripts = useMemo(
    () => scripts.filter((s) => s.type === 'event' && !s.parentId),
    [scripts]
  );

  // Internal scripts map: parentId -> direct children
  const internalScriptsMap = useMemo(() => {
    const map: Record<string, Script[]> = {};
    for (const s of scripts) {
      if (s.parentId) {
        const key = s.parentId;
        if (!map[key]) map[key] = [];
        map[key]!.push(s);
      }
    }
    return map;
  }, [scripts]);

  // Selected script
  const selectedScript = useMemo(
    () => (selectedScriptId ? (scripts.find((s) => s.id === selectedScriptId) ?? null) : null),
    [scripts, selectedScriptId]
  );

  const handleAdd = () => {
    const id = generateId(
      'script',
      scripts.map((s) => s.id)
    );
    const script = createScript(id, '新しいスクリプト', 'event');
    addScript(script);
    selectScript(id);
  };

  const handleAddInternal = (parentId: string) => {
    const id = generateId(
      'script',
      scripts.map((s) => s.id)
    );
    const script: Script = {
      ...createScript(id, '_helper', 'internal'),
      parentId,
    };
    addScript(script);
    selectScript(id);
  };

  const handleContentChange = (id: string, content: string) => {
    updateScript(id, { content });
  };

  return (
    <ThreeColumnLayout
      left={
        <ScriptList
          scripts={eventScripts}
          internalScriptsMap={internalScriptsMap}
          selectedId={selectedScriptId}
          onSelect={selectScript}
          onAdd={handleAdd}
          onDelete={deleteScript}
          onAddInternal={handleAddInternal}
          title="イベントスクリプト"
        />
      }
      center={<ScriptEditor script={selectedScript} onContentChange={handleContentChange} />}
      right={
        <div className="flex h-full flex-col">
          <div className="flex border-b">
            <button
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium',
                rightTab === 'settings'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('settings')}
            >
              設定
            </button>
            <button
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium',
                rightTab === 'test'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('test')}
            >
              テスト
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {rightTab === 'settings' ? (
              <ScriptSettingsPanel script={selectedScript} onUpdate={updateScript} />
            ) : (
              <ScriptTestPanel script={selectedScript} />
            )}
          </div>
        </div>
      }
    />
  );
}
