'use client';

import { useCallback, useMemo, useState } from 'react';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import { AssetPickerModal } from '@/features/asset-manager/components/AssetPickerModal';
import { getUIComponent } from '@/types/ui';
import type { PropertyDef } from '@/types/ui/UIComponent';
import { splitColorAlpha } from '@/lib/colorUtils';
import { ColorPickerPopover } from './ColorPickerPopover';

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
  instance.deserialize(data);
  const defs = instance.getPropertyDefs();
  if (defs.length === 0) return null;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const showVertexEditor =
    (componentType === 'shape' && (data.shapeType as string) === 'polygon') ||
    componentType === 'line';

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
      {showVertexEditor && (
        <VertexEditor
          vertices={(data.vertices as { x: number; y: number }[]) ?? []}
          onChange={(v) => handleChange('vertices', v)}
          minVertices={componentType === 'line' ? 2 : 3}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Individual field renderer
// ──────────────────────────────────────────────

export function PropertyField({
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
        <ColorField
          label={def.label}
          value={value as string | undefined}
          onChange={onChange}
          showAlpha={false}
        />
      );

    case 'colorAlpha':
      return (
        <ColorField
          label={def.label}
          value={value as string | undefined}
          onChange={onChange}
          showAlpha={true}
        />
      );

    case 'assetImage':
      return <AssetImageField label={def.label} value={value as string | undefined} onChange={onChange} />;

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

// ──────────────────────────────────────────────
// Vertex editor (polygon / line 共用)
// ──────────────────────────────────────────────

function VertexEditor({
  vertices,
  onChange,
  minVertices = 3,
}: {
  vertices: { x: number; y: number }[];
  onChange: (v: { x: number; y: number }[]) => void;
  minVertices?: number;
}) {
  const handleVertexChange = (index: number, axis: 'x' | 'y', value: number) => {
    const updated = vertices.map((v, i) => (i === index ? { ...v, [axis]: value } : v));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (vertices.length <= minVertices) return;
    onChange(vertices.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const last = vertices[vertices.length - 1];
    const first = vertices[0];
    if (last && first) {
      onChange([...vertices, { x: (last.x + first.x) / 2, y: (last.y + first.y) / 2 }]);
    } else {
      onChange([...vertices, { x: 0.5, y: 0.5 }]);
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">頂点</Label>
      {vertices.map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="w-5 shrink-0 text-right text-[10px] text-muted-foreground">{i}</span>
          <Input
            type="number"
            className="h-6 flex-1 px-1 text-xs"
            value={v.x}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleVertexChange(i, 'x', val);
            }}
          />
          <Input
            type="number"
            className="h-6 flex-1 px-1 text-xs"
            value={v.y}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleVertexChange(i, 'y', val);
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 shrink-0 p-0"
            disabled={vertices.length <= minVertices}
            onClick={() => handleRemove(i)}
            aria-label="頂点を削除"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-full text-xs"
        onClick={handleAdd}
      >
        <Plus className="mr-1 h-3 w-3" />
        頂点を追加
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Color field with ColorPickerPopover
// ──────────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
  showAlpha,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: unknown) => void;
  showAlpha: boolean;
}) {
  const { hex6, alpha } = splitColorAlpha(value);

  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <ColorPickerPopover
        value={value}
        onChange={(v) => onChange(v)}
        showAlpha={showAlpha}
      >
        <button
          type="button"
          className="flex h-7 flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm hover:bg-accent/50"
        >
          {/* Color swatch */}
          <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-input">
            {showAlpha && (
              <span
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
            )}
            <span
              className="absolute inset-0"
              style={{ backgroundColor: hex6, opacity: showAlpha ? alpha : 1 }}
            />
          </span>
          <span className="truncate text-muted-foreground">
            {value ?? (showAlpha ? '未設定' : '未設定')}
          </span>
        </button>
      </ColorPickerPopover>
    </div>
  );
}

// ──────────────────────────────────────────────
// Asset Image field
// ──────────────────────────────────────────────

function AssetImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: unknown) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const assets = useStore((s) => s.assets);
  const assetFolders = useStore((s) => s.assetFolders);

  const selectedAsset = useMemo(
    () => (value ? assets.find((a) => a.id === value) : undefined),
    [value, assets]
  );

  const handleSelect = useCallback(
    (assetId: string | null) => {
      onChange(assetId ?? undefined);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label className="w-24 shrink-0 text-xs text-muted-foreground">{label}</Label>
        <div className="flex flex-1 items-center gap-1">
          {selectedAsset ? (
            <>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                {selectedAsset.data ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedAsset.data as string}
                    alt={selectedAsset.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs">{selectedAsset.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 shrink-0 p-0"
                onClick={() => onChange(undefined)}
                aria-label="クリア"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-xs"
              onClick={() => setIsOpen(true)}
            >
              画像を選択...
            </Button>
          )}
          {selectedAsset && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs"
              onClick={() => setIsOpen(true)}
            >
              変更
            </Button>
          )}
        </div>
      </div>
      <AssetPickerModal
        open={isOpen}
        onOpenChange={setIsOpen}
        assets={assets}
        folders={assetFolders}
        assetType="image"
        onSelect={handleSelect}
        selectedAssetId={value ?? null}
      />
    </div>
  );
}
