'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageFieldConfigProps {
  initialFolderId?: string;
  onChange: (updates: Record<string, unknown>) => void;
}

export function ImageFieldConfig({ initialFolderId, onChange }: ImageFieldConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">初期表示フォルダID</Label>
      <Input
        className="h-8 text-xs"
        value={initialFolderId ?? ''}
        onChange={(e) => onChange({ initialFolderId: e.target.value || undefined })}
        placeholder="デフォルト（ルート）"
      />
    </div>
  );
}
