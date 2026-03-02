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

// ──────────────────────────────────────────────
// Property Schema
// ──────────────────────────────────────────────

type PropertyDef = {
  key: string;
  label: string;
} & (
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'boolean' }
  | { type: 'select'; options: { value: string; label: string }[] }
  | { type: 'color' }
  | { type: 'text'; placeholder?: string }
  | { type: 'textarea'; placeholder?: string }
);

const COMPONENT_SCHEMAS: Record<string, PropertyDef[]> = {
  image: [
    { key: 'opacity', label: '不透明度', type: 'number', min: 0, max: 1, step: 0.1 },
    { key: 'tint', label: 'ティント', type: 'color' },
    {
      key: 'sliceMode',
      label: 'スライスモード',
      type: 'select',
      options: [
        { value: 'none', label: 'なし' },
        { value: 'nine-slice', label: 'ナインスライス' },
      ],
    },
  ],
  text: [
    { key: 'content', label: 'テキスト', type: 'textarea', placeholder: 'テキストを入力...' },
    { key: 'fontSize', label: 'フォントサイズ', type: 'number', min: 1 },
    { key: 'color', label: '色', type: 'color' },
    {
      key: 'align',
      label: '水平揃え',
      type: 'select',
      options: [
        { value: 'left', label: '左' },
        { value: 'center', label: '中央' },
        { value: 'right', label: '右' },
      ],
    },
    {
      key: 'verticalAlign',
      label: '垂直揃え',
      type: 'select',
      options: [
        { value: 'top', label: '上' },
        { value: 'middle', label: '中央' },
        { value: 'bottom', label: '下' },
      ],
    },
    { key: 'lineHeight', label: '行間', type: 'number', min: 0.5, max: 5, step: 0.1 },
  ],
  shape: [
    {
      key: 'shapeType',
      label: '種類',
      type: 'select',
      options: [
        { value: 'rectangle', label: '矩形' },
        { value: 'ellipse', label: '楕円' },
        { value: 'polygon', label: 'ポリゴン' },
      ],
    },
    { key: 'fillColor', label: '塗り', type: 'color' },
    { key: 'strokeColor', label: '線色', type: 'color' },
    { key: 'strokeWidth', label: '線幅', type: 'number', min: 0 },
    { key: 'cornerRadius', label: '角丸', type: 'number', min: 0 },
  ],
  fillMask: [
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { value: 'horizontal', label: '水平' },
        { value: 'vertical', label: '垂直' },
      ],
    },
    { key: 'fillAmount', label: '充填量', type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'reverse', label: '反転', type: 'boolean' },
  ],
  colorMask: [
    { key: 'color', label: '色', type: 'color' },
    {
      key: 'blendMode',
      label: 'ブレンドモード',
      type: 'select',
      options: [
        { value: 'multiply', label: '乗算' },
        { value: 'add', label: '加算' },
        { value: 'overlay', label: 'オーバーレイ' },
      ],
    },
    { key: 'opacity', label: '不透明度', type: 'number', min: 0, max: 1, step: 0.1 },
  ],
  layoutGroup: [
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { value: 'vertical', label: '垂直' },
        { value: 'horizontal', label: '水平' },
      ],
    },
    { key: 'spacing', label: '間隔', type: 'number', min: 0 },
    {
      key: 'alignment',
      label: '配置',
      type: 'select',
      options: [
        { value: 'start', label: '先頭' },
        { value: 'center', label: '中央' },
        { value: 'end', label: '末尾' },
      ],
    },
    { key: 'reverseOrder', label: '逆順', type: 'boolean' },
  ],
  gridLayout: [
    { key: 'columns', label: '列数', type: 'number', min: 1 },
    { key: 'spacingX', label: '水平間隔', type: 'number', min: 0 },
    { key: 'spacingY', label: '垂直間隔', type: 'number', min: 0 },
    { key: 'cellWidth', label: 'セル幅', type: 'number', min: 0 },
    { key: 'cellHeight', label: 'セル高', type: 'number', min: 0 },
  ],
  navigation: [
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { value: 'vertical', label: '垂直' },
        { value: 'horizontal', label: '水平' },
        { value: 'grid', label: 'グリッド' },
      ],
    },
    { key: 'wrap', label: '折り返し', type: 'boolean' },
    { key: 'initialIndex', label: '初期インデックス', type: 'number', min: 0 },
    { key: 'columns', label: '列数(grid用)', type: 'number', min: 1 },
  ],
  navigationCursor: [
    { key: 'offsetX', label: 'オフセットX', type: 'number' },
    { key: 'offsetY', label: 'オフセットY', type: 'number' },
  ],
  animation: [
    {
      key: 'mode',
      label: 'モード',
      type: 'select',
      options: [
        { value: 'inline', label: 'インライン' },
        { value: 'reference', label: '参照' },
      ],
    },
    { key: 'autoPlay', label: '自動再生', type: 'boolean' },
    { key: 'loop', label: 'ループ', type: 'boolean' },
  ],
};

// ──────────────────────────────────────────────
// Renderer
// ──────────────────────────────────────────────

interface ComponentPropertyEditorProps {
  componentType: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function ComponentPropertyEditor({
  componentType,
  data,
  onChange,
}: ComponentPropertyEditorProps) {
  const schema = COMPONENT_SCHEMAS[componentType];
  if (!schema) return null;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-2 px-2 pb-2" data-testid={`property-editor-${componentType}`}>
      {schema.map((prop) => (
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

/**
 * Returns true if a component type has a property schema.
 */
export function hasPropertySchema(componentType: string): boolean {
  return componentType in COMPONENT_SCHEMAS;
}
