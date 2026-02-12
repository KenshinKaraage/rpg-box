/**
 * FormBuilder コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { FormBuilder } from './FormBuilder';
import { NumberFieldType, StringFieldType } from '@/types/fields';
import type { DataType, DataEntry } from '@/types/data';

// テスト用フィールド
const numField = new NumberFieldType();
numField.id = 'hp';
numField.name = 'HP';
numField.required = true;

const strField = new StringFieldType();
strField.id = 'name';
strField.name = '名前';

const testDataType: DataType = {
  id: 'character',
  name: 'キャラクター',
  fields: [numField, strField],
};

const testEntry: DataEntry = {
  id: 'alice',
  typeId: 'character',
  values: { hp: 100, name: 'アリス' },
};

describe('FormBuilder', () => {
  const defaultProps = {
    dataType: testDataType,
    entry: testEntry,
    onUpdateEntry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィールドラベルが表示される', () => {
    render(<FormBuilder {...defaultProps} />);

    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('名前')).toBeInTheDocument();
  });

  it('必須フィールドにインジケータが表示される', () => {
    render(<FormBuilder {...defaultProps} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('フィールド値を変更するとonUpdateEntryが呼ばれる', () => {
    render(<FormBuilder {...defaultProps} />);

    // 名前フィールド（string）の入力を変更
    const textInputs = screen.getAllByRole('textbox');
    fireEvent.change(textInputs[0]!, { target: { value: 'ボブ' } });

    expect(defaultProps.onUpdateEntry).toHaveBeenCalledWith('character', 'alice', {
      hp: 100,
      name: 'ボブ',
    });
  });

  it('フィールドがない場合メッセージが表示される', () => {
    const emptyDataType: DataType = {
      id: 'empty',
      name: '空のデータ型',
      fields: [],
    };

    render(<FormBuilder {...defaultProps} dataType={emptyDataType} />);

    expect(screen.getByText('フィールドが定義されていません')).toBeInTheDocument();
  });

  it('エントリIDが表示される', () => {
    render(<FormBuilder {...defaultProps} />);

    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('数値フィールドの値を変更するとonUpdateEntryが呼ばれる', () => {
    render(<FormBuilder {...defaultProps} />);

    // 数値フィールドの入力を変更
    const numberInput = screen.getByRole('spinbutton');
    fireEvent.change(numberInput, { target: { value: '200' } });

    expect(defaultProps.onUpdateEntry).toHaveBeenCalledWith('character', 'alice', {
      hp: 200,
      name: 'アリス',
    });
  });
});
