import type { FieldType } from '@/types/fields/FieldType';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFieldType = FieldType<any>;

export type DropPosition = 'before' | 'after';

export interface DropTarget {
  fieldId: string | null;
  position: DropPosition;
}

export type ActiveDragData =
  | { source: 'palette'; type: string; label: string }
  | { source: 'field'; field: AnyFieldType };

export const END_DROP_ZONE_ID = '__end__';
