'use client';

import Link from 'next/link';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface SettingsMenuProps {
  // エディタ設定・ShortcutHelpModal（T026b）が未実装のため一旦非表示。実装時に復活させる。
  onEditorSettings?: () => void;
  onShowShortcuts?: () => void;
}

export function SettingsMenu() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>設定</DropdownMenuLabel>
      <DropdownMenuItem asChild>
        <Link href="/settings/info">ゲーム情報</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/settings/assets">アセット管理</Link>
      </DropdownMenuItem>
      {/* <DropdownMenuItem onSelect={onEditorSettings}>エディタ設定</DropdownMenuItem>
      <DropdownMenuItem onSelect={onShowShortcuts}>
        ショートカット一覧
        <DropdownMenuShortcut>?</DropdownMenuShortcut>
      </DropdownMenuItem> */}
    </DropdownMenuGroup>
  );
}
