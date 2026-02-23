import { createDefaultChipsetFields } from './defaultChipsetFields';
import type { SelectFieldType } from '@/types/fields';

describe('createDefaultChipsetFields', () => {
  it('通行設定と足音の2フィールドを返す', () => {
    const fields = createDefaultChipsetFields();
    expect(fields).toHaveLength(2);
  });

  it('1つ目は BooleanFieldType の passable', () => {
    const fields = createDefaultChipsetFields();
    expect(fields[0]!.id).toBe('passable');
    expect(fields[0]!.type).toBe('boolean');
    expect(fields[0]!.name).toBe('通行可能');
  });

  it('2つ目は SelectFieldType の footstep_type', () => {
    const fields = createDefaultChipsetFields();
    expect(fields[1]!.id).toBe('footstep_type');
    expect(fields[1]!.type).toBe('select');
    expect(fields[1]!.name).toBe('足音');
  });

  it('footstep_type は草むら/石畳/木床/砂地 の選択肢を持つ', () => {
    const fields = createDefaultChipsetFields();
    const footstepField = fields[1] as SelectFieldType;
    expect(footstepField.options.map((o) => o.value)).toEqual([
      'none',
      'grass',
      'stone',
      'wood',
      'sand',
    ]);
  });

  it('呼び出し毎に新しいインスタンスを返す', () => {
    const a = createDefaultChipsetFields();
    const b = createDefaultChipsetFields();
    expect(a[0]).not.toBe(b[0]);
  });
});
