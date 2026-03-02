'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUIComponent } from '@/types/ui';
import type { PropertyDef } from '@/types/ui/UIComponent';

// ──────────────────────────────────────────────
// Renderer
// ──────────────────────────────────────────────

interface ComponentPropertyEditorProps {
  componentType: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

/**
 * コンポーネントのプロパティエディタ。
 * コンポーネントインスタンスの getPropertyDefs() からプロパティ定義を動的に取得する。
 */
export function ComponentPropertyEditor({
  componentType,
  data,
  onChange,
}: ComponentPropertyEditorProps) {
  const Ctor = getUIComponent(componentType);
  if (!Ctor) return null;

  const instance = new Ctor();
  const defs = instance.getPropertyDefs();
  if (defs.length === 0) return null;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-2 px-2 pb-2" data-testid={`property-editor-${componentType}`}>
      {defs.map((prop) => (
        <PropertyField
          key={prop.key}
          def={prop}
          value={data[prop.key]}
          onChange={(v) => handleChange(prop.key, v)}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Individual field renderer
// ──────────────────────────────────────────────

function PropertyField({
  def,
  value,
  onChange,
}: {
  def: PropertyDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (def.type) {
    case 'number':
      return (
        <div className="flex items-center gap-2">
          <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={value as number ?? 0}
            min={def.min}
            max={def.max}
            step={def.step ?? 1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(v);
            }}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`prop-${def.key}`}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label htmlFor={`prop-${def.key}`} className="text-xs">
            {def.label}
          </Label>
        </div>
      );

    case 'select':
      return (
        <div className="flex items-center gap-2">
          <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
          <Select
            value={(value as string) ?? def.options[0]?.value ?? ''}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {def.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
          <div className="flex flex-1 items-center gap-1">
            <input
              type="color"
              className="h-7 w-7 shrink-0 cursor-pointer rounded border"
              value={(value as string) ?? '#000000'}
              onChange={(e) => onChange(e.target.value)}
            />
            <Input
              className="h-7 text-xs"
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="flex items-center gap-2">
          <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
          <Input
            className="h-7 text-xs"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.placeholder}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">{def.label}</Label>
          <Textarea
            className="min-h-[60px] text-xs"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.placeholder}
          />
        </div>
      );

    default:
      return null;
  }
}
