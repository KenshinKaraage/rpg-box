/**
 * LocalStorage 一時保存プロバイダー
 *
 * クラッシュ復旧用の一時データ保存を担当
 * 定期的な自動保存データをLocalStorageに保持
 */

import type { TempStorageProvider, TempSaveData } from './types';

// =============================================================================
// 定数
// =============================================================================

const STORAGE_KEY = 'rpg-box-temp-save';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB（LocalStorageの一般的な制限）

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * データサイズを計算（バイト単位）
 */
function calculateDataSize(data: TempSaveData): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * LocalStorageが利用可能かチェック
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// LocalStorageProvider クラス
// =============================================================================

/**
 * LocalStorage を使用した一時保存プロバイダー
 */
export class LocalStorageProvider implements TempStorageProvider {
  private readonly storageKey: string;
  private readonly maxSize: number;

  constructor(options?: { storageKey?: string; maxSize?: number }) {
    this.storageKey = options?.storageKey ?? STORAGE_KEY;
    this.maxSize = options?.maxSize ?? MAX_STORAGE_SIZE;
  }

  /**
   * 一時データを保存
   * @throws {Error} LocalStorageが使用不可、またはサイズ制限超過の場合
   */
  saveTempData(data: TempSaveData): void {
    if (!isLocalStorageAvailable()) {
      throw new Error('LocalStorage is not available');
    }

    const dataSize = calculateDataSize(data);
    if (dataSize > this.maxSize) {
      throw new Error(
        `Data size (${dataSize} bytes) exceeds maximum allowed size (${this.maxSize} bytes)`
      );
    }

    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage quota exceeded');
      }
      throw error;
    }
  }

  /**
   * 一時データを読み込み
   * @returns 保存されたデータ、または存在しない/破損している場合はnull
   */
  loadTempData(): TempSaveData | null {
    if (!isLocalStorageAvailable()) {
      return null;
    }

    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized) as unknown;

      // 基本的な構造チェック
      if (!isValidTempSaveData(data)) {
        console.warn('Invalid temp save data format, ignoring');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load temp data:', error);
      return null;
    }
  }

  /**
   * 一時データをクリア
   */
  clearTempData(): void {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear temp data:', error);
    }
  }

  /**
   * 一時データの存在確認
   */
  hasTempData(): boolean {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * 保存データのサイズを取得（バイト単位）
   */
  getStoredDataSize(): number {
    if (!isLocalStorageAvailable()) {
      return 0;
    }

    const serialized = localStorage.getItem(this.storageKey);
    if (!serialized) {
      return 0;
    }

    return new Blob([serialized]).size;
  }

  /**
   * 保存データの経過時間を取得（ミリ秒）
   */
  getDataAge(): number | null {
    const data = this.loadTempData();
    if (!data) {
      return null;
    }

    return Date.now() - data.timestamp;
  }
}

// =============================================================================
// バリデーション
// =============================================================================

/**
 * TempSaveData の型ガード
 */
function isValidTempSaveData(data: unknown): data is TempSaveData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj['timestamp'] === 'number' &&
    typeof obj['projectId'] === 'string' &&
    typeof obj['data'] === 'object' &&
    obj['data'] !== null
  );
}

// =============================================================================
// シングルトンインスタンス
// =============================================================================

let instance: LocalStorageProvider | null = null;

/**
 * LocalStorageProvider のシングルトンインスタンスを取得
 */
export function getLocalStorage(): LocalStorageProvider {
  if (!instance) {
    instance = new LocalStorageProvider();
  }
  return instance;
}

/**
 * シングルトンインスタンスをリセット（テスト用）
 */
export function resetLocalStorage(): void {
  instance = null;
}

// エクスポート
export { calculateDataSize, isLocalStorageAvailable };
