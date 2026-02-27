import { render, screen, fireEvent } from '@testing-library/react';
import { VariableOpActionBlock } from './VariableOpActionBlock';
import { VariableOpAction } from '@/engine/actions/VariableOpAction';

describe('VariableOpActionBlock', () => {
  const createProps = () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'set';
    action.value = { type: 'literal', value: 100 };
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('変数操作ラベルが表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByText('変数操作')).toBeInTheDocument();
  });

  it('変数IDが表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByTestId('variable-id-input')).toHaveValue('hp');
  });

  it('値が表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByTestId('value-input')).toHaveValue('100');
  });

  it('変数IDを変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('variable-id-input'), { target: { value: 'mp' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.variableId).toBe('mp');
    expect(updated.type).toBe('variableOp');
  });

  it('値を変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('value-input'), { target: { value: '200' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.value).toEqual({ type: 'literal', value: 200 });
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
