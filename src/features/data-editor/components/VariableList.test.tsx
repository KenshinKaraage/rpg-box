/**
 * VariableList コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { VariableList } from './VariableList';
import type { Variable } from '@/types/variable';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// テスト用のFieldTypeインスタンスを作成
const numberFieldType = new NumberFieldType();
const stringFieldType = new StringFieldType();

const mockVariables: Variable[] = [
  {
    id: 'var_001',
    name: 'プレイヤーHP',
    fieldType: numberFieldType,
    isArray: false,
    initialValue: 100,
  },
  {
    id: 'var_002',
    name: 'アイテムリスト',
    fieldType: stringFieldType,
    isArray: true,
    initialValue: [],
  },
];

describe('VariableList', () => {
  const defaultProps = {
    variables: mockVariables,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('変数一覧が表示される', () => {
    render(<VariableList {...defaultProps} />);

    expect(screen.getByText('プレイヤーHP')).toBeInTheDocument();
    expect(screen.getByText('アイテムリスト')).toBeInTheDocument();
  });

  it('型の表示が正しい', () => {
    render(<VariableList {...defaultProps} />);

    // FieldTypeのlabelが表示される
    expect(screen.getByText('数値')).toBeInTheDocument();
    expect(screen.getByText('文字列[]')).toBeInTheDocument();
  });

  it('空の場合はメッセージが表示される', () => {
    render(<VariableList {...defaultProps} variables={[]} />);

    expect(screen.getByText('変数がありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<VariableList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-variable-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('変数をクリックするとonSelectが呼ばれる', () => {
    render(<VariableList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('variable-item-var_001'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('var_001');
  });

  it('選択中の変数がハイライトされる', () => {
    render(<VariableList {...defaultProps} selectedId="var_001" />);

    const selectedItem = screen.getByTestId('variable-item-var_001');
    expect(selectedItem).toHaveClass('bg-accent');
  });
});
