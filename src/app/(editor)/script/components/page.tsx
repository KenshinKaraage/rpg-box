'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import {
  ScriptList,
  ScriptEditor,
  ScriptSettingsPanel,
  ComponentFieldEditor,
} from '@/features/script-editor';
import type { ScriptEditorHandle, DataTypeInfo } from '@/features/script-editor';
import { useStore } from '@/stores';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { createScript } from '@/types/script';
import type { Script } from '@/types/script';

type RightTab = 'settings' | 'fields';

export default function ComponentScriptPage() {
  const scripts = useStore((state) => state.scripts);
  const selectedScriptId = useStore((state) => state.selectedScriptId);
  const addScript = useStore((state) => state.addScript);
  const updateScript = useStore((state) => state.updateScript);
  const deleteScript = useStore((state) => state.deleteScript);
  const moveScript = useStore((state) => state.moveScript);
  const selectScript = useStore((state) => state.selectScript);
  const seedDefaultComponentScripts = useStore((state) => state.seedDefaultComponentScripts);
  const dataTypes = useStore((state) => state.dataTypes);
  const [rightTab, setRightTab] = useState<RightTab>('settings');
  const editorRef = useRef<ScriptEditorHandle>(null);

  useEffect(() => {
    seedDefaultComponentScripts();
  }, [seedDefaultComponentScripts]);

  // All component scripts (flat, including internal children)
  const componentScripts = useMemo(
    () =>
      scripts.filter(
        (s) =>
          s.type === 'component' ||
          (s.type === 'internal' &&
            s.parentId &&
            scripts.find((p) => p.id === s.parentId)?.type === 'component')
      ),
    [scripts]
  );

  // DataType info for IntelliSense
  const dataTypeInfos: DataTypeInfo[] = useMemo(
    () =>
      dataTypes.map((dt) => ({
        id: dt.id,
        name: dt.name,
        fields: dt.fields.map((f) => ({ id: f.id, type: f.type })),
      })),
    [dataTypes]
  );

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
    const script = createScript(id, '新しいスクリプト', 'component');
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

  const handleSettingsUpdate = (id: string, updates: Partial<Script>) => {
    updateScript(id, updates);
  };

  return (
    <ThreeColumnLayout
      left={
        <ScriptList
          scripts={componentScripts}
          selectedId={selectedScriptId}
          onSelect={selectScript}
          onAdd={handleAdd}
          onDelete={deleteScript}
          onAddInternal={handleAddInternal}
          onMove={moveScript}
          title="コンポーネントスクリプト"
        />
      }
      center={
        <ScriptEditor
          ref={editorRef}
          script={selectedScript}
          scripts={scripts}
          dataTypes={dataTypeInfos}
          onContentChange={handleContentChange}
        />
      }
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
                rightTab === 'fields'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('fields')}
            >
              フィールド
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {rightTab === 'settings' ? (
              <ScriptSettingsPanel script={selectedScript} onUpdate={handleSettingsUpdate} />
            ) : (
              <ComponentFieldEditor
                content={selectedScript?.content ?? null}
                onContentChange={(newContent) => {
                  if (selectedScript) handleContentChange(selectedScript.id, newContent);
                }}
              />
            )}
          </div>
        </div>
      }
    />
  );
}
