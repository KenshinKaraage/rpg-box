/**
 * RenameFolderModal のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenameFolderModal } from './RenameFolderModal';
import type { AssetFolder } from '@/types/asset';

describe('RenameFolderModal', () => {
  const mockFolders: AssetFolder[] = [
    { id: 'folder1', name: 'キャラクター' },
    { id: 'folder2', name: 'マップ' },
    { id: 'folder3', name: 'サブフォルダ', parentId: 'folder1' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onRenameFolder: jest.fn(),
    folders: mockFolders,
    folder: mockFolders[0],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('モーダルが開いている時に表示される', () => {
      render(<RenameFolderModal {...defaultProps} />);
      expect(screen.getByText('フォルダ名を変更')).toBeInTheDocument();
    });

    it('モーダルが閉じている時は表示されない', () => {
      render(<RenameFolderModal {...defaultProps} open={false} />);
      expect(screen.queryByText('フォルダ名を変更')).not.toBeInTheDocument();
    });

    it('現在のフォルダ名が入力欄に表示される', () => {
      render(<RenameFolderModal {...defaultProps} />);
      const input = screen.getByLabelText('フォルダ名') as HTMLInputElement;
      expect(input.value).toBe('キャラクター');
    });

    it('変更ボタンとキャンセルボタンがある', () => {
      render(<RenameFolderModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });
  });

  describe('フォルダ名変更', () => {
    it('有効な名前で変更ボタンを押すとonRenameFolderが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, '新しい名前');
      await user.click(screen.getByRole('button', { name: '変更' }));

      expect(defaultProps.onRenameFolder).toHaveBeenCalledWith('folder1', '新しい名前');
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('Enterキーでも変更できる', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, '新しい名前{enter}');

      expect(defaultProps.onRenameFolder).toHaveBeenCalledWith('folder1', '新しい名前');
    });

    it('同じ名前のまま変更しても問題ない', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: '変更' }));

      expect(defaultProps.onRenameFolder).toHaveBeenCalledWith('folder1', 'キャラクター');
    });
  });

  describe('バリデーション', () => {
    it('空の名前では変更できない', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: '変更' }));

      expect(defaultProps.onRenameFolder).not.toHaveBeenCalled();
      expect(screen.getByText('フォルダ名を入力してください')).toBeInTheDocument();
    });

    it('同じ階層に同名フォルダがある場合はエラー', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, 'マップ');
      await user.click(screen.getByRole('button', { name: '変更' }));

      expect(defaultProps.onRenameFolder).not.toHaveBeenCalled();
      expect(screen.getByText('同じ名前のフォルダが既に存在します')).toBeInTheDocument();
    });

    it('サブフォルダの名前変更で同階層のみチェック', async () => {
      const user = userEvent.setup();
      // folder3（サブフォルダ、親はfolder1）の名前変更
      render(<RenameFolderModal {...defaultProps} folder={mockFolders[2]} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      // 親なしフォルダに「マップ」があるが、folder3の親はfolder1なので問題なし
      await user.type(input, 'マップ');
      await user.click(screen.getByRole('button', { name: '変更' }));

      expect(defaultProps.onRenameFolder).toHaveBeenCalledWith('folder3', 'マップ');
    });
  });

  describe('キャンセル', () => {
    it('キャンセルボタンでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onRenameFolder).not.toHaveBeenCalled();
    });

    it('Escapeキーでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<RenameFolderModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('初期化', () => {
    it('異なるフォルダでモーダルを開くと名前がリセットされる', async () => {
      const { rerender } = render(<RenameFolderModal {...defaultProps} />);

      let input = screen.getByLabelText('フォルダ名') as HTMLInputElement;
      expect(input.value).toBe('キャラクター');

      // 別のフォルダで開き直す
      rerender(<RenameFolderModal {...defaultProps} open={false} />);
      rerender(<RenameFolderModal {...defaultProps} folder={mockFolders[1]} open={true} />);

      input = screen.getByLabelText('フォルダ名') as HTMLInputElement;
      expect(input.value).toBe('マップ');
    });
  });
});
