/**
 * DeleteFolderConfirm のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteFolderConfirm } from './DeleteFolderConfirm';
import type { AssetFolder } from '@/types/asset';
import type { AssetReference } from '@/types/asset';

describe('DeleteFolderConfirm', () => {
  const mockFolders: AssetFolder[] = [
    { id: 'folder1', name: 'キャラクター' },
    { id: 'folder2', name: 'マップ' },
    { id: 'folder3', name: 'サブフォルダ', parentId: 'folder1' },
  ];

  const mockAssets: AssetReference[] = [
    {
      id: 'asset1',
      name: 'hero.png',
      type: 'image',
      folderId: 'folder1',
      data: 'data:image/png;base64,...',
      metadata: { fileSize: 1000 },
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onDeleteFolder: jest.fn(),
    folders: mockFolders,
    assets: [] as AssetReference[],
    folder: mockFolders[0],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('モーダルが開いている時に表示される', () => {
      render(<DeleteFolderConfirm {...defaultProps} />);
      expect(screen.getByText('フォルダを削除')).toBeInTheDocument();
    });

    it('モーダルが閉じている時は表示されない', () => {
      render(<DeleteFolderConfirm {...defaultProps} open={false} />);
      expect(screen.queryByText('フォルダを削除')).not.toBeInTheDocument();
    });

    it('フォルダ名が表示される', () => {
      render(<DeleteFolderConfirm {...defaultProps} />);
      expect(screen.getByText(/「キャラクター」/)).toBeInTheDocument();
    });

    it('削除ボタンとキャンセルボタンがある', () => {
      render(<DeleteFolderConfirm {...defaultProps} />);
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });
  });

  describe('空のフォルダ', () => {
    it('空のフォルダは通常の確認メッセージ', () => {
      // folder2はサブフォルダもアセットもない
      render(<DeleteFolderConfirm {...defaultProps} folder={mockFolders[1]} />);
      expect(screen.getByText(/「マップ」フォルダを削除しますか？/)).toBeInTheDocument();
      expect(screen.queryByText(/アセット/)).not.toBeInTheDocument();
      expect(screen.queryByText(/サブフォルダ/)).not.toBeInTheDocument();
    });

    it('削除ボタンを押すとonDeleteFolderが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<DeleteFolderConfirm {...defaultProps} folder={mockFolders[1]} />);

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(defaultProps.onDeleteFolder).toHaveBeenCalledWith('folder2');
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('アセットを含むフォルダ', () => {
    it('アセット数の警告が表示される', () => {
      render(<DeleteFolderConfirm {...defaultProps} assets={mockAssets} />);
      expect(screen.getByText(/1件のアセット/)).toBeInTheDocument();
    });

    it('削除するとアセットも削除される旨の警告', () => {
      render(<DeleteFolderConfirm {...defaultProps} assets={mockAssets} />);
      expect(screen.getByText(/含まれるアセットも削除されます/)).toBeInTheDocument();
    });
  });

  describe('サブフォルダを含むフォルダ', () => {
    it('サブフォルダ数の警告が表示される', () => {
      render(<DeleteFolderConfirm {...defaultProps} />);
      // folder1にはfolder3（サブフォルダ）がある
      expect(screen.getByText(/1件のサブフォルダ/)).toBeInTheDocument();
    });
  });

  describe('アセットとサブフォルダを含むフォルダ', () => {
    it('両方の警告が表示される', () => {
      render(<DeleteFolderConfirm {...defaultProps} assets={mockAssets} />);
      expect(screen.getByText(/1件のアセット/)).toBeInTheDocument();
      expect(screen.getByText(/1件のサブフォルダ/)).toBeInTheDocument();
    });
  });

  describe('キャンセル', () => {
    it('キャンセルボタンでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<DeleteFolderConfirm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onDeleteFolder).not.toHaveBeenCalled();
    });

    it('Escapeキーでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<DeleteFolderConfirm {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
