import { render, screen, fireEvent } from '@testing-library/react';
import { WaitActionBlock } from './WaitActionBlock';
import { WaitAction } from '@/engine/actions/WaitAction';

describe('WaitActionBlock', () => {
  const createProps = (frames = 60) => {
    const action = new WaitAction();
    action.frames = frames;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('ウェイトラベルが表示される', () => {
    render(<WaitActionBlock {...createProps()} />);
    expect(screen.getByText('ウェイト')).toBeInTheDocument();
  });

  it('フレーム数が表示される', () => {
    render(<WaitActionBlock {...createProps(30)} />);
    const input = screen.getByTestId('wait-frames-input');
    expect(input).toHaveValue(30);
  });

  it('フレーム数を変更するとonChangeが呼ばれる', () => {
    const props = createProps(60);
    render(<WaitActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('wait-frames-input'), { target: { value: '120' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated.frames).toBe(120);
    expect(updated.type).toBe('wait');
  });

  it('負の値ではonChangeが呼ばれない', () => {
    const props = createProps(60);
    render(<WaitActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('wait-frames-input'), { target: { value: '-1' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('不正な値ではonChangeが呼ばれない', () => {
    const props = createProps(60);
    render(<WaitActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('wait-frames-input'), { target: { value: 'abc' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<WaitActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('クローンがクラスインスタンスを保持する', () => {
    const props = createProps(60);
    render(<WaitActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('wait-frames-input'), { target: { value: '90' } });
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated).toBeInstanceOf(WaitAction);
  });
});
