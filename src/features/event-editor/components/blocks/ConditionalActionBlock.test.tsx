import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionalActionBlock } from './ConditionalActionBlock';
import { ConditionalAction } from '@/engine/actions/ConditionalAction';

// Mock ActionBlockEditor to avoid recursive rendering complexity in tests
jest.mock('../ActionBlockEditor', () => ({
  ActionBlockEditor: ({
    actions,
    onChange,
  }: {
    actions: unknown[];
    onChange: (a: unknown[]) => void;
  }) => (
    <div data-testid="action-block-editor">
      <span>{actions.length} actions</span>
      <button onClick={() => onChange([])}>clear-actions</button>
    </div>
  ),
}));

// Mock engine actions registry (required by ActionBlockEditor's real implementation)
jest.mock('@/engine/actions', () => ({
  getAction: jest.fn(),
}));

describe('ConditionalActionBlock', () => {
  const createProps = () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '>', value: 50 };
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('条件分岐ラベルが表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByText('条件分岐')).toBeInTheDocument();
  });

  it('条件の変数IDが表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByTestId('condition-variable-input')).toHaveValue('hp');
  });

  it('条件の比較値が表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByTestId('condition-value-input')).toHaveValue('50');
  });

  it('変数IDを変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<ConditionalActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('condition-variable-input'), {
      target: { value: 'mp' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as ConditionalAction;
    expect(updated.condition.variableId).toBe('mp');
  });

  it('比較値を変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<ConditionalActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('condition-value-input'), {
      target: { value: '100' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as ConditionalAction;
    expect(updated.condition.value).toBe(100);
  });

  it('Then/Elseラベルが表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByText('Then（真の場合）')).toBeInTheDocument();
    expect(screen.getByText('Else（偽の場合）')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<ConditionalActionBlock {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
