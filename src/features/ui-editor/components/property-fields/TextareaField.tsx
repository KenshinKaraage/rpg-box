import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PropertyDef } from '@/types/ui/UIComponent';
import type { FieldRendererProps } from './types';

export function TextareaField({ def, value, onChange }: FieldRendererProps) {
  const d = def as Extract<PropertyDef, { type: 'textarea' }>;
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted-foreground">{d.label}</Label>
      <Textarea
        className="min-h-[60px] text-xs"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={d.placeholder}
      />
    </div>
  );
}
