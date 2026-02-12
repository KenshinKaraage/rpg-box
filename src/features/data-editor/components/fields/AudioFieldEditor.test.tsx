/**
 * AudioFieldEditor のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioFieldEditor } from './AudioFieldEditor';
import { useStore } from '@/stores';

// Mock useStore
jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

// Mock AssetPickerModal
jest.mock('@/features/asset-manager', () => ({
  AssetPickerModal: ({
    open,
    onSelect,
    onOpenChange,
  }: {
    open: boolean;
    onSelect: (id: string | null) => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="asset-picker-modal">
        <button onClick={() => onSelect('audio1')}>選択</button>
        <button onClick={() => onOpenChange(false)}>閉じる</button>
      </div>
    ) : null,
}));

// Mock HTMLAudioElement
class MockAudio {
  src = '';
  paused = true;
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

describe('AudioFieldEditor', () => {
  const mockAssets = [
    {
      id: 'audio1',
      name: 'BGM_Battle.mp3',
      type: 'audio',
      data: 'data:audio/mp3;base64,dummydata',
      metadata: { fileSize: 1024000, duration: 180 },
    },
    {
      id: 'audio2',
      name: 'SE_Click.wav',
      type: 'audio',
      data: 'data:audio/wav;base64,dummydata',
      metadata: { fileSize: 10240, duration: 0.5 },
    },
    {
      id: 'image1',
      name: 'character.png',
      type: 'image',
      data: 'data:image/png;base64,dummydata',
      metadata: { fileSize: 50000, width: 100, height: 100 },
    },
  ];

  const mockFolders = [{ id: 'folder1', name: 'Audio' }];

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        assets: mockAssets,
        assetFolders: mockFolders,
      })
    );
    // Mock Audio constructor
    (global as unknown as { Audio: typeof MockAudio }).Audio = MockAudio as unknown as typeof Audio;
  });

  describe('未選択状態', () => {
    it('選択ボタンが表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value={null} onChange={onChange} />);

      expect(screen.getByText('音声を選択...')).toBeInTheDocument();
    });

    it('選択ボタンをクリックするとモーダルが開く', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value={null} onChange={onChange} />);

      await user.click(screen.getByText('音声を選択...'));

      expect(screen.getByTestId('asset-picker-modal')).toBeInTheDocument();
    });

    it('モーダルでアセットを選択するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value={null} onChange={onChange} />);

      await user.click(screen.getByText('音声を選択...'));
      await user.click(screen.getByText('選択'));

      expect(onChange).toHaveBeenCalledWith('audio1');
    });
  });

  describe('選択済み状態', () => {
    it('ファイル名が表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      expect(screen.getByText('BGM_Battle.mp3')).toBeInTheDocument();
    });

    it('変更ボタンが表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    it('クリアボタンをクリックするとnullで呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: 'クリア' }));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('変更ボタンをクリックするとモーダルが開く', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      await user.click(screen.getByText('変更'));

      expect(screen.getByTestId('asset-picker-modal')).toBeInTheDocument();
    });
  });

  describe('再生/停止機能', () => {
    it('再生ボタンが表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
    });

    it('再生ボタンをクリックすると音声が再生される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      const playButton = screen.getByRole('button', { name: '再生' });
      await user.click(playButton);

      // 停止ボタンに変わる
      expect(screen.getByRole('button', { name: '停止' })).toBeInTheDocument();
    });

    it('停止ボタンをクリックすると音声が停止される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AudioFieldEditor value="audio1" onChange={onChange} />);

      // 再生開始
      await user.click(screen.getByRole('button', { name: '再生' }));

      // 停止
      await user.click(screen.getByRole('button', { name: '停止' }));

      // 再生ボタンに戻る
      expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
    });
  });

  describe('アセットが見つからない場合', () => {
    it('エラーメッセージが表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value="nonexistent" onChange={onChange} />);

      expect(screen.getByText('アセットが見つかりません')).toBeInTheDocument();
    });

    it('アセットIDが表示される', () => {
      const onChange = jest.fn();
      render(<AudioFieldEditor value="nonexistent" onChange={onChange} />);

      expect(screen.getByText('ID: nonexistent')).toBeInTheDocument();
    });
  });
});
