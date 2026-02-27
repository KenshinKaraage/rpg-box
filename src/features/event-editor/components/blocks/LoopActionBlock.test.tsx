import { render, screen, fireEvent } from '@testing-library/react';
import { LoopActionBlock } from './LoopActionBlock';
import { LoopAction } from '@/engine/actions/LoopAction';

// Mock ActionBlockEditor to avoid recursive rendering
jest.mock('../ActionBlockEditor', () => ({
  ActionBlockEditor: ({ actions }: { actions: unknown[] }) => (
    <div data-testid="action-block-editor">
      <span>{actions.length} actions</span>
    </div>
  ),
}));

// Mock engine actions (required by ActionBlockEditor)
jest.mock('@/engine/actions', () => ({
  getAction: jest.fn(),
}));

describe('LoopActionBlock', () => {
  const createProps = (count?: number) => {
    const action = new LoopAction();
    action.count = count;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('ループラベルが表示される', () => {
    render(<LoopActionBlock {...createProps(5)} />);
    expect(screen.getByText('ループ')).toBeInTheDocument();
  });

  it('回数が表示される', () => {
    render(<LoopActionBlock {...createProps(10)} />);
    expect(screen.getByTestId('loop-count-input')).toHaveValue(10);
  });

  it('無限ループ時はinputが空', () => {
    render(<LoopActionBlock {...createProps()} />);
    expect(screen.getByTestId('loop-count-input')).toHaveValue(null);
  });

  it('回数を変更するとonChangeが呼ばれる', () => {
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('loop-count-input'), { target: { value: '20' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated.count).toBe(20);
  });

  it('空に変更するとcount=undefinedになる', () => {
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('loop-count-input'), { target: { value: '' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated.count).toBeUndefined();
  });

  it('負の値ではonChangeが呼ばれない', () => {
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('loop-count-input'), { target: { value: '-1' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('不正な値(type=numberでは空文字になる)でcount=undefinedになる', () => {
    // In jsdom, non-numeric text in type="number" input yields empty string
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('loop-count-input'), { target: { value: 'abc' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated.count).toBeUndefined();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('ループ内アクションセクションが表示される', () => {
    render(<LoopActionBlock {...createProps(3)} />);
    expect(screen.getByText('ループ内アクション')).toBeInTheDocument();
  });

  it('クローンがクラスインスタンスを保持する', () => {
    const props = createProps(5);
    render(<LoopActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('loop-count-input'), { target: { value: '10' } });
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated).toBeInstanceOf(LoopAction);
  });
});
