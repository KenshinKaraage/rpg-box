/**
 * Navigation フォーカス管理ロジック
 *
 * NavigationComponent を持つ親の子 NavigationItem を収集し、
 * 方向キーでフォーカスを移動するロジックを提供する。
 * NavigationCursor の位置計算も担当。
 */
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';
import type { WorldRect } from './transformResolver';

interface NavigationData {
  direction?: 'horizontal' | 'vertical' | 'grid';
  wrap?: boolean;
  initialIndex?: number;
  columns?: number;
}

interface NavigationCursorData {
  offsetX?: number;
  offsetY?: number;
}

/**
 * ナビゲーション状態
 */
export interface NavigationState {
  /** ナビゲーションコンポーネントを持つオブジェクトID */
  navigationId: string;
  /** NavigationItem の ID 配列（順序付き） */
  items: string[];
  /** 現在のフォーカスインデックス */
  focusIndex: number;
  /** ナビゲーション設定 */
  config: Required<NavigationData>;
}

/**
 * NavigationComponent を持つオブジェクトからナビゲーション状態を構築
 */
export function buildNavigationState(
  navObject: EditorUIObject,
  allObjects: EditorUIObject[]
): NavigationState | null {
  const navComp = findComponent(navObject, 'navigation');
  if (!navComp) return null;

  const data = navComp.data as NavigationData;

  // 直接の子で NavigationItem コンポーネントを持つものを収集
  const items = allObjects
    .filter((o) => o.parentId === navObject.id && hasComponent(o, 'navigationItem'))
    .map((o) => o.id);

  if (items.length === 0) return null;

  const initialIndex = Math.min(data.initialIndex ?? 0, items.length - 1);

  return {
    navigationId: navObject.id,
    items,
    focusIndex: Math.max(0, initialIndex),
    config: {
      direction: data.direction ?? 'vertical',
      wrap: data.wrap ?? false,
      initialIndex: data.initialIndex ?? 0,
      columns: data.columns ?? 1,
    },
  };
}

/**
 * フォーカスを移動する
 *
 * @param state 現在のナビゲーション状態
 * @param direction 移動方向
 * @returns 新しいフォーカスインデックス
 */
export function moveFocus(
  state: NavigationState,
  direction: 'up' | 'down' | 'left' | 'right'
): number {
  const { items, focusIndex, config } = state;
  const count = items.length;
  if (count === 0) return 0;

  let delta = 0;

  if (config.direction === 'vertical') {
    if (direction === 'up') delta = -1;
    else if (direction === 'down') delta = 1;
  } else if (config.direction === 'horizontal') {
    if (direction === 'left') delta = -1;
    else if (direction === 'right') delta = 1;
  } else if (config.direction === 'grid') {
    const cols = Math.max(1, config.columns);
    if (direction === 'left') delta = -1;
    else if (direction === 'right') delta = 1;
    else if (direction === 'up') delta = -cols;
    else if (direction === 'down') delta = cols;
  }

  if (delta === 0) return focusIndex;

  let newIndex = focusIndex + delta;

  if (config.wrap) {
    newIndex = ((newIndex % count) + count) % count;
  } else {
    newIndex = Math.max(0, Math.min(count - 1, newIndex));
  }

  return newIndex;
}

/**
 * NavigationCursor の位置を計算
 *
 * @param cursorObject カーソルオブジェクト
 * @param focusedItemRect フォーカス中のアイテムの WorldRect
 * @returns カーソルの目標位置 { x, y }
 */
export function resolveCursorPosition(
  cursorObject: EditorUIObject,
  focusedItemRect: WorldRect
): { x: number; y: number } {
  const cursorComp = findComponent(cursorObject, 'navigationCursor');
  const data = (cursorComp?.data ?? {}) as NavigationCursorData;
  const offsetX = data.offsetX ?? 0;
  const offsetY = data.offsetY ?? 0;

  return {
    x: focusedItemRect.x + offsetX,
    y: focusedItemRect.y + offsetY,
  };
}

function findComponent(obj: EditorUIObject, type: string): SerializedUIComponent | undefined {
  return obj.components.find((c) => c.type === type);
}

function hasComponent(obj: EditorUIObject, type: string): boolean {
  return obj.components.some((c) => c.type === type);
}
