/**
 * LayoutGroup / GridLayout の子オブジェクト配置計算
 *
 * LayoutGroup/GridLayout コンポーネントを持つ親オブジェクトの子に対して
 * transform の x/y を自動計算する。
 */
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';

interface LayoutGroupData {
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  alignment?: 'start' | 'center' | 'end';
  reverseOrder?: boolean;
}

interface GridLayoutData {
  columns?: number;
  spacingX?: number;
  spacingY?: number;
  cellWidth?: number;
  cellHeight?: number;
}

/**
 * LayoutGroup の子オブジェクトの配置を計算
 *
 * @param children 子オブジェクト配列（配列順 = 描画順）
 * @param layoutData LayoutGroup コンポーネントのデータ
 * @param parentWidth 親オブジェクトの幅
 * @param parentHeight 親オブジェクトの高さ
 * @returns objectId → { x, y } のオフセットマップ
 */
export function resolveLayoutGroup(
  children: EditorUIObject[],
  layoutData: LayoutGroupData,
  parentWidth: number,
  parentHeight: number
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  const direction = layoutData.direction ?? 'vertical';
  const spacing = layoutData.spacing ?? 0;
  const alignment = layoutData.alignment ?? 'start';
  const reverse = layoutData.reverseOrder ?? false;

  const ordered = reverse ? [...children].reverse() : children;

  let cursor = 0;

  for (const child of ordered) {
    const w = child.transform.width;
    const h = child.transform.height;

    let x: number;
    let y: number;

    if (direction === 'vertical') {
      // 縦方向: y は cursor で決定、x は alignment で決定
      y = cursor;
      x = resolveAlignment(alignment, w, parentWidth);
      cursor += h + spacing;
    } else {
      // 横方向: x は cursor で決定、y は alignment で決定
      x = cursor;
      y = resolveAlignment(alignment, h, parentHeight);
      cursor += w + spacing;
    }

    result.set(child.id, { x, y });
  }

  return result;
}

/**
 * GridLayout の子オブジェクトの配置を計算
 *
 * @param children 子オブジェクト配列
 * @param gridData GridLayout コンポーネントのデータ
 * @returns objectId → { x, y } のオフセットマップ
 */
export function resolveGridLayout(
  children: EditorUIObject[],
  gridData: GridLayoutData
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  const columns = Math.max(1, gridData.columns ?? 2);
  const spacingX = gridData.spacingX ?? 0;
  const spacingY = gridData.spacingY ?? 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const col = i % columns;
    const row = Math.floor(i / columns);

    const cellW = gridData.cellWidth ?? child.transform.width;
    const cellH = gridData.cellHeight ?? child.transform.height;

    const x = col * (cellW + spacingX);
    const y = row * (cellH + spacingY);

    result.set(child.id, { x, y });
  }

  return result;
}

function resolveAlignment(alignment: 'start' | 'center' | 'end', childSize: number, parentSize: number): number {
  switch (alignment) {
    case 'start':
      return 0;
    case 'center':
      return (parentSize - childSize) / 2;
    case 'end':
      return parentSize - childSize;
  }
}

/**
 * オブジェクト配列の中から特定の親の子を取得し、
 * Layout コンポーネントに基づいて配置を解決する
 *
 * @returns 変更された transform を持つオブジェクト配列のコピー
 */
export function applyLayoutOverrides(
  objects: EditorUIObject[]
): Map<string, { x: number; y: number }> {
  const overrides = new Map<string, { x: number; y: number }>();

  // 親→子のマップ
  const childrenMap = new Map<string, EditorUIObject[]>();
  for (const obj of objects) {
    if (!obj.parentId) continue;
    const siblings = childrenMap.get(obj.parentId);
    if (siblings) {
      siblings.push(obj);
    } else {
      childrenMap.set(obj.parentId, [obj]);
    }
  }

  for (const obj of objects) {
    const layoutComp = findComponent(obj, 'layoutGroup');
    const gridComp = findComponent(obj, 'gridLayout');
    const children = childrenMap.get(obj.id) ?? [];

    if (children.length === 0) continue;

    if (layoutComp) {
      const data = layoutComp.data as LayoutGroupData;
      const positions = resolveLayoutGroup(children, data, obj.transform.width, obj.transform.height);
      for (const [id, pos] of positions) {
        overrides.set(id, pos);
      }
    } else if (gridComp) {
      const data = gridComp.data as GridLayoutData;
      const positions = resolveGridLayout(children, data);
      for (const [id, pos] of positions) {
        overrides.set(id, pos);
      }
    }
  }

  return overrides;
}

function findComponent(obj: EditorUIObject, type: string): SerializedUIComponent | undefined {
  return obj.components.find((c) => c.type === type);
}
