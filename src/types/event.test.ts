import { createEventTemplate } from './event';

describe('EventTemplate', () => {
  describe('createEventTemplate', () => {
    it('指定されたidとnameで作成される', () => {
      const template = createEventTemplate('tpl_001', '宝箱イベント');

      expect(template.id).toBe('tpl_001');
      expect(template.name).toBe('宝箱イベント');
    });

    it('デフォルト値で初期化される（空のargs, actions, description）', () => {
      const template = createEventTemplate('tpl_002', 'テスト');

      expect(template.description).toBe('');
      expect(template.args).toEqual([]);
      expect(template.actions).toEqual([]);
    });
  });
});
