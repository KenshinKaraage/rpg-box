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
import { useStore } from '@/stores';
import type { Script, ScriptArg, ScriptReturn } from '@/types/script';
import { IconPicker } from './IconPicker';
import { ColorPresetPicker } from './ColorPresetPicker';

const FIELD_TYPES = [
  { value: 'string', label: '文字列' },
  { value: 'number', label: '数値' },
  { value: 'boolean', label: '真偽値' },
  { value: 'color', label: '色' },
  { value: 'image', label: '画像' },
  { value: 'audio', label: '音声' },
  { value: 'dataSelect', label: 'データ選択' },
];

const RETURN_FIELD_TYPES = [
  { value: 'string', label: '文字列' },
  { value: 'number', label: '数値' },
  { value: 'boolean', label: '真偽値' },
  { value: 'class', label: 'クラス' },
];

interface ScriptSettingsPanelProps {
  script: Script | null;
  onUpdate: (id: string, updates: Partial<Script>) => void;
}

export function ScriptSettingsPanel({ script, onUpdate }: ScriptSettingsPanelProps) {
  const classes = useStore((s) => s.classes);
  const dataTypes = useStore((s) => s.dataTypes);
  const [localName, setLocalName] = useState('');
  const [localCallId, setLocalCallId] = useState('');
  const [localDesc, setLocalDesc] = useState('');

  // Sync local state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setLocalName(script.name);
    setLocalCallId(script.callId ?? '');
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

  const handleNameBlur = () => {
    if (localName !== script.name) {
      onUpdate(script.id, { name: localName });
    }
  };

  const handleCallIdBlur = () => {
    const trimmed = localCallId.trim() || undefined;
    if (trimmed !== (script.callId ?? undefined)) {
      onUpdate(script.id, { callId: trimmed });
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== (script.description ?? '')) {
      onUpdate(script.id, { description: localDesc });
    }
  };

  const handleAddArg = () => {
    const index = script.args.length + 1;
    const newArg: ScriptArg = {
      id: `param${index}`,
      name: `引数${index}`,
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

  const handleAddReturn = () => {
    const index = script.returns.length + 1;
    const newRet: ScriptReturn = {
      id: `result${index}`,
      name: `返り値${index}`,
      fieldType: 'string',
      isArray: false,
    };
    onUpdate(script.id, { returns: [...script.returns, newRet] });
  };

  const handleUpdateReturn = (retId: string, updates: Partial<ScriptReturn>) => {
    const newReturns = script.returns.map((r) => (r.id === retId ? { ...r, ...updates } : r));
    onUpdate(script.id, { returns: newReturns });
  };

  const handleDeleteReturn = (retId: string) => {
    onUpdate(script.id, { returns: script.returns.filter((r) => r.id !== retId) });
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

          {/* Script Type */}
          <div className="space-y-2">
            <Label>スクリプト種類</Label>
            <Select
              value={script.type}
              onValueChange={(v) => onUpdate(script.id, { type: v as Script['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">イベント</SelectItem>
                <SelectItem value="internal">内部</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {script.type === 'event' ? 'イベントエディタで選択可能' : script.type === 'internal' ? 'Script.xxx() でのみ呼び出し可能' : 'オブジェクトにアタッチ'}
            </p>
          </div>

          {/* Icon & Color */}
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>アイコン</Label>
              <IconPicker
                value={script.icon}
                onChange={(icon) => onUpdate(script.id, { icon })}
              />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <ColorPresetPicker
                value={script.color}
                onChange={(color) => onUpdate(script.id, { color })}
              />
            </div>
          </div>

          {/* Call ID (event/component only) */}
          {
            <div className="space-y-2">
              <Label htmlFor="script-call-id">呼び出しID</Label>
              <Input
                id="script-call-id"
                value={localCallId}
                onChange={(e) => setLocalCallId(e.target.value)}
                onBlur={handleCallIdBlur}
                placeholder="例: battle_start"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Script.{localCallId || '___'}() で呼び出し可能
              </p>
            </div>
          }

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

          {/* isAsync */}
          {
            <div className="flex items-center gap-2">
              <Checkbox
                id="script-is-async"
                checked={script.isAsync}
                onCheckedChange={(checked) => onUpdate(script.id, { isAsync: checked === true })}
              />
              <Label htmlFor="script-is-async" className="text-sm">
                完了まで待機する
              </Label>
            </div>
          }

          {/* Arguments (event/component only) */}
          {
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
                  {script.args.map((arg, index) => (
                    <li key={index} className="space-y-2 rounded border p-3">
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
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">変数名</Label>
                        <Input
                          value={arg.id}
                          onChange={(e) => handleUpdateArg(arg.id, { id: e.target.value })}
                          placeholder="例: damage"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">表示名</Label>
                        <Input
                          value={arg.name}
                          onChange={(e) => handleUpdateArg(arg.id, { name: e.target.value })}
                          placeholder="例: ダメージ量"
                        />
                      </div>
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
                      {arg.fieldType === 'dataSelect' && (
                        <Select
                          value={arg.referenceTypeId ?? ''}
                          onValueChange={(v) => handleUpdateArg(arg.id, { referenceTypeId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="データタイプを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataTypes.map((dt) => (
                              <SelectItem key={dt.id} value={dt.id}>
                                {dt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`isArray-${arg.id}`}
                            checked={arg.isArray ?? false}
                            onCheckedChange={(checked) =>
                              handleUpdateArg(arg.id, { isArray: checked === true })
                            }
                          />
                          <Label htmlFor={`isArray-${arg.id}`} className="text-sm">
                            配列
                          </Label>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }

          {/* Returns (event/component only) */}
          {
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>返り値</Label>
                <Button size="sm" variant="outline" onClick={handleAddReturn}>
                  <Plus className="mr-1 h-3 w-3" />
                  追加
                </Button>
              </div>
              {script.returns.length === 0 ? (
                <p className="text-sm text-muted-foreground">返り値がありません</p>
              ) : (
                <>
                  {script.returns.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      return {'{'} {script.returns.map((r) => r.id).join(', ')} {'}'}{' '}
                      の形式で返してください
                    </p>
                  )}
                  <ul className="space-y-3">
                    {script.returns.map((ret, index) => (
                      <li key={index} className="space-y-2 rounded border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ret.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleDeleteReturn(ret.id)}
                            aria-label={`${ret.name}を削除`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">キー名</Label>
                          <Input
                            value={ret.id}
                            onChange={(e) => handleUpdateReturn(ret.id, { id: e.target.value })}
                            placeholder="例: damage"
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">表示名</Label>
                          <Input
                            value={ret.name}
                            onChange={(e) => handleUpdateReturn(ret.id, { name: e.target.value })}
                            placeholder="例: ダメージ量"
                          />
                        </div>
                        <Select
                          value={ret.fieldType}
                          onValueChange={(v) =>
                            handleUpdateReturn(ret.id, {
                              fieldType: v,
                              classId: v === 'class' ? ret.classId : undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_FIELD_TYPES.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {ret.fieldType === 'class' && (
                          <Select
                            value={ret.classId ?? ''}
                            onValueChange={(v) => handleUpdateReturn(ret.id, { classId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="クラスを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`isArray-${ret.id}`}
                            checked={ret.isArray}
                            onCheckedChange={(checked) =>
                              handleUpdateReturn(ret.id, { isArray: checked === true })
                            }
                          />
                          <Label htmlFor={`isArray-${ret.id}`} className="text-sm">
                            配列
                          </Label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
