'use client';

import '@/features/ui-editor/components/property-fields/register';
import { getUIComponent } from '@/types/ui';
import { getPropertyField, VertexField, InlineAnimationEditor } from './property-fields';
import type { FieldRendererProps } from './property-fields';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';

// ──────────────────────────────────────────────
// ComponentPropertyEditor
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

  const showAnimationEditor =
    componentType === 'animation' && (data.mode as string) === 'inline';

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
        <VertexField
          vertices={(data.vertices as { x: number; y: number }[]) ?? []}
          onChange={(v) => handleChange('vertices', v)}
          minVertices={componentType === 'line' ? 2 : 3}
        />
      )}
      {showAnimationEditor && (
        <InlineAnimationEditor
          animations={(data.animations as NamedAnimation[]) ?? []}
          onChange={(v) => handleChange('animations', v)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// PropertyField — registry lookup
// ──────────────────────────────────────────────

export function PropertyField({ def, value, onChange }: FieldRendererProps) {
  const Renderer = getPropertyField(def.type);
  if (!Renderer) return null;
  return <Renderer def={def} value={value} onChange={onChange} />;
}
