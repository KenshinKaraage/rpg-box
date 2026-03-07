/**
 * DataTypeEditor コンポーネントのテスト
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataTypeEditor } from './DataTypeEditor';
import type { DataType } from '@/types/data';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// ResizeObserver mock for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// テスト用のFieldTypeインスタンスを作成
const numberField = new NumberFieldType();
numberField.id = 'field_hp';
numberField.name = 'HP';

const stringField = new StringFieldType();
stringField.id = 'field_name';
stringField.name = '名前';

const mockDataType: DataType = {
  id: 'monsters',
  name: 'モンスター',
  fields: [numberField, stringField],
  description: 'モンスターデータの定義',
};

describe('DataTypeEditor', () => {
  const defaultProps = {
    dataType: mockDataType,
    existingIds: ['monsters', 'items'],
    onUpdateDataType: jest.fn(),
    onAddField: jest.fn(),
    onReplaceField: jest.fn(),
    onDeleteField: jest.fn(),
    onReorderFields: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ型がない場合はプレースホルダーが表示される', () => {
    render(
      <DataTypeEditor
        dataType={null}
        existingIds={[]}
        onUpdateDataType={jest.fn()}
        onAddField={jest.fn()}
        onReplaceField={jest.fn()}
        onDeleteField={jest.fn()}
        onReorderFields={jest.fn()}
      />
    );

    expect(screen.getByText('データ型を選択してください')).toBeInTheDocument();
  });

  it('データ型IDが表示され編集可能', () => {
    render(<DataTypeEditor {...defaultProps} />);

    const idInput = screen.getByDisplayValue('monsters');
    expect(idInput).not.toBeDisabled();
  });

  it('データ型の情報が表示される', () => {
    render(<DataTypeEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('monsters')).toBeInTheDocument();
    expect(screen.getByDisplayValue('モンスター')).toBeInTheDocument();
    expect(screen.getByDisplayValue('モンスターデータの定義')).toBeInTheDocument();
  });

  it('データ型名を変更するとonUpdateDataTypeが呼ばれる', async () => {
    render(<DataTypeEditor {...defaultProps} />);

    const nameInput = screen.getByLabelText('データ型名');
    fireEvent.change(nameInput, { target: { value: '新しい名前' } });

    await waitFor(() => {
      expect(defaultProps.onUpdateDataType).toHaveBeenCalledWith('monsters', {
        name: '新しい名前',
      });
    });
  });

  it('フィールド追加ボタンをクリックするとFieldTypeSelectorが開き、タイプ選択でonAddFieldが呼ばれる', () => {
    render(<DataTypeEditor {...defaultProps} />);

    // フィールド追加ボタンでモーダルが開く
    fireEvent.click(screen.getByText('追加'));
    expect(screen.getByText('フィールドタイプを選択')).toBeInTheDocument();

    // タイプを選択するとonAddFieldが呼ばれる
    fireEvent.click(screen.getByRole('button', { name: '数値' }));
    expect(defaultProps.onAddField).toHaveBeenCalledWith('monsters', expect.any(Object));
  });

  it('フィールド削除ボタンをクリックするとonDeleteFieldが呼ばれる', () => {
    render(<DataTypeEditor {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /を削除/ });
    fireEvent.click(deleteButtons[0]!);

    expect(defaultProps.onDeleteField).toHaveBeenCalledWith('monsters', 'field_hp');
  });

  it('フィールド名が表示される', () => {
    render(<DataTypeEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('HP')).toBeInTheDocument();
    expect(screen.getByDisplayValue('名前')).toBeInTheDocument();
  });

  it('フィールドがない場合はメッセージが表示される', () => {
    const emptyDataType: DataType = {
      id: 'empty',
      name: '空のデータ型',
      fields: [],
    };
    render(<DataTypeEditor {...defaultProps} dataType={emptyDataType} />);

    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
  });
});
