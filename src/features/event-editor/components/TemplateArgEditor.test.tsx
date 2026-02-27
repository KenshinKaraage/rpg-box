import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateArgEditor } from './TemplateArgEditor';
import type { TemplateArg } from '@/types/event';
import { StringFieldType, NumberFieldType } from '@/types/fields';

const createMockArg = (index: number, type: 'string' | 'number' = 'string'): TemplateArg => {
  const fieldType = type === 'string' ? new StringFieldType() : new NumberFieldType();
  fieldType.id = `arg_${index}`;
  fieldType.name = `引数${index}`;
  return {
    id: `arg_${index}`,
    name: `引数${index}`,
    fieldType,
    required: false,
  };
};

describe('TemplateArgEditor', () => {
  const defaultProps = {
    args: [] as TemplateArg[],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('引数がない場合メッセージが表示される', () => {
    render(<TemplateArgEditor {...defaultProps} />);
    expect(screen.getByText('引数がありません')).toBeInTheDocument();
  });

  it('引数が表示される', () => {
    const args = [createMockArg(1), createMockArg(2)];
    render(<TemplateArgEditor {...defaultProps} args={args} />);
    expect(screen.getByTestId('arg-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('arg-row-1')).toBeInTheDocument();
  });

  it('追加ボタンでonChangeが呼ばれる', () => {
    render(<TemplateArgEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-arg-button'));
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    const newArgs = defaultProps.onChange.mock.calls[0]![0] as TemplateArg[];
    expect(newArgs).toHaveLength(1);
    expect(newArgs[0]!.name).toBe('新しい引数');
  });

  it('名前変更でonChangeが呼ばれる', () => {
    const args = [createMockArg(1)];
    render(<TemplateArgEditor {...defaultProps} args={args} />);
    fireEvent.change(screen.getByTestId('arg-name-0'), { target: { value: '新しい名前' } });
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    const updated = defaultProps.onChange.mock.calls[0]![0] as TemplateArg[];
    expect(updated[0]!.name).toBe('新しい名前');
  });

  it('削除でonChangeが呼ばれる', () => {
    const args = [createMockArg(1), createMockArg(2)];
    render(<TemplateArgEditor {...defaultProps} args={args} />);
    fireEvent.click(screen.getByTestId('arg-delete-0'));
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    const updated = defaultProps.onChange.mock.calls[0]![0] as TemplateArg[];
    expect(updated).toHaveLength(1);
    expect(updated[0]!.id).toBe('arg_2');
  });
});
