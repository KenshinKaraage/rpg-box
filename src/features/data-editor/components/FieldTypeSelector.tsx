'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/common/Modal';
import { getFieldTypeOptions } from '@/types/fields';

// =============================================================================
// 型定義
// =============================================================================

interface FieldTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
}

interface Category {
  label: string;
  types: string[];
}

// =============================================================================
// カテゴリ定義（UI表示のみ、レジストリに変更なし）
// =============================================================================

const CATEGORIES: Category[] = [
  { label: '基本', types: ['number', 'string', 'textarea', 'boolean', 'select', 'color'] },
  { label: '参照', types: ['dataSelect', 'dataList', 'dataTable', 'class', 'classList'] },
  { label: 'メディア', types: ['image', 'audio'] },
];

// =============================================================================
// FieldTypeSelector コンポーネント
// =============================================================================

export function FieldTypeSelector({ open, onOpenChange, onSelect }: FieldTypeSelectorProps) {
  const [query, setQuery] = useState('');

  const allOptions = useMemo(() => getFieldTypeOptions(), []);
  const optionMap = useMemo(() => new Map(allOptions.map((o) => [o.type, o.label])), [allOptions]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      types: cat.types.filter((type) => {
        const label = optionMap.get(type);
        if (!label) return false;
        if (!q) return true;
        return label.toLowerCase().includes(q) || type.toLowerCase().includes(q);
      }),
    })).filter((cat) => cat.types.length > 0);
  }, [query, optionMap]);

  const handleSelect = (type: string) => {
    onSelect(type);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery('');
      }}
      title="フィールドタイプを選択"
      size="md"
    >
      <div className="space-y-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            一致するタイプがありません
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.label}>
              <Label className="mb-2 block text-xs text-muted-foreground">{cat.label}</Label>
              <div className="grid grid-cols-3 gap-2">
                {cat.types.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSelect(type)}
                  >
                    {optionMap.get(type)}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
