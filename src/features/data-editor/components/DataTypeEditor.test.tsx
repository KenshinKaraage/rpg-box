/**
 * DataTypeEditor コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTypeEditor } from './DataTypeEditor';
import type { DataType } from '@/types/data';
import { NAME_FIELD_ID } from '@/types/data';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// ResizeObserver mock for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function createStringField(overrides?: Partial<{ id: string; name: string }>) {
  const field = new StringFieldType();
  field.id = overrides?.id ?? 'field_name';
  field.name = overrides?.name ?? '名前';
  return field;
}

function createNumberField(overrides?: Partial<{ id: string; name: string }>) {
  const field = new NumberFieldType();
  field.id = overrides?.id ?? 'field_hp';
  field.name = overrides?.name ?? 'HP';
  return field;
}

function buildDataType(fields: DataType['fields']): DataType {
  return {
    id: 'monsters',
    name: 'モンスター',
    fields,
    description: 'モンスターデータの定義',
  };
}

describe('DataTypeEditor', () => {
  const defaultProps = {
    dropTarget: null,
    newlyInsertedId: null,
    onAddField: jest.fn(),
    onReplaceField: jest.fn(),
    onDeleteField: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィールド名が表示される', () => {
    const dataType = buildDataType([createNumberField(), createStringField({ name: '名前' })]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    expect(screen.getByDisplayValue('HP')).toBeInTheDocument();
    expect(screen.getByDisplayValue('名前')).toBeInTheDocument();
  });

  it('フィールドがない場合はドロップゾーンの案内が表示される', () => {
    const dataType = buildDataType([]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    expect(screen.getByText('パレットからドラッグしてフィールドを追加')).toBeInTheDocument();
  });

  it('「フィールドを追加」ボタンをクリックするとFieldTypeSelectorが開き、タイプ選択でonAddFieldが呼ばれる', () => {
    const dataType = buildDataType([createNumberField()]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    fireEvent.click(screen.getByText('フィールドを追加'));
    expect(screen.getByText('フィールドタイプを選択')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '文字列' }));
    expect(defaultProps.onAddField).toHaveBeenCalledWith('monsters', expect.any(Object));
  });

  it('削除ボタンをクリックするとonDeleteFieldが呼ばれる', () => {
    const dataType = buildDataType([createNumberField({ name: 'HP' })]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    fireEvent.click(screen.getByRole('button', { name: 'HPを削除' }));
    expect(defaultProps.onDeleteField).toHaveBeenCalledWith('monsters', 'field_hp');
  });

  it('名前フィールド（NAME_FIELD_ID）の削除ボタンは無効化されている', () => {
    const nameField = createStringField({ id: NAME_FIELD_ID, name: '名前' });
    const dataType = buildDataType([nameField]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    expect(screen.getByRole('button', { name: '名前を削除' })).toBeDisabled();
  });

  it('フィールド名を変更するとonReplaceFieldが呼ばれる', () => {
    const dataType = buildDataType([createStringField({ name: '名前' })]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    fireEvent.change(screen.getByDisplayValue('名前'), { target: { value: '新しい名前' } });
    expect(defaultProps.onReplaceField).toHaveBeenCalledWith(
      'monsters',
      'field_name',
      expect.objectContaining({ name: '新しい名前' })
    );
  });

  it('名前の直下に初期値を編集する欄が常に表示される', () => {
    const dataType = buildDataType([createStringField({ name: '名前' })]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    // 名前入力欄 + 初期値入力欄で textbox が2つ表示される
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('歯車ボタンをクリックすると、ID・タイプ・詳細設定が表示される', async () => {
    const user = userEvent.setup();
    const dataType = buildDataType([createStringField({ name: '名前' })]);
    render(<DataTypeEditor {...defaultProps} dataType={dataType} />);

    expect(screen.queryByText('フィールドID')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '名前の設定' }));

    expect(screen.getByText('フィールドID')).toBeInTheDocument();
    expect(screen.getByText('タイプ')).toBeInTheDocument();
    expect(screen.getByText('必須フィールド')).toBeInTheDocument();
    expect(screen.getByText('最大文字数')).toBeInTheDocument();
  });
});
