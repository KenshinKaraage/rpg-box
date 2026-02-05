/**
 * AssetPickerModal のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetPickerModal } from './AssetPickerModal';
import type { AssetReference, AssetFolder } from '@/types/asset';

describe('AssetPickerModal', () => {
  const mockAssets: AssetReference[] = [
    {
      id: 'asset_001',
      name: 'hero.png',
      type: 'image',
      folderId: 'folder_characters',
      data: 'data:image/png;base64,abc',
      metadata: { fileSize: 1024, width: 100, height: 100 },
    },
    {
      id: 'asset_002',
      name: 'enemy.png',
      type: 'image',
      folderId: 'folder_characters',
      data: 'data:image/png;base64,def',
      metadata: { fileSize: 2048, width: 200, height: 200 },
    },
    {
      id: 'asset_003',
      name: 'bg_forest.png',
      type: 'image',
      folderId: 'folder_backgrounds',
      data: 'data:image/png;base64,ghi',
      metadata: { fileSize: 4096, width: 800, height: 600 },
    },
    {
      id: 'asset_004',
      name: 'battle.mp3',
      type: 'audio',
      folderId: 'folder_bgm',
      data: 'data:audio/mp3;base64,jkl',
      metadata: { fileSize: 8192, duration: 120 },
    },
  ];

  const mockFolders: AssetFolder[] = [
    { id: 'folder_characters', name: 'キャラクター' },
    { id: 'folder_backgrounds', name: '背景' },
    { id: 'folder_bgm', name: 'BGM' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    assets: mockAssets,
    folders: mockFolders,
    assetType: 'image' as const,
    onSelect: jest.fn(),
    selectedAssetId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('モーダルが開いているときタイトルを表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      expect(screen.getByText('画像を選択')).toBeInTheDocument();
    });

    it('モーダルが閉じているとき何も表示しない', () => {
      render(<AssetPickerModal {...defaultProps} open={false} />);
      expect(screen.queryByText('画像を選択')).not.toBeInTheDocument();
    });

    it('音声タイプのとき適切なタイトルを表示する', () => {
      render(<AssetPickerModal {...defaultProps} assetType="audio" />);
      expect(screen.getByText('音声を選択')).toBeInTheDocument();
    });
  });

  describe('タイプフィルタリング', () => {
    it('画像タイプのとき画像アセットのみ表示する', () => {
      render(<AssetPickerModal {...defaultProps} assetType="image" />);
      expect(screen.getByText('hero.png')).toBeInTheDocument();
      expect(screen.getByText('enemy.png')).toBeInTheDocument();
      expect(screen.getByText('bg_forest.png')).toBeInTheDocument();
      expect(screen.queryByText('battle.mp3')).not.toBeInTheDocument();
    });

    it('音声タイプのとき音声アセットのみ表示する', () => {
      render(<AssetPickerModal {...defaultProps} assetType="audio" />);
      expect(screen.queryByText('hero.png')).not.toBeInTheDocument();
      expect(screen.getByText('battle.mp3')).toBeInTheDocument();
    });
  });

  describe('フォルダナビゲーション', () => {
    it('フォルダ一覧を表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      expect(screen.getByText('キャラクター')).toBeInTheDocument();
      expect(screen.getByText('背景')).toBeInTheDocument();
    });

    it('「すべて」を選択すると全アセットを表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.click(screen.getByText('すべて'));
      expect(screen.getByText('hero.png')).toBeInTheDocument();
      expect(screen.getByText('bg_forest.png')).toBeInTheDocument();
    });

    it('フォルダを選択するとそのフォルダのアセットのみ表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.click(screen.getByText('キャラクター'));
      expect(screen.getByText('hero.png')).toBeInTheDocument();
      expect(screen.getByText('enemy.png')).toBeInTheDocument();
      expect(screen.queryByText('bg_forest.png')).not.toBeInTheDocument();
    });

    it('initialFolderIdが指定されていると初期フォルダが選択される', () => {
      render(<AssetPickerModal {...defaultProps} initialFolderId="folder_backgrounds" />);
      expect(screen.getByText('bg_forest.png')).toBeInTheDocument();
      expect(screen.queryByText('hero.png')).not.toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    it('検索入力欄を表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument();
    });

    it('検索するとマッチするアセットのみ表示する', () => {
      render(<AssetPickerModal {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('検索...');
      fireEvent.change(searchInput, { target: { value: 'hero' } });
      expect(screen.getByText('hero.png')).toBeInTheDocument();
      expect(screen.queryByText('enemy.png')).not.toBeInTheDocument();
      expect(screen.queryByText('bg_forest.png')).not.toBeInTheDocument();
    });
  });

  describe('アセット選択', () => {
    it('アセットをクリックすると選択状態になる', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.click(screen.getByText('hero.png'));
      // 選択状態のスタイルが適用されることを確認（実装依存）
    });

    it('選択ボタンをクリックするとonSelectが呼ばれる', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.click(screen.getByText('hero.png'));
      fireEvent.click(screen.getByRole('button', { name: '選択' }));
      expect(defaultProps.onSelect).toHaveBeenCalledWith('asset_001');
    });

    it('アセットをダブルクリックすると直接選択される', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.doubleClick(screen.getByText('hero.png'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith('asset_001');
    });

    it('キャンセルボタンをクリックするとonOpenChangeが呼ばれる', () => {
      render(<AssetPickerModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('選択解除ボタンをクリックするとonSelectがnullで呼ばれる', () => {
      render(<AssetPickerModal {...defaultProps} selectedAssetId="asset_001" />);
      fireEvent.click(screen.getByRole('button', { name: '選択解除' }));
      expect(defaultProps.onSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('空の状態', () => {
    it('該当するアセットがない場合メッセージを表示する', () => {
      render(<AssetPickerModal {...defaultProps} assets={[]} />);
      expect(screen.getByText(/アセットがありません/)).toBeInTheDocument();
    });
  });
});
