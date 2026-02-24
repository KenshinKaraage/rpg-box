/**
 * scriptSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

describe('scriptSlice', () => {
  beforeEach(() => {
    act(() => {
      const state = useStore.getState();
      state.scripts.forEach((s) => state.deleteScript(s.id));
    });
  });

  describe('初期状態', () => {
    it('scripts は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.scripts));
      expect(result.current).toEqual([]);
    });

    it('selectedScriptId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedScriptId));
      expect(result.current).toBeNull();
    });
  });

  describe('addScript', () => {
    it('スクリプトを追加できる', () => {
      const { result } = renderHook(() => useStore());
      const script = createScript('script_001', 'テストスクリプト', 'event');

      act(() => {
        result.current.addScript(script);
      });

      expect(result.current.scripts).toHaveLength(1);
      expect(result.current.scripts[0]).toEqual(script);
    });

    it('複数のスクリプトを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト1', 'event'));
        result.current.addScript(createScript('s2', 'スクリプト2', 'component'));
      });

      expect(result.current.scripts).toHaveLength(2);
    });
  });

  describe('updateScript', () => {
    it('スクリプトを更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', '元の名前', 'event'));
      });

      act(() => {
        result.current.updateScript('s1', { name: '新しい名前' });
      });

      expect(result.current.scripts[0]?.name).toBe('新しい名前');
    });

    it('content を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト', 'event'));
      });

      act(() => {
        result.current.updateScript('s1', { content: 'console.log("hello")' });
      });

      expect(result.current.scripts[0]?.content).toBe('console.log("hello")');
    });

    it('存在しないIDの場合は何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', '変数', 'event'));
      });

      act(() => {
        result.current.updateScript('non_existent', { name: '新しい名前' });
      });

      expect(result.current.scripts[0]?.name).toBe('変数');
    });

    it('IDを変更すると selectedScriptId も更新される', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト', 'event'));
        result.current.selectScript('s1');
      });

      act(() => {
        result.current.updateScript('s1', { id: 's1_renamed' });
      });

      expect(result.current.selectedScriptId).toBe('s1_renamed');
    });
  });

  describe('deleteScript', () => {
    it('スクリプトを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト', 'event'));
      });

      act(() => {
        result.current.deleteScript('s1');
      });

      expect(result.current.scripts).toHaveLength(0);
    });

    it('選択中のスクリプトを削除すると selectedScriptId が null になる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト', 'event'));
        result.current.selectScript('s1');
      });

      act(() => {
        result.current.deleteScript('s1');
      });

      expect(result.current.selectedScriptId).toBeNull();
    });

    it('ネストされた内部スクリプトも再帰的に削除される', () => {
      const { result } = renderHook(() => useStore());

      const parent = createScript('parent', '親スクリプト', 'event');
      const child: Script = {
        ...createScript('child1', '子スクリプト', 'internal'),
        parentId: 'parent',
      };
      const grandchild: Script = {
        ...createScript('grandchild1', '孫スクリプト', 'internal'),
        parentId: 'child1',
      };
      const otherScript = createScript('other', '別スクリプト', 'event');

      act(() => {
        result.current.addScript(parent);
        result.current.addScript(child);
        result.current.addScript(grandchild);
        result.current.addScript(otherScript);
      });

      expect(result.current.scripts).toHaveLength(4);

      act(() => {
        result.current.deleteScript('parent');
      });

      expect(result.current.scripts).toHaveLength(1);
      expect(result.current.scripts[0]?.id).toBe('other');
    });

    it('中間の内部スクリプトを削除するとその子孫も削除される', () => {
      const { result } = renderHook(() => useStore());

      const parent = createScript('parent', '親スクリプト', 'event');
      const child: Script = {
        ...createScript('child1', '子スクリプト', 'internal'),
        parentId: 'parent',
      };
      const grandchild: Script = {
        ...createScript('grandchild1', '孫スクリプト', 'internal'),
        parentId: 'child1',
      };

      act(() => {
        result.current.addScript(parent);
        result.current.addScript(child);
        result.current.addScript(grandchild);
      });

      act(() => {
        result.current.deleteScript('child1');
      });

      // parent remains, child1 and grandchild1 deleted
      expect(result.current.scripts).toHaveLength(1);
      expect(result.current.scripts[0]?.id).toBe('parent');
    });

    it('内部スクリプトも連鎖削除される', () => {
      const { result } = renderHook(() => useStore());

      const parent = createScript('parent', '親スクリプト', 'event');
      const internal: Script = {
        ...createScript('internal1', '内部1', 'internal'),
        parentId: 'parent',
      };
      const internal2: Script = {
        ...createScript('internal2', '内部2', 'internal'),
        parentId: 'parent',
      };
      const otherScript = createScript('other', '別スクリプト', 'event');

      act(() => {
        result.current.addScript(parent);
        result.current.addScript(internal);
        result.current.addScript(internal2);
        result.current.addScript(otherScript);
      });

      expect(result.current.scripts).toHaveLength(4);

      act(() => {
        result.current.deleteScript('parent');
      });

      expect(result.current.scripts).toHaveLength(1);
      expect(result.current.scripts[0]?.id).toBe('other');
    });
  });

  describe('selectScript', () => {
    it('スクリプトを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'スクリプト', 'event'));
        result.current.selectScript('s1');
      });

      expect(result.current.selectedScriptId).toBe('s1');
    });

    it('null を渡すと選択解除', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectScript('s1');
      });

      act(() => {
        result.current.selectScript(null);
      });

      expect(result.current.selectedScriptId).toBeNull();
    });
  });

  describe('getScriptById', () => {
    it('IDでスクリプトを取得できる', () => {
      const { result } = renderHook(() => useStore());
      const script = createScript('s1', 'スクリプト', 'event');

      act(() => {
        result.current.addScript(script);
      });

      expect(result.current.getScriptById('s1')).toEqual(script);
    });

    it('存在しない場合は undefined', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.getScriptById('non_existent')).toBeUndefined();
    });
  });

  describe('getScriptsByType', () => {
    it('タイプでフィルタされたトップレベルスクリプトを返す', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('s1', 'イベント1', 'event'));
        result.current.addScript(createScript('s2', 'コンポーネント1', 'component'));
        result.current.addScript(createScript('s3', 'イベント2', 'event'));
      });

      const events = result.current.getScriptsByType('event');
      expect(events).toHaveLength(2);
      expect(events.map((s) => s.id)).toEqual(['s1', 's3']);
    });

    it('内部スクリプトは含まない', () => {
      const { result } = renderHook(() => useStore());

      const internal: Script = {
        ...createScript('internal', '内部', 'internal'),
        parentId: 's1',
      };

      act(() => {
        result.current.addScript(createScript('s1', 'イベント', 'event'));
        result.current.addScript(internal);
      });

      const events = result.current.getScriptsByType('event');
      expect(events).toHaveLength(1);

      const internals = result.current.getScriptsByType('internal');
      expect(internals).toHaveLength(0);
    });
  });

  it('component スクリプトは fields を持つ', () => {
    const script = createScript('comp_001', 'Transform', 'component');
    expect(script.fields).toEqual([]);
  });

  describe('getInternalScripts', () => {
    it('親スクリプトの内部スクリプトを返す', () => {
      const { result } = renderHook(() => useStore());

      const internal1: Script = {
        ...createScript('i1', '内部1', 'internal'),
        parentId: 'parent',
      };
      const internal2: Script = {
        ...createScript('i2', '内部2', 'internal'),
        parentId: 'parent',
      };
      const otherInternal: Script = {
        ...createScript('i3', '別の内部', 'internal'),
        parentId: 'other_parent',
      };

      act(() => {
        result.current.addScript(createScript('parent', '親', 'event'));
        result.current.addScript(internal1);
        result.current.addScript(internal2);
        result.current.addScript(otherInternal);
      });

      const internals = result.current.getInternalScripts('parent');
      expect(internals).toHaveLength(2);
      expect(internals.map((s) => s.id)).toEqual(['i1', 'i2']);
    });

    it('内部スクリプトがない場合は空配列', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addScript(createScript('parent', '親', 'event'));
      });

      expect(result.current.getInternalScripts('parent')).toEqual([]);
    });
  });
});
