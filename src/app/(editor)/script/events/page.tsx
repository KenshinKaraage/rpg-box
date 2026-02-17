'use client';

import { useMemo, useRef, useState } from 'react';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import {
  ScriptList,
  ScriptEditor,
  ScriptSettingsPanel,
  ScriptTestPanel,
} from '@/features/script-editor';
import type { ScriptEditorHandle, DataTypeInfo } from '@/features/script-editor';
import { generateReturnTemplate } from '@/features/script-editor/utils/returnTemplate';
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
  const classes = useStore((state) => state.classes);
  const dataTypes = useStore((state) => state.dataTypes);
  const [rightTab, setRightTab] = useState<RightTab>('settings');
  const editorRef = useRef<ScriptEditorHandle>(null);

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

  const handleSettingsUpdate = (id: string, updates: Partial<Script>) => {
    const script = scripts.find((s) => s.id === id);

    // returns が変更されたら Monaco の return 文を部分編集で更新
    if (updates.returns && script) {
      const oldReturns = script.returns;
      const newReturns = updates.returns;

      // キー名(id)だけが変わったか判定
      if (oldReturns.length === newReturns.length && newReturns.length > 1) {
        let renamedOldKey: string | null = null;
        let renamedNewKey: string | null = null;
        let onlyKeyRenamed = true;

        for (let i = 0; i < oldReturns.length; i++) {
          const o = oldReturns[i]!;
          const n = newReturns[i]!;
          if (
            o.id === n.id &&
            o.fieldType === n.fieldType &&
            o.classId === n.classId &&
            o.isArray === n.isArray &&
            o.name === n.name
          )
            continue;
          // id 以外も変わっていたら全体更新
          if (o.fieldType !== n.fieldType || o.classId !== n.classId || o.isArray !== n.isArray) {
            onlyKeyRenamed = false;
            break;
          }
          // 2箇所以上変わっていたら全体更新
          if (renamedOldKey !== null) {
            onlyKeyRenamed = false;
            break;
          }
          if (o.id !== n.id) {
            renamedOldKey = o.id;
            renamedNewKey = n.id;
          }
        }

        if (onlyKeyRenamed && renamedOldKey !== null && renamedNewKey !== null) {
          updateScript(id, updates);
          editorRef.current?.renameReturnKey(renamedOldKey, renamedNewKey);
          return;
        }
      }

      // 構造的な変更 — テンプレート全体を再生成
      updateScript(id, updates);
      const classInfos = classes.map((c) => ({
        id: c.id,
        fields: c.fields.map((f) => ({
          id: f.id,
          type: f.type,
          classId: (f as unknown as { classId?: string }).classId,
        })),
      }));
      const template = generateReturnTemplate(newReturns, classInfos);
      if (template) {
        editorRef.current?.applyReturnTemplate(template);
      }
      return;
    }

    updateScript(id, updates);
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
              <ScriptSettingsPanel script={selectedScript} onUpdate={handleSettingsUpdate} />
            ) : (
              <ScriptTestPanel script={selectedScript} />
            )}
          </div>
        </div>
      }
    />
  );
}
