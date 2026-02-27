'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * data: URL を Blob に変換する。
 * Base64 デコードは同期処理のため、呼び出し元は大きなファイルに注意すること。
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const mime = dataUrl.slice(0, comma).match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const binaryStr = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * data: URL を一度だけ Blob URL に変換して返す。
 *
 * - dataUrl が変わったとき（アセット切り替え）は前の Blob URL を解放して再変換する
 * - コンポーネントのアンマウント時に Blob URL を解放する
 * - dataUrl が null のときは null を返す
 */
export function useBlobUrl(dataUrl: string | null): string | null {
  const blobUrlRef = useRef<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // 前の Blob URL を解放
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!dataUrl) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
    blobUrlRef.current = url;
    setBlobUrl(url);

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [dataUrl]);

  return blobUrl;
}
