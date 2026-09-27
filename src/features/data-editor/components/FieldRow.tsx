'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldTypeOptions } from '@/types/fields';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { cn } from '@/lib/utils';
import { CommonFieldConfig } from './fields/CommonFieldConfig';
import { FieldCard } from './FieldCard';
import type { AnyFieldType, DropPosition } from './fieldDragTypes';

interface FieldRowProps {
  field: AnyFieldType;
  isExpanded: boolean;
  dropPosition?: DropPosition | null;
  animateIn?: boolean;
  onToggleExpand: () => void;
  onIdChange: (newId: string) => void;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string) => void;
  onConfigChange: (updates: Record<string, unknown>) => void;
  onDelete: () => void;
  /** 削除不可フラグ（名前フィールドなど） */
  undeletable?: boolean;
  configContext?: FieldConfigContext;
  allowedTypes?: string[];
}

export function FieldRow({
  field,
  isExpanded,
  dropPosition,
  animateIn,
  onToggleExpand,
  onIdChange,
  onNameChange,
  onTypeChange,
  onConfigChange,
  onDelete,
  undeletable,
  configContext,
  allowedTypes,
}: FieldRowProps) {
  const fieldTypeOptions = getFieldTypeOptions(allowedTypes);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: 'field', field },
  });

  return (
    <FieldCard
      fieldType={field}
      value={field.getInitialValue()}
      onValueChange={(value) => onConfigChange({ defaultValue: value })}
      onNameChange={onNameChange}
      onDelete={onDelete}
      deleteDisabled={undeletable}
      onGearClick={onToggleExpand}
      dropPosition={dropPosition}
      showChrome={isDragging}
      cardRef={setNodeRef}
      dataFieldRow={field.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragHandleProps={{ ...attributes, ...listeners }}
      className={cn(
        'mb-4 cursor-grab select-none active:cursor-grabbing',
        animateIn && 'animate-in fade-in-0 slide-in-from-top-2 duration-200',
        isDragging && 'opacity-30'
      )}
    >
      {isExpanded && (
        <div
          className="space-y-3 rounded-lg border bg-muted/20 p-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <Label className="text-xs">フィールドID</Label>
            <Input
              defaultValue={field.id}
              disabled={undeletable}
              onBlur={(e) => {
                const newId = e.target.value.trim();
                if (newId && newId !== field.id) {
                  onIdChange(newId);
                }
              }}
              placeholder="フィールドID"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">タイプ</Label>
            <Select value={field.type} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypeOptions.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CommonFieldConfig required={field.required} onChange={onConfigChange} />
          {field.renderConfig({ onChange: onConfigChange, context: configContext })}
        </div>
      )}
    </FieldCard>
  );
}
