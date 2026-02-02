/**
 * useAutoSave フックのテスト
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave, useTempDataRecovery } from './useAutoSave';
import { resetLocalStorage } from '@/lib/storage/localStorage';
import type { ProjectData } from '@/lib/storage/types';

// LocalStorageのモック
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

describe('useAutoSave', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    resetLocalStorage();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('初期状態はidleで未保存変更なし', () => {
    const { result } = renderHook(() => useAutoSave('proj_001', { maps: [] }));

    expect(result.current.status).toBe('idle');
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.lastSavedAt).toBeNull();
  });

  it('データ変更後500msでLocalStorageに保存される', async () => {
    const { result, rerender } = renderHook(({ data }) => useAutoSave('proj_001', data), {
      initialProps: { data: { maps: [] } as Partial<ProjectData> },
    });

    // データを変更
    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    expect(result.current.status).toBe('pending');
    expect(result.current.hasUnsavedChanges).toBe(true);

    // 500ms待機
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('saved');
    });

    expect(mockStorage.setItem).toHaveBeenCalled();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it('saveNowで即座に保存される', () => {
    const { result, rerender } = renderHook(({ data }) => useAutoSave('proj_001', data), {
      initialProps: { data: { maps: [] } as Partial<ProjectData> },
    });

    // データを変更
    rerender({ data: { maps: [], chipsets: [] } as Partial<ProjectData> });

    expect(result.current.status).toBe('pending');

    // 即座に保存
    act(() => {
      result.current.saveNow();
    });

    expect(result.current.status).toBe('saved');
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('clearTempDataで一時データがクリアされる', () => {
    const { result } = renderHook(() => useAutoSave('proj_001', { maps: [] }));

    act(() => {
      result.current.clearTempData();
    });

    expect(mockStorage.removeItem).toHaveBeenCalled();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.status).toBe('idle');
  });

  it('enabled=falseで自動保存が無効になる', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave('proj_001', data, { enabled: false }),
      { initialProps: { data: { maps: [] } as Partial<ProjectData> } }
    );

    // データを変更
    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    // 500ms待機
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // 保存されない
    expect(result.current.status).toBe('idle');
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('projectIdがnullの場合は保存されない', () => {
    const { rerender } = renderHook(({ projectId, data }) => useAutoSave(projectId, data), {
      initialProps: {
        projectId: null as string | null,
        data: { maps: [] } as Partial<ProjectData>,
      },
    });

    rerender({ projectId: null, data: { maps: [], variables: [] } as Partial<ProjectData> });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('カスタムデバウンス時間が適用される', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave('proj_001', data, { debounceMs: 1000 }),
      { initialProps: { data: { maps: [] } as Partial<ProjectData> } }
    );

    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    // 500ms後はまだ保存されない
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.status).toBe('pending');

    // 1000ms後に保存される
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('saved');
    });
  });

  it('onSaveSuccessコールバックが呼ばれる', async () => {
    const onSaveSuccess = jest.fn();
    const { rerender } = renderHook(
      ({ data }) => useAutoSave('proj_001', data, { onSaveSuccess }),
      { initialProps: { data: { maps: [] } as Partial<ProjectData> } }
    );

    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalled();
    });
  });

  it('保存エラー時にonSaveErrorコールバックが呼ばれる', async () => {
    const onSaveError = jest.fn();
    mockStorage.setItem.mockImplementation((key: string) => {
      if (key !== '__storage_test__') {
        throw new Error('Storage error');
      }
    });

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave('proj_001', data, { onSaveError }),
      { initialProps: { data: { maps: [] } as Partial<ProjectData> } }
    );

    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(onSaveError).toHaveBeenCalled();
  });

  it('保存後2秒でステータスがidleに戻る', async () => {
    const { result, rerender } = renderHook(({ data }) => useAutoSave('proj_001', data), {
      initialProps: { data: { maps: [] } as Partial<ProjectData> },
    });

    rerender({ data: { maps: [], variables: [] } as Partial<ProjectData> });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('saved');
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe('idle');
  });
});

describe('useTempDataRecovery', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    resetLocalStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('復旧可能なデータがない場合', () => {
    mockStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTempDataRecovery());

    expect(result.current.hasRecoverableData).toBe(false);
    expect(result.current.timestamp).toBeNull();
    expect(result.current.projectId).toBeNull();
  });

  it('復旧可能なデータがある場合', () => {
    const tempData = {
      timestamp: 1704067200000,
      projectId: 'proj_001',
      data: { maps: [] },
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(tempData));

    const { result } = renderHook(() => useTempDataRecovery());

    expect(result.current.hasRecoverableData).toBe(true);
    expect(result.current.timestamp).toBe(1704067200000);
    expect(result.current.projectId).toBe('proj_001');
  });

  it('recoverでデータを取得できる', () => {
    const tempData = {
      timestamp: 1704067200000,
      projectId: 'proj_001',
      data: { maps: [], variables: [] },
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(tempData));

    const { result } = renderHook(() => useTempDataRecovery());

    const recovered = result.current.recover();

    expect(recovered).toEqual({ maps: [], variables: [] });
  });

  it('discardでデータが削除される', () => {
    const tempData = {
      timestamp: 1704067200000,
      projectId: 'proj_001',
      data: { maps: [] },
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(tempData));

    const { result } = renderHook(() => useTempDataRecovery());

    expect(result.current.hasRecoverableData).toBe(true);

    act(() => {
      result.current.discard();
    });

    expect(mockStorage.removeItem).toHaveBeenCalled();
    expect(result.current.hasRecoverableData).toBe(false);
    expect(result.current.timestamp).toBeNull();
    expect(result.current.projectId).toBeNull();
  });
});
