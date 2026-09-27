'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropIndicator } from './DropIndicator';
import { FieldNameField } from './FieldNameField';
import type { AnyFieldType, DropPosition } from './fieldDragTypes';

interface FieldCardProps {
  fieldType: AnyFieldType;
  value?: unknown;
  onValueChange?: (value: unknown) => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  onGearClick?: () => void;
  dropPosition?: DropPosition | null;
  showChrome?: boolean;
  className?: string;
  style?: CSSProperties;
  cardRef?: (el: HTMLDivElement | null) => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  dataFieldRow?: string;
  children?: ReactNode;
}

export function FieldCard({
  fieldType,
  value,
  onValueChange,
  onNameChange,
  onDelete,
  deleteDisabled,
  onGearClick,
  dropPosition,
  showChrome = false,
  className,
  style,
  cardRef,
  dragHandleProps,
  dataFieldRow,
  children,
}: FieldCardProps) {
  return (
    <div
      ref={cardRef}
      data-field-row={dataFieldRow}
      style={style}
      {...dragHandleProps}
      className={cn(
        'group relative isolate rounded-sm outline-none focus-visible:outline-none',
        className
      )}
    >
      {showChrome && (
        <div className="absolute -inset-3 -z-10 rounded-sm border bg-card" aria-hidden="true" />
      )}

      {dropPosition && <DropIndicator position={dropPosition} />}

      <div className="absolute right-0 top-0 flex items-center gap-1">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`${fieldType.name}を削除`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          disabled={!onGearClick}
          onClick={onGearClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-default"
          aria-label={`${fieldType.name}の設定`}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <FieldNameField
          name={fieldType.name}
          required={fieldType.required}
          onNameChange={onNameChange}
        />

        {onValueChange ? (
          <div onPointerDown={(e) => e.stopPropagation()}>
            {fieldType.renderEditor({
              value: value ?? fieldType.getDefaultValue(),
              onChange: onValueChange,
            })}
          </div>
        ) : (
          <div className="pointer-events-none opacity-70">
            {fieldType.renderEditor({
              value: fieldType.getDefaultValue(),
              onChange: () => {},
              disabled: true,
            })}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
