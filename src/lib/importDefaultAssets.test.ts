import { importDefaultAssets } from './importDefaultAssets';
import type { AssetReference, AssetFolder } from '@/types/asset';

// globalThis.fetch をモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makePngBlob(): Blob {
  return new Blob(['fake-png-data'], { type: 'image/png' });
}

describe('importDefaultAssets', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(makePngBlob()),
    });
    // FileReader.readAsDataURL をモック
    jest.spyOn(global, 'FileReader').mockImplementation(() => {
      const reader = {
        readAsDataURL: jest.fn().mockImplementation(function (this: FileReader) {
          // @ts-expect-error mock
          this.result = 'data:image/png;base64,ZmFrZQ==';
          // @ts-expect-error mock
          this.onload?.({ target: this });
        }),
      } as unknown as FileReader;
      return reader;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('新規アセットをインポートして件数を返す', async () => {
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([], addAsset, addFolder, []);
    expect(result.imported).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);
    expect(addFolder).toHaveBeenCalledTimes(1);
    expect(addAsset).toHaveBeenCalledTimes(result.imported);
  });

  it('既存アセットはスキップされる', async () => {
    const existingAsset: AssetReference = {
      id: 'asset_1',
      name: 't_mura01',
      type: 'image',
      data: 'data:image/png;base64,xxx',
      metadata: null,
    };
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([existingAsset], addAsset, addFolder, []);
    expect(result.skipped).toBe(1);
    expect(addAsset).not.toHaveBeenCalledWith(expect.objectContaining({ name: 't_mura01' }));
  });

  it('既存フォルダがある場合は再作成しない', async () => {
    const existingFolder: AssetFolder = {
      id: 'folder_1',
      name: 'マップチップ',
    };
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    await importDefaultAssets([], addAsset, addFolder, [existingFolder]);
    expect(addFolder).not.toHaveBeenCalled();
  });

  it('fetchが失敗したアセットはスキップされる', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([], addAsset, addFolder, []);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
    expect(addAsset).not.toHaveBeenCalled();
    expect(addFolder).toHaveBeenCalledTimes(1);
  });

  it('fetchが例外をスローした場合もスキップされる', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([], addAsset, addFolder, []);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
    expect(addAsset).not.toHaveBeenCalled();
  });
});
