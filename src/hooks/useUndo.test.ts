/**
 * useUndo フックのテスト
 */
import { renderHook, act } from '@testing-library/react';
import { useUndo, useUndoWithKey } from './useUndo';

describe('useUndo', () => {
  describe('初期状態', () => {
    it('初期状態はundefinedでUndo/Redoは不可', () => {
      const { result } = renderHook(() => useUndo<number>());

      expect(result.current.state).toBeUndefined();
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });

    it('initialStateを指定できる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      expect(result.current.state).toBe(0);
    });
  });

  describe('pushState', () => {
    it('新しい状態をプッシュできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
      });

      expect(result.current.state).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoCount).toBe(1);
    });

    it('複数の状態をプッシュできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
        result.current.pushState(3);
      });

      expect(result.current.state).toBe(3);
      expect(result.current.undoCount).toBe(3);
    });

    it('maxHistorySizeを超えると古い履歴が削除される', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0, maxHistorySize: 3 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
        result.current.pushState(3);
        result.current.pushState(4);
        result.current.pushState(5);
      });

      expect(result.current.undoCount).toBe(3);

      // 3回undoすると最初に戻れるのは2まで（0と1は削除されている）
      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.state).toBe(2);
      expect(result.current.canUndo).toBe(false);
    });

    it('onChangeコールバックが呼ばれる', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useUndo<number>({ initialState: 0, onChange }));

      act(() => {
        result.current.pushState(1);
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('undo', () => {
    it('直前の状態に戻れる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
      });

      let undoneState: number | undefined;
      act(() => {
        undoneState = result.current.undo();
      });

      expect(result.current.state).toBe(0);
      expect(undoneState).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('複数回undoできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
        result.current.pushState(3);
      });

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(2);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(1);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });

    it('履歴がない場合はundefinedを返す', () => {
      const { result } = renderHook(() => useUndo<number>());

      let undoneState: number | undefined;
      act(() => {
        undoneState = result.current.undo();
      });

      expect(undoneState).toBeUndefined();
    });
  });

  describe('redo', () => {
    it('undoした操作をredoできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.undo();
      });

      let redoneState: number | undefined;
      act(() => {
        redoneState = result.current.redo();
      });

      expect(result.current.state).toBe(1);
      expect(redoneState).toBe(1);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });

    it('複数回redoできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.state).toBe(0);
      expect(result.current.redoCount).toBe(2);

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe(1);

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe(2);
    });

    it('新しい操作でredo履歴がクリアされる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.pushState(3);
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.state).toBe(3);
    });

    it('履歴がない場合はundefinedを返す', () => {
      const { result } = renderHook(() => useUndo<number>());

      let redoneState: number | undefined;
      act(() => {
        redoneState = result.current.redo();
      });

      expect(redoneState).toBeUndefined();
    });
  });

  describe('clearHistory', () => {
    it('履歴をクリアできる（現在の状態は保持）', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.state).toBe(2);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('reset', () => {
    it('初期状態にリセットできる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
        result.current.pushState(2);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('新しい初期状態を指定できる', () => {
      const { result } = renderHook(() => useUndo<number>({ initialState: 0 }));

      act(() => {
        result.current.pushState(1);
      });

      act(() => {
        result.current.reset(100);
      });

      expect(result.current.state).toBe(100);
    });
  });
});

describe('useUndoWithKey', () => {
  describe('キー単位の履歴管理', () => {
    it('異なるキーで別々の履歴を管理できる', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page1', 2);
        result.current.pushState('page2', 100);
      });

      expect(result.current.getState('page1')).toBe(2);
      expect(result.current.getState('page2')).toBe(100);
      expect(result.current.canUndo('page1')).toBe(true);
      expect(result.current.canUndo('page2')).toBe(false); // page2は1回しかpushしてない
    });

    it('キー単位でundoできる', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page1', 2);
        result.current.pushState('page2', 100);
        result.current.pushState('page2', 200);
      });

      act(() => {
        result.current.undo('page1');
      });

      expect(result.current.getState('page1')).toBe(1);
      expect(result.current.getState('page2')).toBe(200); // page2は影響なし
    });

    it('キー単位でredoできる', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page1', 2);
        result.current.undo('page1');
      });

      act(() => {
        result.current.redo('page1');
      });

      expect(result.current.getState('page1')).toBe(2);
    });

    it('キー単位で履歴をクリアできる', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page1', 2);
        result.current.pushState('page2', 100);
      });

      act(() => {
        result.current.clearHistory('page1');
      });

      expect(result.current.canUndo('page1')).toBe(false);
      expect(result.current.canUndo('page2')).toBe(false); // page2も元々undoできない
      expect(result.current.getState('page1')).toBe(2); // 現在の状態は保持
    });

    it('全履歴をクリアできる', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page2', 100);
      });

      act(() => {
        result.current.clearAllHistory();
      });

      expect(result.current.getState('page1')).toBeUndefined();
      expect(result.current.getState('page2')).toBeUndefined();
    });

    it('存在しないキーはundefinedを返す', () => {
      const { result } = renderHook(() => useUndoWithKey<number>());

      expect(result.current.getState('nonexistent')).toBeUndefined();
      expect(result.current.canUndo('nonexistent')).toBe(false);
      expect(result.current.canRedo('nonexistent')).toBe(false);
    });

    it('maxHistorySizeが適用される', () => {
      const { result } = renderHook(() => useUndoWithKey<number>(3));

      act(() => {
        result.current.pushState('page1', 1);
        result.current.pushState('page1', 2);
        result.current.pushState('page1', 3);
        result.current.pushState('page1', 4);
        result.current.pushState('page1', 5);
      });

      // 5回pushしたが、履歴は3つまで
      act(() => {
        result.current.undo('page1');
        result.current.undo('page1');
        result.current.undo('page1');
      });

      expect(result.current.getState('page1')).toBe(2);
      expect(result.current.canUndo('page1')).toBe(false);
    });
  });
});
