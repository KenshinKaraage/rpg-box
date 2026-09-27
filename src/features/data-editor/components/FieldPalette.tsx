'use client';

import { useDraggable } from '@dnd-kit/core';
import { Label } from '@/components/ui/label';
import { createFieldTypeInstance, getFieldTypeOptions } from '@/types/fields';
import { FieldCard } from './FieldCard';
import { FIELD_TYPE_CATEGORIES } from './FieldTypeSelector';

export function FieldPalette() {
  const optionMap = new Map(getFieldTypeOptions().map((o) => [o.type, o.label]));

  return (
    <div className="h-full overflow-auto bg-gray-100 p-4">
      <div className="space-y-4">
        {FIELD_TYPE_CATEGORIES.map((category) => (
          <div key={category.label}>
            <Label className="mb-2 block text-xs text-muted-foreground">{category.label}</Label>
            <div className="space-y-8 p-4">
              {category.types.map((type) => {
                const label = optionMap.get(type);
                if (!label) return null;
                return <PaletteItem key={type} type={type} label={label} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaletteItem({ type, label }: { type: string; label: string }) {
  const instance = createFieldTypeInstance(type);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', type, label },
  });

  if (!instance) return null;
  instance.name = label;

  return (
    <FieldCard
      fieldType={instance}
      showChrome
      cardRef={setNodeRef}
      dragHandleProps={{ ...attributes, ...listeners }}
      className="w-full cursor-grab active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    />
  );
}
