/**
 * ChipsetEditor コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipsetEditor } from './ChipsetEditor';
import { BooleanFieldType } from '@/types/fields';
import type { Chipset } from '@/types/map';

jest.mock('@/stores', () => ({
  useStore: jest.fn((selector) =>
    selector({
      assets: [],
      assetFolders: [],
    })
  ),
}));

function makeChipset(override?: Partial<Chipset>): Chipset {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  return {
    id: 'cs_001',
    name: 'フィールド',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    fields: [passableField],
    chips: [{ index: 0, values: { passable: true } }],
    ...override,
  };
}

const defaultProps = {
  chipsets: [makeChipset()],
  onAddChipset: jest.fn(),
  onUpdateChipset: jest.fn(),
  onDeleteChipset: jest.fn(),
  onUpdateChipProperty: jest.fn(),
  onAddFieldToChipset: jest.fn(),
  onReplaceChipsetField: jest.fn(),
  onDeleteChipsetField: jest.fn(),
  onReorderChipsetFields: jest.fn(),
};

describe('ChipsetEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('チップセット名が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByDisplayValue('フィールド')).toBeInTheDocument();
  });

  it('チップセット一覧が空なら空状態を表示', () => {
    render(<ChipsetEditor {...defaultProps} chipsets={[]} />);
    expect(screen.getByText('チップセットがありません')).toBeInTheDocument();
  });

  it('追加ボタンで onAddChipset が呼ばれる', () => {
    render(<ChipsetEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-chipset-button'));
    expect(defaultProps.onAddChipset).toHaveBeenCalledTimes(1);
  });

  it('名前変更で onUpdateChipset が呼ばれる', () => {
    render(<ChipsetEditor {...defaultProps} />);
    const input = screen.getByDisplayValue('フィールド');
    fireEvent.change(input, { target: { value: '新チップセット' } });
    expect(defaultProps.onUpdateChipset).toHaveBeenCalledWith('cs_001', { name: '新チップセット' });
  });

  it('タブ「チップ一覧」と「フィールド定義」が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByRole('tab', { name: 'チップ一覧' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'フィールド定義' })).toBeInTheDocument();
  });

  it('デフォルトでチップグリッドが表示されている', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByTestId('chip-grid')).toBeInTheDocument();
  });

  it('フィールド定義タブに切り替えるとフィールドが表示される', async () => {
    const user = userEvent.setup();
    render(<ChipsetEditor {...defaultProps} />);
    await user.click(screen.getByRole('tab', { name: 'フィールド定義' }));
    expect(screen.getByDisplayValue('通行可能')).toBeInTheDocument();
  });

  it('チップ一覧タブではフィールド名が非表示', () => {
    render(<ChipsetEditor {...defaultProps} />);
    // デフォルトのチップ一覧タブではフィールド名inputが表示されない
    expect(screen.queryByDisplayValue('通行可能')).not.toBeInTheDocument();
  });

  it('チップをクリックすると ChipPropertyEditor が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('chip-cell-0'));
    expect(screen.getByTestId('chip-property-editor')).toBeInTheDocument();
  });

  it('画像セクションが表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByText('画像')).toBeInTheDocument();
  });

  it('imageId未設定時は「画像を選択...」ボタンが表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: '画像を選択...' })).toBeInTheDocument();
  });
});
