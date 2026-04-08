'use client';

type AlignValue = 'start' | 'center' | 'end';

interface LayoutAlignPresetsProps {
  direction: 'horizontal' | 'vertical';
  alignment: AlignValue;
  justify: AlignValue;
  onUpdate: (updates: { alignment?: AlignValue; justify?: AlignValue }) => void;
}

interface PresetCell {
  col: AlignValue;
  row: AlignValue;
  label: string;
}

const PRESETS: PresetCell[][] = [
  [
    { col: 'start', row: 'start', label: '左上' },
    { col: 'center', row: 'start', label: '中上' },
    { col: 'end', row: 'start', label: '右上' },
  ],
  [
    { col: 'start', row: 'center', label: '左中' },
    { col: 'center', row: 'center', label: '中央' },
    { col: 'end', row: 'center', label: '右中' },
  ],
  [
    { col: 'start', row: 'end', label: '左下' },
    { col: 'center', row: 'end', label: '中下' },
    { col: 'end', row: 'end', label: '右下' },
  ],
];

export function LayoutAlignPresets({
  direction,
  alignment,
  justify,
  onUpdate,
}: LayoutAlignPresetsProps) {
  // vertical:   横=alignment(直交), 縦=justify(主軸)
  // horizontal: 横=justify(主軸),   縦=alignment(直交)
  const toValues = (preset: PresetCell): { alignment: AlignValue; justify: AlignValue } => {
    if (direction === 'vertical') {
      return { alignment: preset.col, justify: preset.row };
    } else {
      return { alignment: preset.row, justify: preset.col };
    }
  };

  const isActive = (preset: PresetCell): boolean => {
    const v = toValues(preset);
    return v.alignment === alignment && v.justify === justify;
  };

  return (
    <div className="inline-grid grid-cols-3 gap-0.5">
      {PRESETS.flat().map((preset) => (
        <button
          key={`${preset.col}-${preset.row}`}
          type="button"
          className={`h-4 w-4 rounded-sm border ${
            isActive(preset)
              ? 'border-blue-500 bg-blue-500'
              : 'border-muted-foreground/40 bg-muted hover:bg-accent'
          }`}
          aria-label={preset.label}
          onClick={() => onUpdate(toValues(preset))}
        />
      ))}
    </div>
  );
}
