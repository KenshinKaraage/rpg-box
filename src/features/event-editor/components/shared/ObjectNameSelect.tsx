'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapObjects } from '../../hooks/useMapObjects';

interface ObjectNameSelectProps {
  value: string;
  onValueChange: (name: string) => void;
  className?: string;
}

export function ObjectNameSelect({ value, onValueChange, className }: ObjectNameSelectProps) {
  const objects = useMapObjects();

  return objects.length > 0 ? (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}
    >
      <SelectTrigger className={className ?? 'h-7 flex-1 text-xs'}>
        <SelectValue placeholder="オブジェクト..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">(選択なし)</SelectItem>
        <SelectItem value="self">self (自分)</SelectItem>
        {objects.map((o) => (
          <SelectItem key={o.name} value={o.name}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}
    >
      <SelectTrigger className={className ?? 'h-7 flex-1 text-xs'}>
        <SelectValue placeholder="オブジェクト..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">(オブジェクトなし)</SelectItem>
        <SelectItem value="self">self (自分)</SelectItem>
      </SelectContent>
    </Select>
  );
}
