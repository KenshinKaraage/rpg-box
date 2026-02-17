'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor, IRange } from 'monaco-editor';

import type { Script } from '@/types/script';

import { registerApiDefinitions } from '../utils/apiDefinitions';

export interface ScriptEditorHandle {
  /** return文を部分編集で更新する（Monaco 全体の再レンダリングを回避） */
  applyReturnTemplate: (template: string) => void;
  /** return文内のキー名だけをピンポイント置換する */
  renameReturnKey: (oldKey: string, newKey: string) => void;
}

interface ScriptEditorProps {
  script: Script | null;
  onContentChange: (id: string, content: string) => void;
}

export const ScriptEditor = forwardRef<ScriptEditorHandle, ScriptEditorProps>(function ScriptEditor(
  { script, onContentChange },
  ref
) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useImperativeHandle(ref, () => ({
    applyReturnTemplate(template: string) {
      const ed = editorRef.current;
      if (!ed || !script || !template) return;

      const model = ed.getModel();
      if (!model) return;

      const content = model.getValue();
      const lines = content.split('\n');
      const lineCount = model.getLineCount();

      // 最後の return 文の開始行を探す
      let returnStartLine = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const stripped = lines[i]!.trimStart();
        if (
          stripped.startsWith('return ') ||
          stripped.startsWith('return{') ||
          stripped === 'return'
        ) {
          returnStartLine = i;
          break;
        }
      }

      let range: IRange;
      let text: string;

      // テンプレートから "return " を除去して値部分だけ取得
      const valueOnly = template.replace(/^return\s*/, '');

      if (returnStartLine >= 0) {
        // "return " の後ろの値部分だけを置換（return キーワードはそのまま）
        const line = lines[returnStartLine]!;
        const returnIdx = line.indexOf('return');
        const afterReturn = returnIdx + 'return'.length;
        // "return " or "return{" — スペースがあればその後、なければ return 直後
        const startCol = line[afterReturn] === ' ' ? afterReturn + 2 : afterReturn + 1; // 1-indexed
        const startLine = returnStartLine + 1; // Monaco は 1-indexed
        const endCol = model.getLineLength(lineCount) + 1;
        range = {
          startLineNumber: startLine,
          startColumn: startCol,
          endLineNumber: lineCount,
          endColumn: endCol,
        };
        text = valueOnly;
      } else {
        // 末尾に追加
        const endCol = model.getLineLength(lineCount) + 1;
        range = {
          startLineNumber: lineCount,
          startColumn: endCol,
          endLineNumber: lineCount,
          endColumn: endCol,
        };
        const trimmed = content.trimEnd();
        text = (trimmed ? '\n\n' : '') + template;
      }

      ed.executeEdits('return-template', [{ range, text, forceMoveMarkers: true }]);

      // ストアに同期
      onContentChange(script.id, model.getValue());
    },

    renameReturnKey(oldKey: string, newKey: string) {
      const ed = editorRef.current;
      if (!ed || !script || !oldKey) return;

      const model = ed.getModel();
      if (!model) return;

      const content = model.getValue();
      const lines = content.split('\n');

      // return 文の開始行を探す
      let returnStartLine = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const stripped = lines[i]!.trimStart();
        if (
          stripped.startsWith('return ') ||
          stripped.startsWith('return{') ||
          stripped === 'return'
        ) {
          returnStartLine = i;
          break;
        }
      }
      if (returnStartLine < 0) return;

      // return 文内で "oldKey:" パターンを探す
      const escaped = oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keyPattern = new RegExp(`(?<=^|[{ ,])\\s*${escaped}\\s*(?=:)`);

      for (let i = returnStartLine; i < lines.length; i++) {
        const match = keyPattern.exec(lines[i]!);
        if (match) {
          // マッチした部分の中で oldKey の正確な位置を特定
          const matchStart = match.index + match[0].indexOf(oldKey);
          const lineNumber = i + 1;
          const startCol = matchStart + 1; // 1-indexed
          const endCol = startCol + oldKey.length;
          const range: IRange = {
            startLineNumber: lineNumber,
            startColumn: startCol,
            endLineNumber: lineNumber,
            endColumn: endCol,
          };
          ed.executeEdits('return-key-rename', [{ range, text: newKey, forceMoveMarkers: true }]);
          onContentChange(script.id, model.getValue());
          return;
        }
      }
    },
  }));

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
          onMount={(ed) => {
            editorRef.current = ed;
          }}
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
});
