'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface ExportMenuProps {
  onExportProject?: () => void;
  onImportProject?: () => void;
  onExportWebGame?: () => void;
}

export function ExportMenu({
  onExportProject,
  onImportProject,
  onExportWebGame,
}: ExportMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>エクスポート / インポート</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onExportProject}>プロジェクトをエクスポート</DropdownMenuItem>
      <DropdownMenuItem onSelect={onImportProject}>プロジェクトをインポート</DropdownMenuItem>
      <DropdownMenuItem onSelect={onExportWebGame}>Webゲーム出力</DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
