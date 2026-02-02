'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface HelpMenuProps {
  onOpenDocs?: () => void;
  onShowVersion?: () => void;
}

export function HelpMenu({ onOpenDocs, onShowVersion }: HelpMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>ヘルプ</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onOpenDocs}>ドキュメント</DropdownMenuItem>
      <DropdownMenuItem onSelect={onShowVersion}>バージョン情報</DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
