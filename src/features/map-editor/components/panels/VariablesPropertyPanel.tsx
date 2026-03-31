'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { VariablesComponent, ObjectVariable } from '@/types/components/VariablesComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

const ALLOWED_TYPES = [
  { value: 'number', label: '数値' },
  { value: 'string', label: '文字列' },
  { value: 'boolean', label: '真偽値' },
  { value: 'class', label: 'クラス' },
];

function getDefaultValue(fieldType: string): unknown {
  switch (fieldType) {
    case 'number': return 0;
    case 'string': return '';
    case 'boolean': return false;
    case 'class': return {};
    default: return '';
  }
}

interface Props extends ComponentPanelProps {
  component: VariablesComponent;
}

export function VariablesPropertyPanel({ component, onChange }: Props) {
  const entries = Object.entries(component.variables ?? {});
  const classes = useStore((s) => s.classes);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('number');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name || name in component.variables) return;
    const newVar: ObjectVariable = { fieldType: newType, value: getDefaultValue(newType) };
    onChange({ variables: { ...component.variables, [name]: newVar } });
    setNewName('');
  };

  const handleDelete = (key: string) => {
    const updated = { ...component.variables };
    delete updated[key];
    onChange({ variables: updated });
  };

  const handleValueChange = (key: string, rawValue: string) => {
    const v = component.variables[key];
    if (!v) return;
    let value: unknown;
    if (v.fieldType === 'number') {
      value = parseFloat(rawValue) || 0;
    } else {
      value = rawValue;
    }
    onChange({ variables: { ...component.variables, [key]: { ...v, value } } });
  };

  const handleBoolChange = (key: string, checked: boolean) => {
    const v = component.variables[key];
    if (!v) return;
    onChange({ variables: { ...component.variables, [key]: { ...v, value: checked } } });
  };

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">変数がありません</p>
      ) : (
        <div className="space-y-1">
          {entries.map(([key, v]) => (
            <div key={key} className="flex items-center gap-1">
              <Label className="w-20 shrink-0 truncate text-[10px]" title={key}>{key}</Label>
              {v.fieldType === 'boolean' ? (
                <Checkbox
                  checked={v.value === true}
                  onCheckedChange={(c) => handleBoolChange(key, c === true)}
                />
              ) : v.fieldType === 'class' ? (
                <span className="flex-1 truncate text-[10px] text-muted-foreground">
                  {v.classId || 'クラス未選択'}
                </span>
              ) : (
                <Input
                  className="h-6 flex-1 text-[10px]"
                  type={v.fieldType === 'number' ? 'number' : 'text'}
                  value={String(v.value ?? '')}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                />
              )}
              <span className="shrink-0 text-[9px] text-muted-foreground">
                {ALLOWED_TYPES.find((t) => t.value === v.fieldType)?.label ?? v.fieldType}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 shrink-0 p-0"
                onClick={() => handleDelete(key)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 追加行 */}
      <div className="flex items-center gap-1 border-t pt-2">
        <Input
          className="h-6 flex-1 text-[10px]"
          placeholder="変数名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="h-6 w-16 text-[9px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALLOWED_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" className="h-5 px-1" onClick={handleAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
