'use client';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItemConfig {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface MenuGroupConfig {
  label: string;
  items: MenuItemConfig[];
}

const menuGroups: MenuGroupConfig[] = [
  {
    label: 'プロジェクト',
    items: [
      { label: '新規作成', onClick: () => console.log('新規作成') },
      { label: '開く', onClick: () => console.log('開く') },
      { label: '保存', shortcut: 'Ctrl+S', onClick: () => console.log('保存') },
      { label: '名前を付けて保存', onClick: () => console.log('名前を付けて保存') },
      { label: '一時データをクリア', onClick: () => console.log('一時データをクリア') },
    ],
  },
  {
    label: 'エクスポート',
    items: [{ label: 'Webゲーム出力', onClick: () => console.log('Webゲーム出力') }],
  },
  {
    label: '設定',
    items: [
      { label: 'エディタ設定', onClick: () => console.log('エディタ設定') },
      {
        label: 'ショートカット一覧',
        shortcut: '?',
        onClick: () => console.log('ショートカット一覧'),
      },
    ],
  },
  {
    label: 'ヘルプ',
    items: [
      { label: 'ドキュメント', onClick: () => console.log('ドキュメント') },
      { label: 'バージョン情報', onClick: () => console.log('バージョン情報') },
    ],
  },
  {
    label: 'アカウント',
    items: [
      { label: 'ログイン', onClick: () => console.log('ログイン') },
      { label: 'プロフィール', onClick: () => console.log('プロフィール'), disabled: true },
    ],
  },
];

export function HamburgerMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="hamburger-trigger">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem key={item.label} onClick={item.onClick} disabled={item.disabled}>
                  {item.label}
                  {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
