'use client';

import { Label } from '@/components/ui/label';
import { FolderSelect } from './FolderSelect';

interface AudioFieldConfigProps {
  initialFolderId?: string;
  onChange: (updates: Record<string, unknown>) => void;
}

export function AudioFieldConfig({ initialFolderId, onChange }: AudioFieldConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">初期表示フォルダ</Label>
      <FolderSelect
        value={initialFolderId}
        onChange={(folderId) => onChange({ initialFolderId: folderId })}
      />
    </div>
  );
}
