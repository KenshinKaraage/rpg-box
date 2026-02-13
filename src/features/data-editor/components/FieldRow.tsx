'use client';

import { ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getFieldTypeOptions } from '@/types/fields';
import type { FieldType } from '@/types/fields/FieldType';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { CommonFieldConfig } from './fields/CommonFieldConfig';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

interface FieldRowProps {
  field: AnyFieldType;
  isExpanded: boolean;
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

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="rounded-md border bg-card">
        {/* Header row */}
        <div className="flex items-center gap-2 p-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>

          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />

          <Input
            className="flex-1"
            value={field.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="フィールド名"
          />

          <Select value={field.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-32">
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

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={undeletable}
            aria-label={`${field.name}を削除`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Expandable config panel */}
        <CollapsibleContent>
          <div className="space-y-3 border-t bg-muted/30 px-4 py-3">
            <div className="space-y-1">
              <Label className="text-xs">フィールドID</Label>
              <Input
                defaultValue={field.id}
                onBlur={(e) => {
                  const newId = e.target.value.trim();
                  if (newId && newId !== field.id) {
                    onIdChange(newId);
                  }
                }}
                placeholder="フィールドID"
              />
            </div>
            <CommonFieldConfig required={field.required} onChange={onConfigChange} />
            {field.renderConfig({ onChange: onConfigChange, context: configContext })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
