'use client';

import { Folder } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { AssetFolder } from '@/types/asset';

interface FolderSelectProps {
  value?: string;
  onChange: (folderId: string | undefined) => void;
}

/** ルートを表す特殊値（Select は空文字を value に取れないため） */
const ROOT_VALUE = '__root__';

/**
 * ツリー状のフォルダ一覧を構築（再帰）
 */
function buildFolderOptions(
  folders: AssetFolder[],
  parentId: string | undefined,
  depth: number
): { id: string; name: string; depth: number }[] {
  const children = folders.filter((f) => f.parentId === parentId);
  const result: { id: string; name: string; depth: number }[] = [];
  for (const child of children) {
    result.push({ id: child.id, name: child.name, depth });
    result.push(...buildFolderOptions(folders, child.id, depth + 1));
  }
  return result;
}

/**
 * フォルダ選択ドロップダウン（ツリー表示）
 */
export function FolderSelect({ value, onChange }: FolderSelectProps) {
  const assetFolders = useStore((state) => state.assetFolders);
  const options = buildFolderOptions(assetFolders, undefined, 0);

  return (
    <Select
      value={value ?? ROOT_VALUE}
      onValueChange={(v) => onChange(v === ROOT_VALUE ? undefined : v)}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ROOT_VALUE}>
          <span className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-muted-foreground" />
            ルート
          </span>
        </SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            <span
              className="flex items-center gap-1"
              style={{ paddingLeft: `${opt.depth * 12}px` }}
            >
              <Folder className="h-3 w-3 text-muted-foreground" />
              {opt.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
