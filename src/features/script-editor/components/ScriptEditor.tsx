'use client';

import Editor from '@monaco-editor/react';

import type { Script } from '@/types/script';

import { registerApiDefinitions } from '../utils/apiDefinitions';

interface ScriptEditorProps {
  script: Script | null;
  onContentChange: (id: string, content: string) => void;
}

export function ScriptEditor({ script, onContentChange }: ScriptEditorProps) {
  if (!script) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        スクリプトを選択してください
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-header items-center border-b px-4 font-semibold">{script.name}</div>
      <div className="min-h-0 flex-1">
        <Editor
          language="javascript"
          theme="vs-dark"
          value={script.content}
          onChange={(value) => onContentChange(script.id, value ?? '')}
          beforeMount={(monaco) => {
            registerApiDefinitions(monaco);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
