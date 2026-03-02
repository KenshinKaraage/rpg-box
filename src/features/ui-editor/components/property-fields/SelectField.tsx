import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PropertyDef } from '@/types/ui/UIComponent';
import type { FieldRendererProps } from './types';

export function SelectField({ def, value, onChange }: FieldRendererProps) {
  const d = def as Extract<PropertyDef, { type: 'select' }>;
  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{d.label}</Label>
      <Select
        value={(value as string) ?? d.options[0]?.value ?? ''}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {d.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
