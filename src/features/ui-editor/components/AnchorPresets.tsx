'use client';

import type { RectTransform } from '@/types/ui/UIComponent';

interface AnchorPresetsProps {
  anchorX: RectTransform['anchorX'];
  anchorY: RectTransform['anchorY'];
  onUpdate: (updates: Partial<Pick<RectTransform, 'anchorX' | 'anchorY'>>) => void;
}

type AnchorXValue = RectTransform['anchorX'];
type AnchorYValue = RectTransform['anchorY'];

interface PresetCell {
  ax: AnchorXValue;
  ay: AnchorYValue;
  label: string;
}

const PRESETS: PresetCell[][] = [
  [
    { ax: 'left', ay: 'top', label: '左上' },
    { ax: 'center', ay: 'top', label: '中上' },
    { ax: 'right', ay: 'top', label: '右上' },
  ],
  [
    { ax: 'left', ay: 'center', label: '左中' },
    { ax: 'center', ay: 'center', label: '中央' },
    { ax: 'right', ay: 'center', label: '右中' },
  ],
  [
    { ax: 'left', ay: 'bottom', label: '左下' },
    { ax: 'center', ay: 'bottom', label: '中下' },
    { ax: 'right', ay: 'bottom', label: '右下' },
  ],
];

export function AnchorPresets({ anchorX, anchorY, onUpdate }: AnchorPresetsProps) {
  return (
    <div className="inline-grid grid-cols-3 gap-0.5" data-testid="anchor-presets">
      {PRESETS.flat().map((preset) => {
        const isActive = preset.ax === anchorX && preset.ay === anchorY;
        return (
          <button
            key={`${preset.ax}-${preset.ay}`}
            type="button"
            data-testid={`anchor-preset-${preset.ax}-${preset.ay}`}
            className={`h-4 w-4 rounded-sm border ${
              isActive
                ? 'border-blue-500 bg-blue-500'
                : 'border-muted-foreground/40 bg-muted hover:bg-accent'
            }`}
            aria-label={preset.label}
            onClick={() => onUpdate({ anchorX: preset.ax, anchorY: preset.ay })}
          />
        );
      })}
    </div>
  );
}
