/**
 * ChipPropertyEditor コンポーネントのテスト
 */
import { render, screen } from '@testing-library/react';
import { ChipPropertyEditor } from './ChipPropertyEditor';
import { BooleanFieldType, SelectFieldType } from '@/types/fields';
import type { Chipset } from '@/types/map';

function makeChipset(): Chipset {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  const footstepField = new SelectFieldType();
  footstepField.id = 'footstep_type';
  footstepField.name = '足音';
  footstepField.options = [
    { value: 'none', label: 'なし' },
    { value: 'grass', label: '草むら' },
  ];

  return {
    id: 'cs_001',
    name: 'テスト',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    fields: [passableField, footstepField],
    chips: [],
  };
}

describe('ChipPropertyEditor', () => {
  const onUpdate = jest.fn();

  beforeEach(() => onUpdate.mockClear());

  it('チップ番号が表示される', () => {
    render(
      <ChipPropertyEditor chipset={makeChipset()} chipIndex={5} onUpdateChipProperty={onUpdate} />
    );
    expect(screen.getByText('チップ #5')).toBeInTheDocument();
  });

  it('chipset.fields のエディタが表示される', () => {
    render(
      <ChipPropertyEditor chipset={makeChipset()} chipIndex={0} onUpdateChipProperty={onUpdate} />
    );
    expect(screen.getByText('通行可能')).toBeInTheDocument();
    expect(screen.getByText('足音')).toBeInTheDocument();
  });

  it('chipset が null なら何も表示しない', () => {
    const { container } = render(
      <ChipPropertyEditor chipset={null} chipIndex={null} onUpdateChipProperty={onUpdate} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('chipIndex が null なら何も表示しない', () => {
    const { container } = render(
      <ChipPropertyEditor
        chipset={makeChipset()}
        chipIndex={null}
        onUpdateChipProperty={onUpdate}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
