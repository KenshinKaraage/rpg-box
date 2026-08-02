'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface ExportMenuProps {
  onExportProject?: () => void;
  onImportProject?: () => void;
  // Webゲーム出力（T230）が未実装のため一旦非表示。実装時に復活させる。
  onExportWebGame?: () => void;
}

export function ExportMenu({ onExportProject, onImportProject }: ExportMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>エクスポート / インポート</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onExportProject}>プロジェクトをエクスポート</DropdownMenuItem>
      <DropdownMenuItem onSelect={onImportProject}>プロジェクトをインポート</DropdownMenuItem>
      {/* <DropdownMenuItem onSelect={onExportWebGame}>Webゲーム出力</DropdownMenuItem> */}
    </DropdownMenuGroup>
  );
}
