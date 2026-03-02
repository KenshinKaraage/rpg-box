import { Label } from '@/components/ui/label';
import { splitColorAlpha } from '@/lib/colorUtils';
import { ColorPickerPopover } from '../ColorPickerPopover';
import type { FieldRendererProps } from './types';

export function ColorField({ def, value, onChange }: FieldRendererProps) {
  const showAlpha = def.type === 'colorAlpha';
  const color = value as string | undefined;
  const { hex6, alpha } = splitColorAlpha(color);

  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
      <ColorPickerPopover
        value={color}
        onChange={(v) => onChange(v)}
        showAlpha={showAlpha}
      >
        <button
          type="button"
          className="flex h-7 flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm hover:bg-accent/50"
        >
          {/* Color swatch */}
          <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-input">
            {showAlpha && (
              <span
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
            )}
            <span
              className="absolute inset-0"
              style={{ backgroundColor: hex6, opacity: showAlpha ? alpha : 1 }}
            />
          </span>
          <span className="truncate text-muted-foreground">
            {color ?? '未設定'}
          </span>
        </button>
      </ColorPickerPopover>
    </div>
  );
}
