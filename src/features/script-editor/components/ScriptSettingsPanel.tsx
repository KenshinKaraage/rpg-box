'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Script, ScriptArg } from '@/types/script';

const FIELD_TYPES = [
  { value: 'string', label: '文字列' },
  { value: 'number', label: '数値' },
  { value: 'boolean', label: '真偽値' },
];

interface ScriptSettingsPanelProps {
  script: Script | null;
  onUpdate: (id: string, updates: Partial<Script>) => void;
}

export function ScriptSettingsPanel({ script, onUpdate }: ScriptSettingsPanelProps) {
  const [localName, setLocalName] = useState('');
  const [localDesc, setLocalDesc] = useState('');

  // Sync local state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setLocalName(script.name);
    setLocalDesc(script.description ?? '');
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

  const isInternal = script.type === 'internal';

  const handleNameBlur = () => {
    if (localName !== script.name) {
      onUpdate(script.id, { name: localName });
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== (script.description ?? '')) {
      onUpdate(script.id, { description: localDesc });
    }
  };

  const handleAddArg = () => {
    const newArg: ScriptArg = {
      id: `arg_${Date.now()}`,
      name: '新しい引数',
      fieldType: 'string',
      required: false,
    };
    onUpdate(script.id, { args: [...script.args, newArg] });
  };

  const handleUpdateArg = (argId: string, updates: Partial<ScriptArg>) => {
    const newArgs = script.args.map((arg) => (arg.id === argId ? { ...arg, ...updates } : arg));
    onUpdate(script.id, { args: newArgs });
  };

  const handleDeleteArg = (argId: string) => {
    onUpdate(script.id, { args: script.args.filter((a) => a.id !== argId) });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="script-name">名前</Label>
            <Input
              id="script-name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="script-desc">説明</Label>
            <Textarea
              id="script-desc"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={handleDescBlur}
              rows={3}
            />
          </div>

          {/* Arguments (event/component only) */}
          {!isInternal && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>引数</Label>
                <Button size="sm" variant="outline" onClick={handleAddArg}>
                  <Plus className="mr-1 h-3 w-3" />
                  追加
                </Button>
              </div>
              {script.args.length === 0 ? (
                <p className="text-sm text-muted-foreground">引数がありません</p>
              ) : (
                <ul className="space-y-3">
                  {script.args.map((arg) => (
                    <li key={arg.id} className="space-y-2 rounded border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{arg.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDeleteArg(arg.id)}
                          aria-label={`${arg.name}を削除`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={arg.name}
                        onChange={(e) => handleUpdateArg(arg.id, { name: e.target.value })}
                        placeholder="引数名"
                      />
                      <Select
                        value={arg.fieldType}
                        onValueChange={(v) => handleUpdateArg(arg.id, { fieldType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((ft) => (
                            <SelectItem key={ft.value} value={ft.value}>
                              {ft.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`required-${arg.id}`}
                          checked={arg.required}
                          onCheckedChange={(checked) =>
                            handleUpdateArg(arg.id, { required: checked === true })
                          }
                        />
                        <Label htmlFor={`required-${arg.id}`} className="text-sm">
                          必須
                        </Label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
