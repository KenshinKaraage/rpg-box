/**
 * VariableEditor コンポーネントのテスト
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VariableEditor } from './VariableEditor';
import type { Variable } from '@/types/variable';
import { NumberFieldType } from '@/types/fields';

// ResizeObserver mock for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// テスト用のFieldTypeインスタンスを作成
const numberFieldType = new NumberFieldType();

const mockVariable: Variable = {
  id: 'var_001',
  name: 'テスト変数',
  fieldType: numberFieldType,
  isArray: false,
  initialValue: 100,
  description: 'テスト用の変数です',
};

describe('VariableEditor', () => {
  const defaultProps = {
    variable: mockVariable,
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('変数がない場合はプレースホルダーが表示される', () => {
    render(<VariableEditor variable={null} onUpdate={jest.fn()} />);

    expect(screen.getByText('変数を選択してください')).toBeInTheDocument();
  });

  it('変数の情報が表示される', () => {
    render(<VariableEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('var_001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト変数')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト用の変数です')).toBeInTheDocument();
  });

  it('変数名を変更するとonUpdateが呼ばれる', async () => {
    render(<VariableEditor {...defaultProps} />);

    const nameInput = screen.getByLabelText('変数名');
    fireEvent.change(nameInput, { target: { value: '新しい名前' } });

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('var_001', { name: '新しい名前' });
    });
  });

  it('変数IDが表示され編集可能', () => {
    render(<VariableEditor {...defaultProps} />);

    const idInput = screen.getByDisplayValue('var_001');
    expect(idInput).not.toBeDisabled();
  });

  it('配列フラグを変更できる', async () => {
    render(<VariableEditor {...defaultProps} />);

    const checkbox = screen.getByLabelText('配列として扱う');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('var_001', {
        isArray: true,
        initialValue: [],
      });
    });
  });
});
