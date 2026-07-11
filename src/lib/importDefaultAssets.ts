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

  // フォルダを先に作成（既存チェック、I/O なしなので同期的に処理）
  const folderByGroup = new Map<string, AssetFolder>();
  for (const group of DEFAULT_ASSET_GROUPS) {
    let folder = existingFolders.find((f) => f.name === group.folderName);
    if (!folder) {
      const folderId = generateId('folder', allFolderIds);
      allFolderIds.push(folderId);
      folder = { id: folderId, name: group.folderName };
      addFolder(folder);
    }
    folderByGroup.set(group.folderName, folder);
  }

  // fetch → blob → Base64（→ 画像は寸法計測）を並列実行
  type FetchResult =
    | { status: 'skip' }
    | {
        status: 'ok';
        entry: (typeof DEFAULT_ASSET_GROUPS)[number]['assets'][number];
        folder: AssetFolder;
        data: string;
        blob: Blob;
        isAudio: boolean;
        isFont: boolean;
        width?: number;
        height?: number;
      };

  const tasks: Promise<FetchResult>[] = [];
  for (const group of DEFAULT_ASSET_GROUPS) {
    const folder = folderByGroup.get(group.folderName)!;
    for (const entry of group.assets) {
      // 重複チェック（name で判定）
      if (existingAssets.some((a) => a.name === entry.name)) {
        tasks.push(Promise.resolve({ status: 'skip' }));
        continue;
      }

      tasks.push(
        (async (): Promise<FetchResult> => {
          try {
            const response = await fetch(entry.path);
            if (!response.ok) return { status: 'skip' };
            const blob = await response.blob();
            const data = await blobToBase64(blob);

            const isAudio = /\.(mp3|wav|ogg)$/i.test(entry.path);
            const isFont = /\.(ttf|otf|woff2?)$/i.test(entry.path);

            if (!isAudio && !isFont) {
              const { width, height } = await measureImage(data);
              return { status: 'ok', entry, folder, data, blob, isAudio, isFont, width, height };
            }
            return { status: 'ok', entry, folder, data, blob, isAudio, isFont };
          } catch {
            return { status: 'skip' };
          }
        })()
      );
    }
  }

  const results = await Promise.all(tasks);

  // ID生成とストア登録は同期的に（並行性による重複IDを避けるため）
  for (const result of results) {
    if (result.status === 'skip') {
      skipped++;
      continue;
    }

    const { entry, folder, data, blob, isAudio, isFont, width, height } = result;
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
    } else if (isFont) {
      addAsset({
        id: assetId,
        name: entry.name,
        type: 'font',
        folderId: folder.id,
        data,
        metadata: { fileSize: blob.size },
      });
    } else {
      addAsset({
        id: assetId,
        name: entry.name,
        type: 'image',
        folderId: folder.id,
        data,
        metadata: { width: width!, height: height!, fileSize: blob.size },
      });
    }
    imported++;
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
