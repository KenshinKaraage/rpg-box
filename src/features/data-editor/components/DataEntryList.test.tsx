/**
 * DataEntryList コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DataEntryList } from './DataEntryList';
import { StringFieldType, NumberFieldType } from '@/types/fields';
import type { DataType, DataEntry } from '@/types/data';

// テスト用のフィールド
const nameField = new StringFieldType();
nameField.id = 'name';
nameField.name = '名前';

const hpField = new NumberFieldType();
hpField.id = 'hp';
hpField.name = 'HP';

const mockDataType: DataType = {
  id: 'character',
  name: 'キャラクター',
  fields: [hpField, nameField],
};

const mockEntries: DataEntry[] = [
  {
    id: 'entry_001',
    typeId: 'character',
    values: { hp: 100, name: 'アリス' },
  },
  {
    id: 'entry_002',
    typeId: 'character',
    values: { hp: 80, name: 'ボブ' },
  },
];

describe('DataEntryList', () => {
  const defaultProps = {
    entries: mockEntries,
    dataType: mockDataType,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('エントリIDが表示される', () => {
    render(<DataEntryList {...defaultProps} />);

    expect(screen.getByText('entry_001')).toBeInTheDocument();
    expect(screen.getByText('entry_002')).toBeInTheDocument();
  });

  it('最初の文字列フィールドの値がプレビューとして表示される', () => {
    render(<DataEntryList {...defaultProps} />);

    expect(screen.getByText('アリス')).toBeInTheDocument();
    expect(screen.getByText('ボブ')).toBeInTheDocument();
  });

  it('dataTypeがnullの場合、空メッセージが表示される', () => {
    render(<DataEntryList {...defaultProps} dataType={null} entries={[]} />);

    expect(screen.getByText('データ型を選択してください')).toBeInTheDocument();
  });

  it('エントリが空の場合、空メッセージが表示される', () => {
    render(<DataEntryList {...defaultProps} entries={[]} />);

    expect(screen.getByText('エントリがありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<DataEntryList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-entry-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('dataTypeがnullの場合、追加ボタンが無効化される', () => {
    render(<DataEntryList {...defaultProps} dataType={null} entries={[]} />);

    expect(screen.getByTestId('add-entry-button')).toBeDisabled();
  });

  it('エントリをクリックするとonSelectが呼ばれる', () => {
    render(<DataEntryList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('entry-item-entry_001'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('entry_001');
  });

  it('選択中のエントリがハイライトされる', () => {
    render(<DataEntryList {...defaultProps} selectedId="entry_001" />);

    const selectedItem = screen.getByTestId('entry-item-entry_001');
    expect(selectedItem).toHaveClass('bg-accent');
  });

  it('データ型名とエントリ件数が表示される', () => {
    render(<DataEntryList {...defaultProps} />);

    expect(screen.getByText('キャラクター')).toBeInTheDocument();
    expect(screen.getByText('2 件')).toBeInTheDocument();
  });
});
