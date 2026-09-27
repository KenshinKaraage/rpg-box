'use client';

import { createFieldTypeInstance } from '@/types/fields';
import { FieldCard } from './FieldCard';
import type { ActiveDragData } from './fieldDragTypes';

interface DragPreviewProps {
  data: ActiveDragData;
  width: number | null;
}

export function DragPreview({ data, width }: DragPreviewProps) {
  const style = width ? { width } : undefined;

  if (data.source === 'palette') {
    const instance = createFieldTypeInstance(data.type);
    if (!instance) return null;
    instance.name = data.label;
    return <FieldCard fieldType={instance} showChrome className="border-primary" style={style} />;
  }

  return <FieldCard fieldType={data.field} showChrome className="border-primary" style={style} />;
}
