'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameEngine } from '@/engine/core/GameEngine';
import type { EngineMessage, ScriptModeConfig } from '@/engine/types';
import { useStore } from '@/stores';
import type { Script } from '@/types/script';
import { getArgField } from '@/features/event-editor/components/arg-fields';
import '@/features/event-editor/components/arg-fields/register';

interface ScriptTestPanelProps {
  script: Script | null;
}

export function ScriptTestPanel({ script }: ScriptTestPanelProps) {
  const scripts = useStore((s) => s.scripts);
  const variables = useStore((s) => s.variables);
  const classes = useStore((s) => s.classes);
  const dataTypes = useStore((s) => s.dataTypes);
  const dataEntries = useStore((s) => s.dataEntries);
  const [argValues, setArgValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [returnTypeErrors, setReturnTypeErrors] = useState<string[]>([]);

  // Reset state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setArgValues({});
    setResult(null);
    setConsoleOutput([]);
    setRuntimeError(null);
    setReturnTypeErrors([]);
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

  const handleExecute = async () => {
    const logs: string[] = [];
    let finalResult: string | null = null;
    let errorMsg: string | null = null;
    const typeErrors: string[] = [];

    // Build args keyed by arg.id (values are already typed from arg field renderers)
    const args: Record<string, unknown> = {};
    for (const arg of script.args) {
      args[arg.id] = argValues[arg.id] ?? arg.defaultValue ?? '';
    }

    // Map store variables to engine format
    const engineVariables = variables.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.fieldType.type,
      defaultValue: v.initialValue,
    }));

    // Map store classes to engine format
    const engineClasses = classes.map((c) => ({
      id: c.id,
      name: c.name,
      fields: c.fields.map((f) => ({ id: f.id, fieldType: f.type })),
    }));

    // Map store data types to engine format
    const engineDataTypes = dataTypes.map((dt) => ({ id: dt.id, name: dt.name }));
    const engineDataEntries: Record<
      string,
      { id: string; typeId: string; values: Record<string, unknown> }[]
    > = {};
    for (const [typeId, entries] of Object.entries(dataEntries)) {
      engineDataEntries[typeId] = entries.map((e) => ({
        id: e.id,
        typeId: e.typeId,
        values: e.values,
      }));
    }

    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts,
        variables: engineVariables,
        classes: engineClasses,
        dataTypes: engineDataTypes,
        dataEntries: engineDataEntries,
      },
      scriptId: script.id,
      args,
    };

    const engine = new GameEngine((msg: EngineMessage) => {
      switch (msg.type) {
        case 'log':
          logs.push(msg.message);
          break;
        case 'script-result':
          finalResult = msg.value !== undefined ? JSON.stringify(msg.value) : 'undefined';
          break;
        case 'script-error':
          if (msg.errorType === 'return-type') {
            typeErrors.push(msg.error);
          } else {
            errorMsg = msg.error;
          }
          break;
      }
    });

    await engine.handleMessage({ type: 'start', config });

    setResult(errorMsg ?? finalResult);
    setRuntimeError(errorMsg);
    setConsoleOutput(logs);
    setReturnTypeErrors(typeErrors);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Arguments */}
          {script.args.length > 0 && (
            <div className="space-y-2">
              <Label>引数</Label>
              {script.args.map((arg) => {
                const Renderer = getArgField(arg.fieldType);
                return (
                  <div key={arg.id} className="space-y-1">
                    <Label htmlFor={`test-arg-${arg.id}`} className="text-xs">
                      {arg.name}（{arg.fieldType}）
                    </Label>
                    {Renderer ? (
                      <Renderer
                        value={argValues[arg.id]}
                        onChange={(v) =>
                          setArgValues((prev) => ({ ...prev, [arg.id]: v }))
                        }
                        placeholder={arg.fieldType}
                      />
                    ) : (
                      <Input
                        id={`test-arg-${arg.id}`}
                        value={String(argValues[arg.id] ?? '')}
                        onChange={(e) =>
                          setArgValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
                        }
                        placeholder={arg.fieldType}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Execute button */}
          <Button onClick={handleExecute} size="sm">
            <Play className="mr-1 h-4 w-4" />
            実行
          </Button>

          {/* Result */}
          {result !== null && (
            <div className="space-y-1">
              <Label>結果</Label>
              <pre
                className={`rounded border p-2 text-xs ${runtimeError ? 'border-destructive text-destructive' : ''}`}
                data-testid="test-result"
              >
                {result}
              </pre>
            </div>
          )}

          {/* Return type errors */}
          {returnTypeErrors.length > 0 && (
            <div className="space-y-1">
              <Label>返り値の型エラー</Label>
              <pre
                className="rounded border border-destructive p-2 text-xs text-destructive"
                data-testid="return-type-errors"
              >
                {returnTypeErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </pre>
            </div>
          )}

          {/* Console output */}
          {consoleOutput.length > 0 && (
            <div className="space-y-1">
              <Label>コンソール</Label>
              <pre className="rounded border bg-muted p-2 text-xs" data-testid="console-output">
                {consoleOutput.map((line, i) => (
                  <div key={i}>&gt; {line}</div>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
