'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';

interface UIObjectSelectorProps {
  value: string;
  onChange: (id: string) => void;
  /** 「自身」オプションを表示するか (空文字列 = 自身) */
  showSelf?: boolean;
  className?: string;
}

/**
 * 現在のキャンバス内のUIオブジェクトを選択するドロップダウン
 */
export function UIObjectSelector({
  value,
  onChange,
  showSelf = true,
  className,
}: UIObjectSelectorProps) {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const objects = canvas?.objects ?? [];

  return (
    <Select value={value || '__self__'} onValueChange={(v) => onChange(v === '__self__' ? '' : v)}>
      <SelectTrigger className={className ?? 'h-7 text-xs'} data-testid="object-selector">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showSelf && <SelectItem value="__self__">（自身）</SelectItem>}
        {objects.map((obj) => (
          <SelectItem key={obj.id} value={obj.id}>
            {obj.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface UICanvasSelectorProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * UIキャンバスを選択するドロップダウン
 */
export function UICanvasSelector({ value, onChange, className }: UICanvasSelectorProps) {
  const uiCanvases = useStore((s) => s.uiCanvases);

  return (
    <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)}>
      <SelectTrigger className={className ?? 'h-7 text-xs'} data-testid="canvas-selector">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">（選択なし）</SelectItem>
        {uiCanvases.map((canvas) => (
          <SelectItem key={canvas.id} value={canvas.id}>
            {canvas.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
