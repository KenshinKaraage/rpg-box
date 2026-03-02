import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PropertyDef } from '@/types/ui/UIComponent';
import type { FieldRendererProps } from './types';

export function TextField({ def, value, onChange }: FieldRendererProps) {
  const d = def as Extract<PropertyDef, { type: 'text' }>;
  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{d.label}</Label>
      <Input
        className="h-7 text-xs"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={d.placeholder}
      />
    </div>
  );
}
