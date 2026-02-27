/**
 * eventSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import { createEventTemplate } from '@/types/event';
import type { EventAction } from '@/engine/actions/EventAction';

describe('eventSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      const state = useStore.getState();
      state.eventTemplates.forEach((t) => state.deleteTemplate(t.id));
      state.selectTemplate(null);
    });
  });

  describe('初期状態', () => {
    it('eventTemplates は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.eventTemplates));
      expect(result.current).toEqual([]);
    });

    it('selectedTemplateId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedTemplateId));
      expect(result.current).toBeNull();
    });
  });

  describe('addTemplate', () => {
    it('テンプレートを追加できる', () => {
      const { result } = renderHook(() => useStore());

      const template = createEventTemplate('template_001', 'テストテンプレート');

      act(() => {
        result.current.addTemplate(template);
      });

      expect(result.current.eventTemplates).toHaveLength(1);
      expect(result.current.eventTemplates[0]).toEqual(template);
    });
  });

  describe('updateTemplate', () => {
    it('テンプレート名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', '元の名前'));
      });

      act(() => {
        result.current.updateTemplate('template_001', { name: '新しい名前' });
      });

      expect(result.current.eventTemplates[0]?.name).toBe('新しい名前');
    });

    it('ID変更時に selectedTemplateId も更新される', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', 'テスト'));
        result.current.selectTemplate('template_001');
      });

      expect(result.current.selectedTemplateId).toBe('template_001');

      act(() => {
        result.current.updateTemplate('template_001', { id: 'template_002' });
      });

      expect(result.current.selectedTemplateId).toBe('template_002');
    });
  });

  describe('deleteTemplate', () => {
    it('テンプレートを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', 'テスト'));
      });

      act(() => {
        result.current.deleteTemplate('template_001');
      });

      expect(result.current.eventTemplates).toHaveLength(0);
    });

    it('選択中のテンプレートを削除すると selectedTemplateId が null になる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', 'テスト'));
        result.current.selectTemplate('template_001');
      });

      expect(result.current.selectedTemplateId).toBe('template_001');

      act(() => {
        result.current.deleteTemplate('template_001');
      });

      expect(result.current.selectedTemplateId).toBeNull();
    });
  });

  describe('selectTemplate', () => {
    it('テンプレートを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', 'テスト'));
      });

      act(() => {
        result.current.selectTemplate('template_001');
      });

      expect(result.current.selectedTemplateId).toBe('template_001');
    });
  });

  describe('updateTemplateActions', () => {
    it('テンプレートのアクションを更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTemplate(createEventTemplate('template_001', 'テスト'));
      });

      const mockAction = {
        type: 'wait',
        frames: 30,
        execute: jest.fn(),
        toJSON: () => ({ type: 'wait', frames: 30 }),
      } as unknown as EventAction;

      act(() => {
        result.current.updateTemplateActions('template_001', [mockAction]);
      });

      expect(result.current.eventTemplates[0]?.actions).toHaveLength(1);
      expect(result.current.eventTemplates[0]?.actions[0]).toBe(mockAction);
    });
  });
});
