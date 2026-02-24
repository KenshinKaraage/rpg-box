'use client';

import { useEffect, useMemo, useRef } from 'react';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { ScriptList, ScriptEditor, ComponentFieldEditor } from '@/features/script-editor';
import type { ScriptEditorHandle, DataTypeInfo } from '@/features/script-editor';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { createScript } from '@/types/script';
import type { Script } from '@/types/script';

export default function ComponentScriptPage() {
  const scripts = useStore((state) => state.scripts);
  const selectedScriptId = useStore((state) => state.selectedScriptId);
  const addScript = useStore((state) => state.addScript);
  const updateScript = useStore((state) => state.updateScript);
  const deleteScript = useStore((state) => state.deleteScript);
  const selectScript = useStore((state) => state.selectScript);
  const seedDefaultComponentScripts = useStore((state) => state.seedDefaultComponentScripts);
  const dataTypes = useStore((state) => state.dataTypes);

  useEffect(() => {
    seedDefaultComponentScripts();
  }, [seedDefaultComponentScripts]);
  const editorRef = useRef<ScriptEditorHandle>(null);

  // Top-level component scripts
  const componentScripts = useMemo(
    () => scripts.filter((s) => s.type === 'component' && !s.parentId),
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

  return (
    <ThreeColumnLayout
      left={
        <ScriptList
          scripts={componentScripts}
          internalScriptsMap={internalScriptsMap}
          selectedId={selectedScriptId}
          onSelect={selectScript}
          onAdd={handleAdd}
          onDelete={deleteScript}
          onAddInternal={handleAddInternal}
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
        <ComponentFieldEditor
          content={selectedScript?.content ?? null}
          onContentChange={(newContent) => {
            if (selectedScript) handleContentChange(selectedScript.id, newContent);
          }}
        />
      }
    />
  );
}
