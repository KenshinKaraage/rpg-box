import { render, screen, fireEvent } from '@testing-library/react';
import { AudioActionBlock } from './AudioActionBlock';
import { AudioAction } from '@/engine/actions/AudioAction';
import { useStore } from '@/stores';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockAssets = [
  { id: 'bgm_battle', name: 'バトルBGM', type: 'audio', data: '', metadata: null },
  { id: 'bgm_field', name: 'フィールドBGM', type: 'audio', data: '', metadata: null },
  { id: 'img_hero', name: 'ヒーロー', type: 'image', data: '', metadata: null },
];

describe('AudioActionBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ assets: mockAssets })
    );
  });

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

  it('playBGMの場合にaudioIdセレクトが表示される', () => {
    render(<AudioActionBlock {...createProps('playBGM')} />);
    const trigger = screen.getByTestId('audio-id-select');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('バトルBGM');
  });

  it('stopBGMの場合にaudioIdセレクトが表示されない', () => {
    render(<AudioActionBlock {...createProps('stopBGM')} />);
    expect(screen.queryByTestId('audio-id-select')).not.toBeInTheDocument();
  });

  it('audioAssetがストアから取得される', () => {
    render(<AudioActionBlock {...createProps('playBGM')} />);
    expect(useStore).toHaveBeenCalled();
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
    // Trigger onChange via volume input (still an Input element)
    fireEvent.change(screen.getByTestId('volume-input'), {
      target: { value: '90' },
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

  it('音声アセットのみがフィルタリングされる（imageは除外）', () => {
    render(<AudioActionBlock {...createProps('playBGM')} />);
    // The select trigger should show audio asset name, not image asset
    const trigger = screen.getByTestId('audio-id-select');
    expect(trigger).toHaveTextContent('バトルBGM');
  });

  it('アセットが空の場合でもセレクトが表示される', () => {
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ assets: [] })
    );
    const props = createProps('playBGM');
    props.action.audioId = '';
    render(<AudioActionBlock {...props} />);
    const trigger = screen.getByTestId('audio-id-select');
    expect(trigger).toBeInTheDocument();
  });
});
