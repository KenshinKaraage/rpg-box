import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionalActionBlock } from './ConditionalActionBlock';
import { ConditionalAction } from '@/engine/actions/ConditionalAction';
import { useStore } from '@/stores';
import { NumberFieldType, StringFieldType } from '@/types/fields';

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

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockVariables = [
  { id: 'hp', name: 'HP', fieldType: new NumberFieldType(), isArray: false, initialValue: 0 },
  { id: 'mp', name: 'MP', fieldType: new NumberFieldType(), isArray: false, initialValue: 0 },
  { id: 'name', name: '名前', fieldType: new StringFieldType(), isArray: false, initialValue: '' },
];

describe('ConditionalActionBlock', () => {
  beforeEach(() => {
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ variables: mockVariables })
    );
  });

  const createProps = () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: '>',
      right: { type: 'literal', value: 50 },
    };
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

  it('左辺の変数名がSelectに表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    const trigger = screen.getByTestId('left-variable-select');
    expect(trigger).toHaveTextContent('HP');
  });

  it('右辺のリテラル値が入力欄に表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByTestId('right-literal-input')).toHaveValue('50');
  });

  it('右辺のリテラル値を変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<ConditionalActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('right-literal-input'), {
      target: { value: '100' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as ConditionalAction;
    expect(updated.condition.right).toEqual({ type: 'literal', value: 100 });
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

  it('変数が空の場合でもSelectが表示される', () => {
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ variables: [] })
    );
    const props = createProps();
    props.action.condition.left = { type: 'variable', variableId: '' };
    render(<ConditionalActionBlock {...props} />);
    const trigger = screen.getByTestId('left-variable-select');
    expect(trigger).toBeInTheDocument();
  });

  it('左辺タイプセレクトが表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByTestId('left-type-select')).toBeInTheDocument();
  });

  it('右辺タイプセレクトが表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    expect(screen.getByTestId('right-type-select')).toBeInTheDocument();
  });

  it('型が不一致の場合エラーが表示される', () => {
    const props = createProps();
    // left: number variable, right: string variable
    props.action.condition.left = { type: 'variable', variableId: 'hp' };
    props.action.condition.right = { type: 'variable', variableId: 'name' };
    render(<ConditionalActionBlock {...props} />);
    expect(screen.getByTestId('type-mismatch-error')).toBeInTheDocument();
    expect(screen.getByTestId('type-mismatch-error')).toHaveTextContent('型が一致しません');
  });

  it('型が一致する場合エラーが表示されない', () => {
    const props = createProps();
    props.action.condition.left = { type: 'variable', variableId: 'hp' };
    props.action.condition.right = { type: 'variable', variableId: 'mp' };
    render(<ConditionalActionBlock {...props} />);
    expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
  });

  it('変数ドロップリストに型名が表示される', () => {
    render(<ConditionalActionBlock {...createProps()} />);
    // left-variable-select の trigger にはHP (number) が表示されている
    const trigger = screen.getByTestId('left-variable-select');
    expect(trigger).toHaveTextContent('number');
    expect(trigger).toHaveTextContent('HP');
  });
});
