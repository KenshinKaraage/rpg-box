import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 連番IDを生成する
 *
 * 既存IDから最大番号を求め、次の番号を返す。
 * 例: existingIds = ['data_1', 'data_3'] → 'data_4'
 *
 * @param prefix IDプレフィックス（例: 'data', 'entry', 'field'）
 * @param existingIds 既存のID一覧
 */
export function generateId(prefix: string, existingIds: string[]): string {
  let max = 0;
  const re = new RegExp(`^${prefix}_(\\d+)$`);
  for (const id of existingIds) {
    const m = re.exec(id);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}_${max + 1}`;
}
