'use client';

import { Play } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { HamburgerMenu } from '@/components/common/HamburgerMenu';
import { loadDefaultTestData } from '@/lib/defaultTestData';
import { SaveIndicator } from '@/components/common/SaveIndicator';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { TestPlayOverlay, useTestPlay } from '@/features/test-play';
import { buildProjectData } from '@/features/test-play/buildProjectData';
import { useStorage } from '@/hooks/useStorage';
import { useStore } from '@/stores';

const navigationItems = [
  {
    label: 'データ',
    items: [
      { href: '/data', label: 'データ設定' },
      { href: '/data/classes', label: 'クラス' },
      { href: '/data/variables', label: '変数' },
    ],
  },
  {
    label: 'マップ',
    items: [
      { href: '/map', label: 'マップ編集' },
      { href: '/map/data', label: 'マップデータ' },
      { href: '/map/prefabs', label: 'オブジェクトプレハブ' },
      { href: '/event/templates', label: 'イベントテンプレート' },
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
      { href: '/settings/info', label: 'ゲーム情報' },
      { href: '/settings/assets', label: 'アセット管理' },
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const { isPlaying, projectData, startTestPlay, stopTestPlay } = useTestPlay();
  const { exportProject, importProject } = useStorage();
  const loadProjectData = useStore((s) => s.loadProjectData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isActiveMenu = (items: { href: string }[]) => {
    return items.some((item) => pathname.startsWith(item.href));
  };

  // Export: build ProjectData from store → download as JSON
  const handleExport = useCallback(async () => {
    const data = buildProjectData();
    const savedProject = {
      id: 'exported',
      name: data.gameSettings.title || 'RPG Project',
      createdAt: new Date(),
      updatedAt: new Date(),
      data,
    };
    await exportProject(savedProject);
  }, [exportProject]);

  // Import: file picker → parse JSON → load into store
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const project = await importProject(file);
      if (project) {
        loadProjectData(project.data);
      } else {
        console.error('[Import] Invalid project file');
      }

      // Reset input so the same file can be re-imported
      e.target.value = '';
    },
    [importProject, loadProjectData]
  );

  return (
    <header className="flex h-12 items-center border-b bg-card px-4 shadow-sm">
      {/* Hamburger menu */}
      <div className="mr-2">
        <HamburgerMenu
          project={{
            onLoadTestData: loadDefaultTestData,
          }}
          export={{
            onExportProject: handleExport,
            onImportProject: handleImportClick,
          }}
        />
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Logo */}
      <Link href="/" className="mr-6 flex items-center gap-2 font-bold">
        <img src="/favicon.png" alt="RPG Box" className="h-6 w-6" />
        <span>RPG Box</span>
      </Link>

      {/* Navigation */}
      <NavigationMenu>
        <NavigationMenuList>
          {navigationItems.map((menu) => (
            <NavigationMenuItem key={menu.label}>
              <NavigationMenuTrigger
                className={cn(isActiveMenu(menu.items) && 'bg-accent text-accent-foreground')}
              >
                {menu.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-60 list-none p-2">
                  {menu.items.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'block whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href && 'bg-accent text-accent-foreground'
                          )}
                        >
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save indicator */}
      <SaveIndicator className="mr-4" />

      {/* Test play button */}
      <Button size="sm" className="gap-1" onClick={startTestPlay}>
        <Play className="h-4 w-4" />
        <span>テストプレイ</span>
      </Button>

      {/* Test play overlay */}
      {isPlaying && projectData && (
        <TestPlayOverlay projectData={projectData} onClose={stopTestPlay} />
      )}
    </header>
  );
}
