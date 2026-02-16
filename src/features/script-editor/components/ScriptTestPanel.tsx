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

interface ScriptTestPanelProps {
  script: Script | null;
}

export function ScriptTestPanel({ script }: ScriptTestPanelProps) {
  const scripts = useStore((s) => s.scripts);
  const variables = useStore((s) => s.variables);
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);

  // Reset state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setArgValues({});
    setResult(null);
    setConsoleOutput([]);
    setIsError(false);
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
    let hasError = false;

    // Build args
    const args: Record<string, unknown> = {};
    for (const arg of script.args) {
      const raw = argValues[arg.id] ?? '';
      if (arg.fieldType === 'number') args[arg.name] = Number(raw) || 0;
      else if (arg.fieldType === 'boolean') args[arg.name] = raw === 'true';
      else args[arg.name] = raw;
    }

    // Map store variables to engine format
    const engineVariables = variables.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.fieldType.type,
      defaultValue: v.initialValue,
    }));

    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts,
        variables: engineVariables,
        dataTypes: [],
        dataEntries: {},
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
          finalResult = msg.error;
          hasError = true;
          break;
      }
    });

    await engine.handleMessage({ type: 'start', config });

    setResult(finalResult);
    setIsError(hasError);
    setConsoleOutput(logs);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-header items-center border-b px-4 font-semibold">テスト</div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Arguments */}
          {script.args.length > 0 && (
            <div className="space-y-2">
              <Label>引数</Label>
              {script.args.map((arg) => (
                <div key={arg.id} className="space-y-1">
                  <Label htmlFor={`test-arg-${arg.id}`} className="text-xs">
                    {arg.name}
                  </Label>
                  <Input
                    id={`test-arg-${arg.id}`}
                    value={argValues[arg.id] ?? ''}
                    onChange={(e) =>
                      setArgValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
                    }
                    placeholder={arg.fieldType}
                  />
                </div>
              ))}
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
                className={`rounded border p-2 text-xs ${isError ? 'border-destructive text-destructive' : ''}`}
                data-testid="test-result"
              >
                {result}
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
