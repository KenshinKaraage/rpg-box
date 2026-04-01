'use client';

import { useState, useCallback } from 'react';
import { Play, Monitor } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameEngine } from '@/engine/core/GameEngine';
import type { GameRuntime } from '@/engine/runtime/GameRuntime';
import type { EngineMessage, ScriptModeConfig } from '@/engine/types';
import type { ProjectData } from '@/lib/storage/types';
import { useStore } from '@/stores';
import type { Script } from '@/types/script';
import { getArgField } from '@/features/event-editor/components/arg-fields';
import '@/features/event-editor/components/arg-fields/register';
import { buildProjectData } from '@/features/test-play/buildProjectData';
import { TestPlayOverlay } from '@/features/test-play';

interface ScriptTestPanelProps {
  script: Script | null;
}

/** 空マップを持つ ProjectData を生成 */
function buildProjectDataWithEmptyMap(): ProjectData {
  const data = buildProjectData();
  data.maps = [...data.maps]; // Immer frozen 解除

  const emptyMapId = '__script_test_map__';
  if (!data.maps.some((m) => m.id === emptyMapId)) {
    data.maps.push({
      id: emptyMapId,
      name: 'スクリプトテスト',
      width: 20,
      height: 15,
      fields: [],
      values: {},
      layers: [
        { id: 'layer_tile', name: 'タイル', type: 'tile', tiles: [] },
        { id: 'layer_obj', name: 'オブジェクト', type: 'object', objects: [] },
      ],
    } as ProjectData['maps'][number]);
  }

  data.gameSettings = { ...data.gameSettings, startMapId: emptyMapId };
  return data;
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

  // UI付きテストプレイ
  const [uiTestData, setUiTestData] = useState<ProjectData | null>(null);

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

  const buildArgs = () => {
    const args: Record<string, unknown> = {};
    for (const arg of script.args) {
      args[arg.id] = argValues[arg.id] ?? arg.defaultValue ?? '';
    }
    return args;
  };

  const handleExecute = async () => {
    const logs: string[] = [];
    let finalResult: string | null = null;
    let errorMsg: string | null = null;
    const typeErrors: string[] = [];

    const args = buildArgs();

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

  // UI付きテストプレイ: GameRuntime 上で実行
  const handleExecuteWithUI = () => {
    const data = buildProjectDataWithEmptyMap();
    setUiTestData(data);
  };

  const handleRuntimeStarted = useCallback(
    (runtime: GameRuntime) => {
      if (!script) return;
      const args = buildArgs();
      runtime.executeScript(script.id, args).catch((err) => {
        console.error('[ScriptTest] Runtime execution error:', err);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [script?.id, argValues]
  );

  const handleCloseUITest = useCallback(() => {
    setUiTestData(null);
  }, []);

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

          {/* Execute buttons */}
          <div className="flex gap-2">
            <Button onClick={handleExecute} size="sm">
              <Play className="mr-1 h-4 w-4" />
              実行
            </Button>
            <Button onClick={handleExecuteWithUI} size="sm" variant="outline">
              <Monitor className="mr-1 h-4 w-4" />
              UI付き実行
            </Button>
          </div>

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

      {/* UI付きテストプレイオーバーレイ */}
      {uiTestData && (
        <TestPlayOverlay
          projectData={uiTestData}
          onClose={handleCloseUITest}
          onStarted={handleRuntimeStarted}
        />
      )}
    </div>
  );
}
