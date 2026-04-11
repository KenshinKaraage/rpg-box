'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import { useObjectVariables } from '../../hooks/useMapObjects';

interface ObjectVariableSelectProps {
  objectName: string;
  value: string;
  onValueChange: (name: string) => void;
  className?: string;
  /** Filter by fieldType (e.g. 'number', 'string', 'class') */
  filterType?: string;
  /** Filter by classId (only when filterType === 'class') */
  filterClassId?: string;
}

export function ObjectVariableSelect({
  objectName,
  value,
  onValueChange,
  className,
  filterType,
  filterClassId,
}: ObjectVariableSelectProps) {
  const allVars = useObjectVariables(objectName);
  const classes = useStore((s) => s.classes);

  const objVars = useMemo(() => {
    if (!filterType) return allVars;
    return allVars.filter((v) => {
      if (v.fieldType !== filterType) return false;
      if (filterType === 'class' && filterClassId && v.classId) {
        return v.classId === filterClassId;
      }
      return true;
    });
  }, [allVars, filterType, filterClassId]);

  const formatType = (fieldType: string, classId?: string): string => {
    if (fieldType === 'class' && classId) {
      const cls = classes.find((c) => c.id === classId);
      return cls ? `class(${cls.name})` : `class(${classId})`;
    }
    return fieldType;
  };

  if (!objectName) {
    return (
      <Select disabled>
        <SelectTrigger className={className ?? 'h-7 flex-1 text-xs'}>
          <SelectValue placeholder="OBJ未選択" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  }

  if (objVars.length === 0) {
    const reason = allVars.length > 0 && filterType ? '一致する型の変数なし' : '変数なし';
    return (
      <Select disabled>
        <SelectTrigger className={className ?? 'h-7 flex-1 text-xs'}>
          <SelectValue placeholder={reason} />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  }

  return (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}
    >
      <SelectTrigger className={className ?? 'h-7 flex-1 text-xs'}>
        <SelectValue placeholder="変数を選択..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">(選択なし)</SelectItem>
        {objVars.map((v) => (
          <SelectItem key={v.name} value={v.name}>
            <span className="mr-1 text-[9px] text-muted-foreground">
              {formatType(v.fieldType, v.classId)}
            </span>
            {v.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
