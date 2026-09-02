'use client';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  AccountMenuProps,
  ExportMenu,
  ExportMenuProps,
  HelpMenuProps,
  ProjectMenu,
  ProjectMenuProps,
  SettingsMenu,
  SettingsMenuProps,
} from './menus';

export interface HamburgerMenuProps {
  project?: ProjectMenuProps;
  export?: ExportMenuProps;
  settings?: SettingsMenuProps;
  // ヘルプ（ドキュメント/バージョン情報）・アカウント（認証、Phase 2）は
  // 未実装のため一旦非表示。実装時に復活させる。
  help?: HelpMenuProps;
  account?: AccountMenuProps;
}

export function HamburgerMenu({ project, export: exportProps }: HamburgerMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="hamburger-trigger">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <ProjectMenu {...project} />
        <DropdownMenuSeparator />
        <ExportMenu {...exportProps} />
        <DropdownMenuSeparator />
        <SettingsMenu />
        {/* <DropdownMenuSeparator />
        <HelpMenu {...help} />
        <DropdownMenuSeparator />
        <AccountMenu {...account} /> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
