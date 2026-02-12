/**
 * DataTypeList コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTypeList } from './DataTypeList';
import type { DataType, DataEntry } from '@/types/data';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// テスト用のFieldTypeインスタンスを作成
const numberField = new NumberFieldType();
numberField.id = 'field_hp';
numberField.name = 'HP';

const stringField = new StringFieldType();
stringField.id = 'field_name';
stringField.name = '名前';

const mockDataTypes: DataType[] = [
  {
    id: 'monsters',
    name: 'モンスター',
    fields: [numberField, stringField],
  },
  {
    id: 'items',
    name: 'アイテム',
    fields: [stringField],
  },
];

const mockDataEntries: Record<string, DataEntry[]> = {
  monsters: [
    { id: 'entry_001', typeId: 'monsters', values: { field_hp: 100, field_name: 'スライム' } },
    { id: 'entry_002', typeId: 'monsters', values: { field_hp: 200, field_name: 'ドラゴン' } },
    { id: 'entry_003', typeId: 'monsters', values: { field_hp: 50, field_name: 'ゴブリン' } },
  ],
  items: [{ id: 'entry_101', typeId: 'items', values: { field_name: 'ポーション' } }],
};

describe('DataTypeList', () => {
  const defaultProps = {
    dataTypes: mockDataTypes,
    dataEntries: mockDataEntries,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ型名が表示される', () => {
    render(<DataTypeList {...defaultProps} />);

    expect(screen.getByText('モンスター')).toBeInTheDocument();
    expect(screen.getByText('アイテム')).toBeInTheDocument();
  });

  it('フィールド数とエントリ数が表示される', () => {
    render(<DataTypeList {...defaultProps} />);

    expect(screen.getByText('2 フィールド · 3 エントリ')).toBeInTheDocument();
    expect(screen.getByText('1 フィールド · 1 エントリ')).toBeInTheDocument();
  });

  it('空の場合はメッセージが表示される', () => {
    render(<DataTypeList {...defaultProps} dataTypes={[]} />);

    expect(screen.getByText('データ型がありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<DataTypeList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-datatype-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('データ型をクリックするとonSelectが呼ばれる', () => {
    render(<DataTypeList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('datatype-item-monsters'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('monsters');
  });

  it('選択中のデータ型がハイライトされる', () => {
    render(<DataTypeList {...defaultProps} selectedId="monsters" />);

    const selectedItem = screen.getByTestId('datatype-item-monsters');
    expect(selectedItem).toHaveClass('bg-accent');
  });

  it('エントリがないデータ型は0エントリと表示される', () => {
    const propsWithNoEntries = {
      ...defaultProps,
      dataEntries: {},
    };
    render(<DataTypeList {...propsWithNoEntries} />);

    expect(screen.getByText('2 フィールド · 0 エントリ')).toBeInTheDocument();
    expect(screen.getByText('1 フィールド · 0 エントリ')).toBeInTheDocument();
  });
});
