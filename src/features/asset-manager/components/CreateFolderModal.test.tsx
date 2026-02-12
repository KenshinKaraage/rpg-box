/**
 * CreateFolderModal のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateFolderModal } from './CreateFolderModal';
import type { AssetFolder } from '@/types/asset';

describe('CreateFolderModal', () => {
  const mockFolders: AssetFolder[] = [
    { id: 'folder1', name: 'キャラクター' },
    { id: 'folder2', name: 'マップ' },
    { id: 'folder3', name: 'サブフォルダ', parentId: 'folder1' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onCreateFolder: jest.fn(),
    folders: mockFolders,
    parentId: undefined as string | undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('モーダルが開いている時に表示される', () => {
      render(<CreateFolderModal {...defaultProps} />);
      expect(screen.getByText('新規フォルダ')).toBeInTheDocument();
    });

    it('モーダルが閉じている時は表示されない', () => {
      render(<CreateFolderModal {...defaultProps} open={false} />);
      expect(screen.queryByText('新規フォルダ')).not.toBeInTheDocument();
    });

    it('フォルダ名入力欄がある', () => {
      render(<CreateFolderModal {...defaultProps} />);
      expect(screen.getByLabelText('フォルダ名')).toBeInTheDocument();
    });

    it('作成ボタンとキャンセルボタンがある', () => {
      render(<CreateFolderModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });
  });

  describe('フォルダ作成', () => {
    it('有効な名前で作成ボタンを押すとonCreateFolderが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, '新しいフォルダ');
      await user.click(screen.getByRole('button', { name: '作成' }));

      expect(defaultProps.onCreateFolder).toHaveBeenCalledWith('新しいフォルダ', undefined);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('親フォルダが指定されている場合、親フォルダIDも渡される', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} parentId="folder1" />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, '子フォルダ');
      await user.click(screen.getByRole('button', { name: '作成' }));

      expect(defaultProps.onCreateFolder).toHaveBeenCalledWith('子フォルダ', 'folder1');
    });

    it('Enterキーでもフォルダを作成できる', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, '新しいフォルダ{enter}');

      expect(defaultProps.onCreateFolder).toHaveBeenCalledWith('新しいフォルダ', undefined);
    });
  });

  describe('バリデーション', () => {
    it('空の名前では作成できない', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: '作成' }));

      expect(defaultProps.onCreateFolder).not.toHaveBeenCalled();
      expect(screen.getByText('フォルダ名を入力してください')).toBeInTheDocument();
    });

    it('同じ階層に同名フォルダがある場合はエラー', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, 'キャラクター');
      await user.click(screen.getByRole('button', { name: '作成' }));

      expect(defaultProps.onCreateFolder).not.toHaveBeenCalled();
      expect(screen.getByText('同じ名前のフォルダが既に存在します')).toBeInTheDocument();
    });

    it('異なる階層なら同名フォルダを作成できる', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} parentId="folder2" />);

      const input = screen.getByLabelText('フォルダ名');
      await user.clear(input);
      await user.type(input, 'サブフォルダ');
      await user.click(screen.getByRole('button', { name: '作成' }));

      // folder2の下には「サブフォルダ」がないので作成可能
      expect(defaultProps.onCreateFolder).toHaveBeenCalledWith('サブフォルダ', 'folder2');
    });
  });

  describe('キャンセル', () => {
    it('キャンセルボタンでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onCreateFolder).not.toHaveBeenCalled();
    });

    it('Escapeキーでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(<CreateFolderModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('初期化', () => {
    it('モーダルを開くたびに入力がリセットされる', async () => {
      const { rerender } = render(<CreateFolderModal {...defaultProps} />);

      const input = screen.getByLabelText('フォルダ名') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'テスト' } });
      expect(input.value).toBe('テスト');

      // モーダルを閉じて再度開く
      rerender(<CreateFolderModal {...defaultProps} open={false} />);
      rerender(<CreateFolderModal {...defaultProps} open={true} />);

      const newInput = screen.getByLabelText('フォルダ名') as HTMLInputElement;
      expect(newInput.value).toBe('');
    });
  });
});
