import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FieldRendererProps } from './types';

export function BooleanField({ def, value, onChange }: FieldRendererProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`prop-${def.key}`}
        checked={(value as boolean) ?? false}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={`prop-${def.key}`} className="text-xs">
        {def.label}
      </Label>
    </div>
  );
}
