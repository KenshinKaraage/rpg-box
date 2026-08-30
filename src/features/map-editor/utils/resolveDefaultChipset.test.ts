import { resolveDefaultChipsetId } from './resolveDefaultChipset';

describe('resolveDefaultChipsetId', () => {
  it('selectedChipsetId が chipsetIds に含まれていればそれを返す', () => {
    const result = resolveDefaultChipsetId({
      chipsetIds: ['cs1', 'cs2'],
      selectedChipsetId: 'cs2',
    });
    expect(result).toBe('cs2');
  });

  it('selectedChipsetId が未設定なら先頭のチップセットを返す', () => {
    const result = resolveDefaultChipsetId({ chipsetIds: ['cs1', 'cs2'] });
    expect(result).toBe('cs1');
  });

  it('selectedChipsetId がもう chipsetIds に無い（割当解除済み）なら先頭にフォールバック', () => {
    const result = resolveDefaultChipsetId({
      chipsetIds: ['cs1', 'cs2'],
      selectedChipsetId: 'cs_removed',
    });
    expect(result).toBe('cs1');
  });

  it('chipsetIds が空なら null を返す', () => {
    const result = resolveDefaultChipsetId({ chipsetIds: [] });
    expect(result).toBeNull();
  });
});
