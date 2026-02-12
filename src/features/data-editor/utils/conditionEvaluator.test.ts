import { evaluateDisplayCondition, computeFieldVisibility } from './conditionEvaluator';

describe('evaluateDisplayCondition', () => {
  it('値が一致する場合 true を返す', () => {
    const result = evaluateDisplayCondition(
      { fieldId: 'type', value: 'consumable' },
      { type: 'consumable' }
    );
    expect(result).toBe(true);
  });

  it('値が一致しない場合 false を返す', () => {
    const result = evaluateDisplayCondition(
      { fieldId: 'type', value: 'consumable' },
      { type: 'equipment' }
    );
    expect(result).toBe(false);
  });

  it('フィールドが存在しない場合 false を返す', () => {
    const result = evaluateDisplayCondition({ fieldId: 'type', value: 'consumable' }, {});
    expect(result).toBe(false);
  });

  it('厳密等価で比較する（型が異なると false）', () => {
    const result = evaluateDisplayCondition({ fieldId: 'count', value: '1' }, { count: 1 });
    expect(result).toBe(false);
  });

  it('空文字同士は true', () => {
    const result = evaluateDisplayCondition({ fieldId: 'name', value: '' }, { name: '' });
    expect(result).toBe(true);
  });
});

describe('computeFieldVisibility', () => {
  it('条件なしのフィールドは常に表示', () => {
    const result = computeFieldVisibility([{ id: 'name' }, { id: 'hp' }], {});
    expect(result).toEqual({ name: true, hp: true });
  });

  it('条件ありで一致するフィールドは表示', () => {
    const fields = [
      { id: 'name' },
      {
        id: 'effect',
        displayCondition: { fieldId: 'type', value: 'consumable' },
      },
    ];
    const result = computeFieldVisibility(fields, { type: 'consumable' });
    expect(result).toEqual({ name: true, effect: true });
  });

  it('条件ありで不一致のフィールドは非表示', () => {
    const fields = [
      { id: 'name' },
      {
        id: 'effect',
        displayCondition: { fieldId: 'type', value: 'consumable' },
      },
    ];
    const result = computeFieldVisibility(fields, { type: 'equipment' });
    expect(result).toEqual({ name: true, effect: false });
  });

  it('複数の条件付きフィールドを処理する', () => {
    const fields = [
      { id: 'name' },
      {
        id: 'effect_amount',
        displayCondition: { fieldId: 'type', value: 'consumable' },
      },
      {
        id: 'equip_slot',
        displayCondition: { fieldId: 'type', value: 'equipment' },
      },
    ];
    const result = computeFieldVisibility(fields, { type: 'equipment' });
    expect(result).toEqual({
      name: true,
      effect_amount: false,
      equip_slot: true,
    });
  });

  it('空のフィールド配列でも動作する', () => {
    const result = computeFieldVisibility([], {});
    expect(result).toEqual({});
  });
});
