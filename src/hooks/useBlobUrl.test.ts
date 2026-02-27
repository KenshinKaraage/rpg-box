import { renderHook, act } from '@testing-library/react';
import { dataUrlToBlob, useBlobUrl } from './useBlobUrl';

// 1×1 透過 PNG の data URL（テスト用最小画像）
const SAMPLE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// 別の data URL（1×1 透過 GIF）
const OTHER_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('dataUrlToBlob', () => {
  it('data URL を Blob に変換する', () => {
    const blob = dataUrlToBlob(SAMPLE_DATA_URL);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('useBlobUrl', () => {
  const mockBlobUrl = 'blob:http://localhost/test-uuid';
  let createObjectURL: jest.SpyInstance;
  let revokeObjectURL: jest.SpyInstance;

  beforeEach(() => {
    // jsdom は URL.createObjectURL / revokeObjectURL を実装していないため定義してスパイする
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => mockBlobUrl),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
    createObjectURL = URL.createObjectURL as jest.Mock;
    revokeObjectURL = URL.revokeObjectURL as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dataUrl が null のとき null を返す', () => {
    const { result } = renderHook(() => useBlobUrl(null));
    expect(result.current).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('有効な data URL を渡すと Blob URL を返す', async () => {
    const { result } = renderHook(() => useBlobUrl(SAMPLE_DATA_URL));
    // useEffect 実行後
    await act(async () => {});
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(mockBlobUrl);
  });

  it('dataUrl が変わったとき前の Blob URL を解放して新しい Blob URL を返す', async () => {
    const newBlobUrl = 'blob:http://localhost/new-uuid';
    (createObjectURL as jest.Mock).mockReturnValueOnce(mockBlobUrl).mockReturnValueOnce(newBlobUrl);

    const { result, rerender } = renderHook(({ url }: { url: string }) => useBlobUrl(url), {
      initialProps: { url: SAMPLE_DATA_URL },
    });
    await act(async () => {});
    expect(result.current).toBe(mockBlobUrl);

    rerender({ url: OTHER_DATA_URL });
    await act(async () => {});

    // 前の Blob URL が解放されている
    expect(revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
    expect(result.current).toBe(newBlobUrl);
  });

  it('アンマウント時に Blob URL を解放する', async () => {
    const { unmount } = renderHook(() => useBlobUrl(SAMPLE_DATA_URL));
    await act(async () => {});
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
  });

  it('null に切り替えたとき Blob URL を解放して null を返す', async () => {
    const { result, rerender } = renderHook(({ url }: { url: string | null }) => useBlobUrl(url), {
      initialProps: { url: SAMPLE_DATA_URL as string | null },
    });
    await act(async () => {});
    expect(result.current).toBe(mockBlobUrl);

    rerender({ url: null });
    await act(async () => {});

    expect(revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
    expect(result.current).toBeNull();
  });
});
