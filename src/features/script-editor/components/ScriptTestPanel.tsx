'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Script } from '@/types/script';

interface ScriptTestPanelProps {
  script: Script | null;
}

export function ScriptTestPanel({ script }: ScriptTestPanelProps) {
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

  const handleExecute = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    };

    try {
      // Build arg names and values
      const argNames = script.args.map((a) => a.name);
      const argVals = script.args.map((a) => {
        const raw = argValues[a.id] ?? '';
        if (a.fieldType === 'number') return Number(raw) || 0;
        if (a.fieldType === 'boolean') return raw === 'true';
        return raw;
      });

      // Create and execute function
      const fn = new Function(...argNames, script.content);
      const returnValue = fn(...argVals);
      setResult(returnValue !== undefined ? JSON.stringify(returnValue) : 'undefined');
      setIsError(false);
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e));
      setIsError(true);
    } finally {
      console.log = originalLog;
      setConsoleOutput(logs);
    }
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
