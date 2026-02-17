'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor, IRange, IDisposable } from 'monaco-editor';

import { createFieldTypeInstance } from '@/types/fields';
import type { Script } from '@/types/script';

import {
  registerApiDefinitions,
  updateScriptDeclarations,
  updateArgDeclarations,
  updateDataDeclarations,
} from '../utils/apiDefinitions';
import type { DataTypeInfo } from '../utils/apiDefinitions';

export interface ScriptEditorHandle {
  /** return文を部分編集で更新する（Monaco 全体の再レンダリングを回避） */
  applyReturnTemplate: (template: string) => void;
  /** return文内のキー名だけをピンポイント置換する */
  renameReturnKey: (oldKey: string, newKey: string) => void;
}

interface ScriptEditorProps {
  script: Script | null;
  scripts: Script[];
  dataTypes: DataTypeInfo[];
  onContentChange: (id: string, content: string) => void;
}

export const ScriptEditor = forwardRef<ScriptEditorHandle, ScriptEditorProps>(function ScriptEditor(
  { script, scripts, dataTypes, onContentChange },
  ref
) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionDisposableRef = useRef<IDisposable | null>(null);

  // scripts が変わったら動的な Script 型宣言を更新
  useEffect(() => {
    if (!monacoRef.current) return;
    updateScriptDeclarations(monacoRef.current, scripts);
  }, [scripts]);

  // dataTypes が変わったら動的な Data 型宣言を更新
  useEffect(() => {
    if (!monacoRef.current) return;
    updateDataDeclarations(monacoRef.current, dataTypes);
  }, [dataTypes]);

  // 選択スクリプトが変わったら引数宣言を更新（パネルで設定した引数が候補に表示される）
  useEffect(() => {
    if (!monacoRef.current) return;
    updateArgDeclarations(monacoRef.current, script);
  }, [script]);

  // scripts が変わったら補完プロバイダを再登録
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    // 前回のプロバイダを破棄
    if (completionDisposableRef.current) {
      completionDisposableRef.current.dispose();
      completionDisposableRef.current = null;
    }

    const callableScripts = scripts.filter((s) => s.callId && s.type !== 'internal');
    if (callableScripts.length === 0) return;

    completionDisposableRef.current = monaco.languages.registerCompletionItemProvider(
      'javascript',
      {
        triggerCharacters: ['.'],
        provideCompletionItems(
          model: editor.ITextModel,
          position: { lineNumber: number; column: number }
        ) {
          // "Script." の後でのみ発動
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          if (!/Script\.\s*\w*$/.test(textUntilPosition)) return { suggestions: [] };

          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          };

          const suggestions = callableScripts.map((s) => {
            const args = s.args;
            let insertText: string;
            let insertTextRules:
              | typeof monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              | undefined;

            if (args.length === 0) {
              insertText = `${s.callId}()`;
            } else if (args.length === 1) {
              // 引数1つ → 位置引数スニペット
              const ft = createFieldTypeInstance(args[0]!.fieldType);
              const defaultStr = defaultSnippetValue(ft?.tsType ?? 'unknown');
              insertText = `${s.callId}(\${1:${defaultStr}})`;
              insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            } else {
              // 引数2つ以上 → オブジェクトパターンスニペット
              const fields = args
                .map((a, i) => {
                  const ft = createFieldTypeInstance(a.fieldType);
                  const defaultStr = defaultSnippetValue(ft?.tsType ?? 'unknown');
                  return `${a.id}: \${${i + 1}:${defaultStr}}`;
                })
                .join(', ');
              insertText = `${s.callId}({${fields}})`;
              insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }

            return {
              label: {
                label: s.callId!,
                description: s.name,
              },
              kind: monaco.languages.CompletionItemKind.Method,
              documentation: s.description || `スクリプト: ${s.name}`,
              insertText,
              insertTextRules,
              range,
            };
          });

          return { suggestions };
        },
      }
    );

    return () => {
      if (completionDisposableRef.current) {
        completionDisposableRef.current.dispose();
        completionDisposableRef.current = null;
      }
    };
  }, [scripts]);

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
          onMount={(ed, monaco) => {
            editorRef.current = ed;
            monacoRef.current = monaco;
            updateScriptDeclarations(monaco, scripts);
            updateDataDeclarations(monaco, dataTypes);
            updateArgDeclarations(monaco, script);
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

/** スニペット挿入時のデフォルト値テキスト */
function defaultSnippetValue(tsType: string): string {
  if (tsType === 'number') return '0';
  if (tsType === 'boolean') return 'false';
  if (tsType === 'string') return "''";
  if (tsType.endsWith('[]')) return '[]';
  if (tsType.startsWith('Record')) return '{}';
  return 'undefined';
}
