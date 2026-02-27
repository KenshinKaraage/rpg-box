import { render, screen, fireEvent } from '@testing-library/react';
import { AudioActionBlock } from './AudioActionBlock';
import { AudioAction } from '@/engine/actions/AudioAction';

describe('AudioActionBlock', () => {
  const createProps = (operation: AudioAction['operation'] = 'playBGM') => {
    const action = new AudioAction();
    action.operation = operation;
    action.audioId = 'bgm_battle';
    action.volume = 80;
    action.fadeIn = 30;
    action.fadeOut = 60;
    action.pitch = 100;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('オーディオラベルが表示される', () => {
    render(<AudioActionBlock {...createProps()} />);
    expect(screen.getByText('オーディオ')).toBeInTheDocument();
  });

  it('デフォルトの操作が表示される', () => {
    render(<AudioActionBlock {...createProps()} />);
    expect(screen.getByTestId('operation-select')).toHaveTextContent('BGM再生');
  });

  it('playBGMの場合にaudioIdが表示される', () => {
    render(<AudioActionBlock {...createProps('playBGM')} />);
    expect(screen.getByTestId('audio-id-input')).toHaveValue('bgm_battle');
  });

  it('stopBGMの場合にaudioIdが表示されない', () => {
    render(<AudioActionBlock {...createProps('stopBGM')} />);
    expect(screen.queryByTestId('audio-id-input')).not.toBeInTheDocument();
  });

  it('audioIdを変更するとonChangeが呼ばれる', () => {
    const props = createProps('playBGM');
    render(<AudioActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('audio-id-input'), {
      target: { value: 'bgm_field' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as AudioAction;
    expect(updated.audioId).toBe('bgm_field');
    expect(updated.type).toBe('audio');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<AudioActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('クローンがクラスインスタンスを保持する', () => {
    const props = createProps('playBGM');
    render(<AudioActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('audio-id-input'), {
      target: { value: 'bgm_new' },
    });
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated).toBeInstanceOf(AudioAction);
  });

  it('stopBGMの場合にフェードアウトが表示される', () => {
    render(<AudioActionBlock {...createProps('stopBGM')} />);
    expect(screen.getByTestId('fade-out-input')).toHaveValue(60);
  });

  it('playBGMの場合にフェードアウトが表示されない', () => {
    render(<AudioActionBlock {...createProps('playBGM')} />);
    expect(screen.queryByTestId('fade-out-input')).not.toBeInTheDocument();
  });

  it('playSEの場合にピッチが表示される', () => {
    render(<AudioActionBlock {...createProps('playSE')} />);
    expect(screen.getByTestId('pitch-input')).toHaveValue(100);
  });
});
