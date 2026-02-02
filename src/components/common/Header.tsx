'use client';

import { Menu, Play } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'データ',
    items: [
      { href: '/data', label: 'データ設定' },
      { href: '/data/fieldsets', label: 'フィールドセット' },
      { href: '/data/variables', label: '変数' },
      { href: '/data/classes', label: 'クラス' },
    ],
  },
  {
    label: 'マップ',
    items: [
      { href: '/map', label: 'マップ編集' },
      { href: '/map/data', label: 'マップデータ' },
      { href: '/map/prefabs', label: 'オブジェクトプレハブ' },
      { href: '/map/events', label: 'イベントテンプレート' },
    ],
  },
  {
    label: 'スクリプト',
    items: [
      { href: '/script/events', label: 'イベントスクリプト' },
      { href: '/script/components', label: 'コンポーネントスクリプト' },
    ],
  },
  {
    label: 'UI',
    items: [
      { href: '/ui/screens', label: '画面設計' },
      { href: '/ui/objects', label: 'オブジェクトUI設計' },
      { href: '/ui/timeline', label: 'タイムライン' },
      { href: '/ui/shaders', label: 'シェーダー' },
    ],
  },
  {
    label: 'ゲーム設定',
    items: [
      { href: '/settings', label: 'ゲーム情報' },
      { href: '/settings/images', label: '画像アセット' },
      { href: '/settings/audio', label: '音声アセット' },
      { href: '/settings/fonts', label: 'フォントアセット' },
    ],
  },
];

export function Header() {
  const pathname = usePathname();

  const isActiveMenu = (items: { href: string }[]) => {
    return items.some((item) => pathname.startsWith(item.href));
  };

  return (
    <header className="flex h-12 items-center border-b bg-background px-4">
      {/* Hamburger menu placeholder */}
      <Button variant="ghost" size="icon" className="mr-2">
        <Menu className="h-5 w-5" />
        <span className="sr-only">メニュー</span>
      </Button>

      {/* Logo */}
      <Link href="/" className="mr-6 flex items-center gap-2 font-semibold">
        <span className="text-primary">◇</span>
        <span>RPG Box</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {navigationItems.map((menu) => (
          <div key={menu.label} className="relative group">
            <button
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActiveMenu(menu.items) && 'bg-accent text-accent-foreground'
              )}
            >
              {menu.label}
              <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div className="absolute left-0 top-full hidden pt-1 group-hover:block">
              <ul className="w-48 rounded-md border bg-popover p-2 shadow-md">
                {menu.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                        pathname === item.href && 'bg-accent text-accent-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Test play button */}
      <Button size="sm" className="gap-1">
        <Play className="h-4 w-4" />
        <span>テストプレイ</span>
      </Button>
    </header>
  );
}
