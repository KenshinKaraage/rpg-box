'use client';

import { Label } from '@/components/ui/label';
import type { VariablesComponent } from '@/types/components/VariablesComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: VariablesComponent;
}

export function VariablesPropertyPanel({ component }: Props) {
  const entries = Object.entries(component.variables ?? {});
  return (
    <div className="space-y-1">
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">変数がありません</p>
      ) : (
        <ul className="space-y-0.5">
          {entries.map(([key, val]) => (
            <li key={key} className="flex gap-2 text-xs">
              <Label className="w-24 shrink-0 text-muted-foreground">{key}</Label>
              <span className="truncate">{String(val)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-muted-foreground">変数はゲームスクリプトから操作します</p>
    </div>
  );
}
