import type { PropertyDef } from '@/types/ui/UIComponent';

/** 全フィールドレンダラーが受け取る共通 props */
export interface FieldRendererProps {
  def: PropertyDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export type FieldRenderer = React.FC<FieldRendererProps>;
