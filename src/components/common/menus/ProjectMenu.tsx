'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

export interface ProjectMenuProps {
  onNewProject?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onClearTempData?: () => void;
  onLoadTestData?: () => void;
}

export function ProjectMenu({
  onNewProject,
  onOpen,
  onSave,
  onSaveAs,
  onClearTempData,
  onLoadTestData,
}: ProjectMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>プロジェクト</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onNewProject}>新規作成</DropdownMenuItem>
      <DropdownMenuItem onSelect={onOpen}>開く</DropdownMenuItem>
      <DropdownMenuItem onSelect={onSave}>
        保存
        <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onSaveAs}>名前を付けて保存</DropdownMenuItem>
      <DropdownMenuItem onSelect={onClearTempData}>一時データをクリア</DropdownMenuItem>
      <DropdownMenuItem onSelect={onLoadTestData}>テストデータ読み込み</DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
