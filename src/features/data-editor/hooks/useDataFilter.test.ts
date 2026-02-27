import { renderHook, act } from '@testing-library/react';
import { useDataFilter } from './useDataFilter';
import type { DataEntry } from '@/types/data';

// Import field type registration side effects
import '@/types/fields';

jest.useFakeTimers();

const entries: DataEntry[] = [
  { id: 'hero_1', typeId: 'character', values: { name: 'アレックス', description: '勇者' } },
  { id: 'hero_2', typeId: 'character', values: { name: 'マリア', description: '魔法使い' } },
  { id: 'enemy_1', typeId: 'character', values: { name: 'スライム', description: '弱い敵' } },
];

describe('useDataFilter', () => {
  it('初期状態では全エントリが返る', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    expect(result.current.filteredEntries).toEqual(entries);
    expect(result.current.query).toBe('');
  });

  it('IDでフィルタリングできる', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    act(() => result.current.setQuery('hero'));
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(2);
  });

  it('string値でフィルタリングできる', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    act(() => result.current.setQuery('スライム'));
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]?.id).toBe('enemy_1');
  });

  it('case-insensitiveで検索できる', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    act(() => result.current.setQuery('HERO'));
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(2);
  });

  it('debounceが動作する', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    act(() => result.current.setQuery('hero'));
    // debounce前は全件
    expect(result.current.filteredEntries).toHaveLength(3);
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(2);
  });

  it('空文字列で全件に戻る', () => {
    const { result } = renderHook(() => useDataFilter(entries));
    act(() => result.current.setQuery('hero'));
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(2);
    act(() => result.current.setQuery(''));
    act(() => jest.advanceTimersByTime(300));
    expect(result.current.filteredEntries).toHaveLength(3);
  });
});
