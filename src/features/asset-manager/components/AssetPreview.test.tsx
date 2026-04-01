/**
 * AssetPreview のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetPreview } from './AssetPreview';
import type { AssetReference } from '@/types/asset';

describe('AssetPreview', () => {
  const mockAsset: AssetReference = {
    id: 'asset_001',
    name: 'test-image.png',
    type: 'image',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    metadata: {
      fileSize: 1024,
      width: 100,
      height: 100,
    },
  };

  const defaultProps = {
    asset: mockAsset,
    onRename: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('アセット選択時', () => {
    it('アセット名を表示する', () => {
      render(<AssetPreview {...defaultProps} />);
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    it('画像プレビューを表示する', () => {
      render(<AssetPreview {...defaultProps} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', mockAsset.data);
    });

    it('メタデータ（サイズ、解像度）を表示する', () => {
      render(<AssetPreview {...defaultProps} />);
      expect(screen.getByText(/100 × 100/)).toBeInTheDocument();
      expect(screen.getByText(/1 KB/)).toBeInTheDocument();
    });

    it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
      render(<AssetPreview {...defaultProps} />);
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);
      expect(defaultProps.onDelete).toHaveBeenCalledWith('asset_001');
    });

    it('名前変更ボタンをクリックするとonRenameが呼ばれる', () => {
      // window.prompt をモック
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('new-name.png');

      render(<AssetPreview {...defaultProps} />);
      const renameButton = screen.getByRole('button', { name: /名前を変更/i });
      fireEvent.click(renameButton);

      expect(promptSpy).toHaveBeenCalledWith('新しい名前', 'test-image.png');
      expect(defaultProps.onRename).toHaveBeenCalledWith('asset_001', 'new-name.png');

      promptSpy.mockRestore();
    });

    it('名前変更でキャンセルした場合onRenameは呼ばれない', () => {
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue(null);

      render(<AssetPreview {...defaultProps} />);
      const renameButton = screen.getByRole('button', { name: /名前を変更/i });
      fireEvent.click(renameButton);

      expect(defaultProps.onRename).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });
  });

  describe('アセット未選択時', () => {
    it('プレースホルダーメッセージを表示する', () => {
      render(<AssetPreview asset={null} onRename={jest.fn()} onDelete={jest.fn()} />);
      expect(screen.getByText(/アセットを選択/)).toBeInTheDocument();
    });
  });

  describe('音声アセット', () => {
    const audioAsset: AssetReference = {
      id: 'asset_audio',
      name: 'bgm.mp3',
      type: 'audio',
      data: 'data:audio/mp3;base64,AAAA',
      metadata: {
        fileSize: 2048,
        duration: 125,
      },
    };

    it('音声プレビュー（audio要素）を表示する', () => {
      render(<AssetPreview asset={audioAsset} onRename={jest.fn()} onDelete={jest.fn()} />);
      const audio = document.querySelector('audio');
      expect(audio).toBeInTheDocument();
      expect(audio).toHaveAttribute('src', audioAsset.data);
    });

    it('再生時間を表示する', () => {
      render(<AssetPreview asset={audioAsset} onRename={jest.fn()} onDelete={jest.fn()} />);
      expect(screen.getByText('再生時間: 2:05')).toBeInTheDocument();
    });
  });

  describe('フォルダ情報', () => {
    it('フォルダ名を表示する', () => {
      const assetWithFolder: AssetReference = {
        ...mockAsset,
        folderId: 'folder_001',
      };
      render(
        <AssetPreview
          asset={assetWithFolder}
          folderName="キャラクター画像"
          onRename={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      expect(screen.getByText('キャラクター画像')).toBeInTheDocument();
    });
  });
});
