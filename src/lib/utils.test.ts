import { generateId } from './utils';

describe('generateId', () => {
  it('既存IDがない場合は_1を返す', () => {
    expect(generateId('data', [])).toBe('data_1');
  });

  it('既存IDの最大値+1を返す', () => {
    expect(generateId('data', ['data_1', 'data_2', 'data_3'])).toBe('data_4');
  });

  it('歯抜けがあっても最大値+1を返す', () => {
    expect(generateId('entry', ['entry_1', 'entry_5'])).toBe('entry_6');
  });

  it('異なるプレフィックスのIDは無視する', () => {
    expect(generateId('field', ['class_1', 'data_2', 'field_3'])).toBe('field_4');
  });

  it('プレフィックスに完全一致しないIDは無視する', () => {
    expect(generateId('data', ['data_type_1', 'data_1'])).toBe('data_2');
  });
});
