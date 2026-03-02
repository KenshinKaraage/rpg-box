'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/common/Modal';
import { getActionBlocksByCategory } from '../registry/actionBlockRegistry';

// =============================================================================
// 型定義
// =============================================================================

interface ActionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
}

// =============================================================================
// カテゴリ定義（UI表示順序と日本語ラベル）
// =============================================================================

const CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: 'ui', label: 'UI操作' },
  { key: 'logic', label: 'ロジック' },
  { key: 'basic', label: '基礎' },
  { key: 'script', label: 'スクリプト' },
  { key: 'template', label: 'テンプレート' },
];

// =============================================================================
// ActionSelector コンポーネント
// =============================================================================

export function ActionSelector({ open, onOpenChange, onSelect }: ActionSelectorProps) {
  const [query, setQuery] = useState('');

  const blocksByCategory = useMemo(() => getActionBlocksByCategory(), []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((cat) => {
      const blocks = blocksByCategory[cat.key] ?? [];
      return {
        ...cat,
        blocks: blocks.filter((block) => {
          if (!q) return true;
          return block.label.toLowerCase().includes(q) || block.type.toLowerCase().includes(q);
        }),
      };
    }).filter((cat) => cat.blocks.length > 0);
  }, [query, blocksByCategory]);

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
      title="アクションを追加"
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
            一致するアクションがありません
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.key}>
              <Label className="mb-2 block text-xs text-muted-foreground">{cat.label}</Label>
              <div className="grid grid-cols-3 gap-2">
                {cat.blocks.map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSelect(block.type)}
                  >
                    {block.label}
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
