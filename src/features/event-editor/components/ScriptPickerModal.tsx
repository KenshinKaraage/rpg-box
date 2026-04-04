'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getScriptIcon } from '@/features/script-editor/components/IconPicker';
import type { Script } from '@/types/script';

interface ScriptPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: Script[];
  onSelect: (scriptId: string) => void;
}

export function ScriptPickerModal({
  open,
  onOpenChange,
  scripts,
  onSelect,
}: ScriptPickerModalProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? scripts.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.callId ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (s.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : scripts;

  const handleSelect = (scriptId: string) => {
    onSelect(scriptId);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-modal-lg">
        <DialogHeader>
          <DialogTitle>スクリプトを選択</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[50vh] overflow-auto">
            {filtered.length === 0 && search && (
              <div className="p-4 text-center text-sm text-muted-foreground">見つかりません</div>
            )}
            <div className="grid grid-cols-5 gap-2 p-1">
              {/* 選択なし */}
              <button
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-foreground/50 hover:bg-accent"
                onClick={() => handleSelect('')}
              >
                <span className="text-xs">なし</span>
              </button>
              {filtered.map((s) => {
                const Icon = getScriptIcon(s.icon);
                return (
                  <button
                    key={s.id}
                    className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border transition-colors hover:bg-accent"
                    style={s.color ? { borderColor: s.color + '40' } : undefined}
                    onClick={() => handleSelect(s.id)}
                    title={[s.name, s.callId && `(${s.callId})`, s.description]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Icon
                      className="h-6 w-6 shrink-0"
                      style={s.color ? { color: s.color } : undefined}
                    />
                    <span
                      className="w-full truncate px-1 text-center text-[11px] font-medium leading-tight"
                      style={s.color ? { color: s.color } : undefined}
                    >
                      {s.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
