/**
 * ImageFieldEditor のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageFieldEditor } from './ImageFieldEditor';

// useStoreをモック
const mockAssets = [
  {
    id: 'asset_001',
    name: 'hero.png',
    type: 'image',
    data: 'data:image/png;base64,abc',
    metadata: { fileSize: 1024, width: 100, height: 100 },
  },
  {
    id: 'asset_002',
    name: 'enemy.png',
    type: 'image',
    data: 'data:image/png;base64,def',
    metadata: { fileSize: 2048, width: 200, height: 200 },
  },
];

const mockFolders = [{ id: 'folder_001', name: 'キャラクター' }];

jest.mock('@/stores', () => ({
  useStore: jest.fn((selector) => {
    const state = {
      assets: mockAssets,
      assetFolders: mockFolders,
    };
    return selector(state);
  }),
}));

describe('ImageFieldEditor', () => {
  const defaultProps = {
    value: null as string | null,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('未選択状態', () => {
    it('選択ボタンを表示する', () => {
      render(<ImageFieldEditor {...defaultProps} />);
      expect(screen.getByText('画像を選択...')).toBeInTheDocument();
    });

    it('選択ボタンをクリックするとモーダルが開く', () => {
      render(<ImageFieldEditor {...defaultProps} />);
      fireEvent.click(screen.getByText('画像を選択...'));
      expect(screen.getByText('画像を選択')).toBeInTheDocument(); // モーダルタイトル
    });
  });

  describe('選択済み状態', () => {
    it('選択した画像のサムネイルを表示する', () => {
      render(<ImageFieldEditor {...defaultProps} value="asset_001" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'data:image/png;base64,abc');
    });

    it('選択した画像の名前を表示する', () => {
      render(<ImageFieldEditor {...defaultProps} value="asset_001" />);
      expect(screen.getByText('hero.png')).toBeInTheDocument();
    });

    it('変更ボタンをクリックするとモーダルが開く', () => {
      render(<ImageFieldEditor {...defaultProps} value="asset_001" />);
      fireEvent.click(screen.getByText('変更'));
      expect(screen.getByText('画像を選択')).toBeInTheDocument();
    });

    it('クリアボタンをクリックするとonChangeがnullで呼ばれる', () => {
      render(<ImageFieldEditor {...defaultProps} value="asset_001" />);
      fireEvent.click(screen.getByRole('button', { name: /クリア|解除/i }));
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('存在しないアセット', () => {
    it('アセットが見つからない場合エラー表示する', () => {
      render(<ImageFieldEditor {...defaultProps} value="nonexistent_asset" />);
      expect(screen.getByText('アセットが見つかりません')).toBeInTheDocument();
    });
  });

  describe('showPreview オプション', () => {
    it('showPreview=true（デフォルト）は画像プレビューを表示する', () => {
      render(<ImageFieldEditor value="asset_001" onChange={jest.fn()} />);
      expect(screen.getByRole('img', { name: 'hero.png' })).toBeInTheDocument();
    });

    it('showPreview=false はプレビュー画像を表示しない', () => {
      render(<ImageFieldEditor value="asset_001" onChange={jest.fn()} showPreview={false} />);
      expect(screen.queryByRole('img', { name: 'hero.png' })).not.toBeInTheDocument();
    });

    it('showPreview=false でもファイル名と変更ボタンは表示される', () => {
      render(<ImageFieldEditor value="asset_001" onChange={jest.fn()} showPreview={false} />);
      expect(screen.getByText('hero.png')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
    });
  });
});
