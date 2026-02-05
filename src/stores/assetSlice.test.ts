/**
 * assetSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { AssetReference, AssetFolder } from '@/types/asset';

describe('assetSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      const state = useStore.getState();
      state.assets.forEach((a) => state.deleteAsset(a.id));
      state.assetFolders.forEach((f) => state.deleteFolder(f.id));
      state.selectAsset(null);
      state.selectFolder(null);
    });
  });

  describe('初期状態', () => {
    it('assets は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.assets));
      expect(result.current).toEqual([]);
    });

    it('assetFolders は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.assetFolders));
      expect(result.current).toEqual([]);
    });

    it('selectedAssetId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedAssetId));
      expect(result.current).toBeNull();
    });

    it('selectedFolderId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedFolderId));
      expect(result.current).toBeNull();
    });
  });

  describe('addAsset', () => {
    it('アセットを追加できる', () => {
      const { result } = renderHook(() => useStore());

      const newAsset: AssetReference = {
        id: 'asset_001',
        name: 'test.png',
        type: 'image',
        data: 'data:image/png;base64,xxx',
        metadata: { fileSize: 100, width: 10, height: 10 },
      };

      act(() => {
        result.current.addAsset(newAsset);
      });

      expect(result.current.assets).toHaveLength(1);
      expect(result.current.assets[0]).toEqual(newAsset);
    });
  });

  describe('updateAsset', () => {
    it('アセットを更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addAsset({
          id: 'asset_001',
          name: 'old.png',
          type: 'image',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
      });

      act(() => {
        result.current.updateAsset('asset_001', { name: 'new.png' });
      });

      expect(result.current.assets[0]?.name).toBe('new.png');
    });
  });

  describe('deleteAsset', () => {
    it('アセットを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addAsset({
          id: 'asset_001',
          name: 'test.png',
          type: 'image',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
      });

      act(() => {
        result.current.deleteAsset('asset_001');
      });

      expect(result.current.assets).toHaveLength(0);
    });

    it('選択中のアセットを削除すると selectedAssetId が null になる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addAsset({
          id: 'asset_001',
          name: 'test.png',
          type: 'image',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
        result.current.selectAsset('asset_001');
      });

      expect(result.current.selectedAssetId).toBe('asset_001');

      act(() => {
        result.current.deleteAsset('asset_001');
      });

      expect(result.current.selectedAssetId).toBeNull();
    });
  });

  describe('selectAsset', () => {
    it('アセットを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addAsset({
          id: 'asset_001',
          name: 'test.png',
          type: 'image',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
      });

      act(() => {
        result.current.selectAsset('asset_001');
      });

      expect(result.current.selectedAssetId).toBe('asset_001');
    });
  });

  describe('addFolder', () => {
    it('フォルダを追加できる', () => {
      const { result } = renderHook(() => useStore());

      const newFolder: AssetFolder = {
        id: 'folder_001',
        name: 'キャラクター',
      };

      act(() => {
        result.current.addFolder(newFolder);
      });

      expect(result.current.assetFolders).toHaveLength(1);
      expect(result.current.assetFolders[0]).toEqual(newFolder);
    });
  });

  describe('updateFolder', () => {
    it('フォルダ名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({
          id: 'folder_001',
          name: '古い名前',
        });
      });

      act(() => {
        result.current.updateFolder('folder_001', { name: '新しい名前' });
      });

      expect(result.current.assetFolders[0]?.name).toBe('新しい名前');
    });
  });

  describe('deleteFolder', () => {
    it('フォルダを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({
          id: 'folder_001',
          name: 'フォルダ',
        });
      });

      act(() => {
        result.current.deleteFolder('folder_001');
      });

      expect(result.current.assetFolders).toHaveLength(0);
    });

    it('フォルダ削除時、配下のアセットはルートに移動', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({
          id: 'folder_001',
          name: 'フォルダ',
        });
        result.current.addAsset({
          id: 'asset_001',
          name: 'test.png',
          type: 'image',
          folderId: 'folder_001',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
      });

      act(() => {
        result.current.deleteFolder('folder_001');
      });

      expect(result.current.assets[0]?.folderId).toBeUndefined();
    });
  });

  describe('selectFolder', () => {
    it('フォルダを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({
          id: 'folder_001',
          name: 'フォルダ',
        });
      });

      act(() => {
        result.current.selectFolder('folder_001');
      });

      expect(result.current.selectedFolderId).toBe('folder_001');
    });
  });

  describe('getAssetsByFolder', () => {
    it('指定フォルダ内のアセットを取得', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({ id: 'folder_001', name: 'フォルダ1' });
        result.current.addAsset({
          id: 'asset_001',
          name: 'test1.png',
          type: 'image',
          folderId: 'folder_001',
          data: 'data:image/png;base64,xxx',
          metadata: { fileSize: 100 },
        });
        result.current.addAsset({
          id: 'asset_002',
          name: 'test2.png',
          type: 'image',
          data: 'data:image/png;base64,yyy',
          metadata: { fileSize: 200 },
        });
      });

      const folderAssets = result.current.getAssetsByFolder('folder_001');
      expect(folderAssets).toHaveLength(1);
      expect(folderAssets[0]?.id).toBe('asset_001');

      const rootAssets = result.current.getAssetsByFolder(undefined);
      expect(rootAssets).toHaveLength(1);
      expect(rootAssets[0]?.id).toBe('asset_002');
    });
  });

  describe('getChildFolders', () => {
    it('子フォルダを取得', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addFolder({ id: 'folder_001', name: 'ルート' });
        result.current.addFolder({ id: 'folder_002', name: '子1', parentId: 'folder_001' });
        result.current.addFolder({ id: 'folder_003', name: '子2', parentId: 'folder_001' });
        result.current.addFolder({ id: 'folder_004', name: 'ルート2' });
      });

      const children = result.current.getChildFolders('folder_001');
      expect(children).toHaveLength(2);

      const rootFolders = result.current.getChildFolders(undefined);
      expect(rootFolders).toHaveLength(2);
    });
  });
});
