'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface ProjectMenuProps {
  // 複数プロジェクト管理（T248）が未実装のため一旦非表示。実装時に復活させる。
  onNewProject?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onClearTempData?: () => void;
  onLoadTestData?: () => void;
}

export function ProjectMenu({ onClearTempData, onLoadTestData }: ProjectMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>プロジェクト</DropdownMenuLabel>
      {/* 複数プロジェクト管理（T248）が未実装のため一旦非表示 */}
      {/* <DropdownMenuItem onSelect={onNewProject}>新規作成</DropdownMenuItem>
      <DropdownMenuItem onSelect={onOpen}>開く</DropdownMenuItem>
      <DropdownMenuItem onSelect={onSave}>
        保存
        <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onSaveAs}>名前を付けて保存</DropdownMenuItem> */}
      <DropdownMenuItem onSelect={onClearTempData}>一時データをクリア</DropdownMenuItem>
      <DropdownMenuItem onSelect={onLoadTestData}>テストデータ読み込み</DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
