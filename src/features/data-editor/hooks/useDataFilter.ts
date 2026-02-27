import { useState, useMemo, useEffect, useRef } from 'react';
import type { DataEntry } from '@/types/data';

const DEBOUNCE_MS = 300;

/**
 * データエントリのフィルタリングフック
 *
 * エントリIDおよび全string型フィールド値に対してcase-insensitiveで検索する。
 * 300ms debounce 付き。
 */
export function useDataFilter(entries: DataEntry[]) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  const filteredEntries = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return entries;

    return entries.filter((entry) => {
      // IDでマッチ
      if (entry.id.toLowerCase().includes(q)) return true;
      // 全string型フィールド値でマッチ
      for (const value of Object.values(entry.values)) {
        if (typeof value === 'string' && value.toLowerCase().includes(q)) {
          return true;
        }
      }
      return false;
    });
  }, [entries, debouncedQuery]);

  return { query, setQuery, filteredEntries };
}
