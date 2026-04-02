'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
      <DialogContent className="max-h-[80vh] max-w-lg">
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
            {/* 選択なし */}
            <button
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => handleSelect('')}
            >
              <span className="text-muted-foreground">（選択なし）</span>
            </button>
            {filtered.length === 0 && search && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                見つかりません
              </div>
            )}
            {filtered.map((s) => {
              const Icon = getScriptIcon(s.icon);
              return (
              <button
                key={s.id}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => handleSelect(s.id)}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.name}</div>
                  {s.description && (
                    <div className="truncate text-xs text-muted-foreground">{s.description}</div>
                  )}
                </div>
                {s.callId && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {s.callId}
                  </span>
                )}
              </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
