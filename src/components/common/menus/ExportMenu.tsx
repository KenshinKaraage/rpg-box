'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface ExportMenuProps {
  onExportWebGame?: () => void;
}

export function ExportMenu({ onExportWebGame }: ExportMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>エクスポート</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onExportWebGame}>Webゲーム出力</DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
