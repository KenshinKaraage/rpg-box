/**
 * イベントスライス
 *
 * イベントテンプレートの状態管理
 */
import type { EventTemplate } from '@/types/event';
import type { EventAction } from '@/engine/actions/EventAction';

export interface EventSlice {
  /** テンプレート一覧 */
  eventTemplates: EventTemplate[];

  /** 選択中のテンプレートID */
  selectedTemplateId: string | null;

  /** テンプレートを追加 */
  addTemplate: (template: EventTemplate) => void;

  /** テンプレートを更新 */
  updateTemplate: (id: string, updates: Partial<EventTemplate>) => void;

  /** テンプレートを削除 */
  deleteTemplate: (id: string) => void;

  /** テンプレートを選択 */
  selectTemplate: (id: string | null) => void;

  /** テンプレートのアクション配列を更新 */
  updateTemplateActions: (templateId: string, actions: EventAction[]) => void;
}

export const createEventSlice = <T extends EventSlice>(
  set: (fn: (state: T) => void) => void
): EventSlice => ({
  eventTemplates: [],
  selectedTemplateId: null,

  addTemplate: (template: EventTemplate) =>
    set((state) => {
      state.eventTemplates.push(template);
    }),

  updateTemplate: (id: string, updates: Partial<EventTemplate>) =>
    set((state) => {
      const index = state.eventTemplates.findIndex((t) => t.id === id);
      if (index !== -1) {
        state.eventTemplates[index] = {
          ...state.eventTemplates[index],
          ...updates,
        } as EventTemplate;
        if (updates.id && updates.id !== id && state.selectedTemplateId === id) {
          state.selectedTemplateId = updates.id;
        }
      }
    }),

  deleteTemplate: (id: string) =>
    set((state) => {
      state.eventTemplates = state.eventTemplates.filter((t) => t.id !== id);
      if (state.selectedTemplateId === id) {
        state.selectedTemplateId = null;
      }
    }),

  selectTemplate: (id: string | null) =>
    set((state) => {
      state.selectedTemplateId = id;
    }),

  updateTemplateActions: (templateId: string, actions: EventAction[]) =>
    set((state) => {
      const template = state.eventTemplates.find((t) => t.id === templateId);
      if (template) {
        template.actions = actions;
      }
    }),
});
