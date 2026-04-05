'use client';

import Link from 'next/link';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

export interface SettingsMenuProps {
  onEditorSettings?: () => void;
  onShowShortcuts?: () => void;
}

export function SettingsMenu({ onEditorSettings, onShowShortcuts }: SettingsMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>設定</DropdownMenuLabel>
      <DropdownMenuItem asChild>
        <Link href="/settings/info">ゲーム情報</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/settings/assets">アセット管理</Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onEditorSettings}>エディタ設定</DropdownMenuItem>
      <DropdownMenuItem onSelect={onShowShortcuts}>
        ショートカット一覧
        <DropdownMenuShortcut>?</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
