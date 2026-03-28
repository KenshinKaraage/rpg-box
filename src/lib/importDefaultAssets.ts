import { DEFAULT_ASSET_GROUPS } from './defaultAssets';
import { generateId } from './utils';
import type { AssetReference, AssetFolder } from '@/types/asset';

export async function importDefaultAssets(
  existingAssets: AssetReference[],
  addAsset: (asset: AssetReference) => void,
  addFolder: (folder: AssetFolder) => void,
  existingFolders: AssetFolder[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  const allAssetIds = existingAssets.map((a) => a.id);
  const allFolderIds = existingFolders.map((f) => f.id);

  for (const group of DEFAULT_ASSET_GROUPS) {
    // フォルダを作成（既存チェック）
    let folder = existingFolders.find((f) => f.name === group.folderName);
    if (!folder) {
      const folderId = generateId('folder', allFolderIds);
      allFolderIds.push(folderId);
      folder = { id: folderId, name: group.folderName };
      addFolder(folder);
    }

    for (const entry of group.assets) {
      // 重複チェック（name で判定）
      if (existingAssets.some((a) => a.name === entry.name)) {
        skipped++;
        continue;
      }

      // fetch → blob → Base64
      let data: string;
      let blob: Blob;
      try {
        const response = await fetch(entry.path);
        if (!response.ok) {
          skipped++;
          continue;
        }
        blob = await response.blob();
        data = await blobToBase64(blob);
      } catch {
        skipped++;
        continue;
      }

      const isAudio = /\.(mp3|wav|ogg)$/i.test(entry.path);
      const assetId = generateId('asset', allAssetIds);
      allAssetIds.push(assetId);

      if (isAudio) {
        addAsset({
          id: assetId,
          name: entry.name,
          type: 'audio',
          folderId: folder.id,
          data,
          metadata: { fileSize: blob.size },
        });
      } else {
        const { width, height } = await measureImage(data);
        addAsset({
          id: assetId,
          name: entry.name,
          type: 'image',
          folderId: folder.id,
          data,
          metadata: { width, height, fileSize: blob.size },
        });
      }
      imported++;
    }
  }

  return { imported, skipped };
}

function measureImage(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('画像の寸法取得に失敗しました'));
    img.src = dataUrl;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read blob'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
