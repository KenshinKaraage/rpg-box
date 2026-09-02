/**
 * DataTypeList コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTypeList } from './DataTypeList';
import type { DataType } from '@/types/data';
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

describe('DataTypeList', () => {
  const defaultProps = {
    dataTypes: mockDataTypes,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
    onImportDefaults: jest.fn(),
    isImporting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ型名が表示される', () => {
    render(<DataTypeList {...defaultProps} />);

    expect(screen.getByText('モンスター')).toBeInTheDocument();
    expect(screen.getByText('アイテム')).toBeInTheDocument();
  });

  it('各データ型に枠（border）が表示される', () => {
    render(<DataTypeList {...defaultProps} />);

    expect(screen.getByTestId('datatype-item-monsters')).toHaveClass('border-2');
    expect(screen.getByTestId('datatype-item-items')).toHaveClass('border-2');
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
    expect(selectedItem).toHaveClass('border-primary');
  });
});
