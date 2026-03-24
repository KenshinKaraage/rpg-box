/**
 * RectTransform → ワールド座標変換
 *
 * UIObject の親子階層とアンカー/ピボット/回転/スケールを考慮して
 * 最終的なワールド座標の矩形を計算する。
 */
import type { RectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

/**
 * 解決済みワールド矩形
 * 回転なしの場合: x,y が左上、w,h がサイズ
 * 回転ありの場合: x,y がピボット位置、w,h がサイズ、rotation が度数
 */
export interface WorldRect {
  /** ピボットのワールドX座標 */
  x: number;
  /** ピボットのワールドY座標 */
  y: number;
  /** 幅 (スケール適用後) */
  w: number;
  /** 高さ (スケール適用後) */
  h: number;
  /** 回転（度、累積） */
  rotation: number;
  /** 累積スケールX */
  scaleX: number;
  /** 累積スケールY */
  scaleY: number;
  /** ピボットX (0-1) */
  pivotX: number;
  /** ピボットY (0-1) */
  pivotY: number;
}

/**
 * アンカーXの値を親幅に対する比率で返す
 */
function anchorXRatio(anchor: RectTransform['anchorX']): number {
  switch (anchor) {
    case 'left':
      return 0;
    case 'center':
      return 0.5;
    case 'right':
      return 1;
  }
}

/**
 * アンカーYの値を親高さに対する比率で返す
 */
function anchorYRatio(anchor: RectTransform['anchorY']): number {
  switch (anchor) {
    case 'top':
      return 0;
    case 'center':
      return 0.5;
    case 'bottom':
      return 1;
  }
}

/**
 * 親のワールド矩形を基に、子の RectTransform からワールド矩形を計算する
 *
 * 座標系:
 * - アンカーポイント = 親の左上 + (親幅 * anchorXRatio, 親高 * anchorYRatio)
 * - ローカル位置 = アンカーポイント + (x, y)
 * - ピボットポイント = ローカル位置 (x,y はピボットの位置を指す)
 * - 左上 = ピボットポイント - (width * pivotX, height * pivotY)
 */
export function resolveTransform(
  transform: RectTransform,
  parentRect: WorldRect
): WorldRect {
  const ax = anchorXRatio(transform.anchorX);
  const ay = anchorYRatio(transform.anchorY);

  // 親の左上ワールド座標（親のピボットを考慮）
  const parentLeft = parentRect.x - parentRect.w * parentRect.scaleX * parentRect.pivotX;
  const parentTop = parentRect.y - parentRect.h * parentRect.scaleY * parentRect.pivotY;

  // アンカーポイント（親の左上 + 親サイズ × アンカー比率）
  const anchorWorldX = parentLeft + parentRect.w * parentRect.scaleX * ax;
  const anchorWorldY = parentTop + parentRect.h * parentRect.scaleY * ay;

  // ピボットのワールド座標 = アンカー + ローカルオフセット (親のスケール考慮)
  let localX = transform.x * parentRect.scaleX;
  let localY = transform.y * parentRect.scaleY;

  // 親の回転を考慮（ローカルオフセットを回転）
  if (parentRect.rotation !== 0) {
    const rad = (parentRect.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = localX * cos - localY * sin;
    const ry = localX * sin + localY * cos;
    localX = rx;
    localY = ry;
  }

  const pivotWorldX = anchorWorldX + localX;
  const pivotWorldY = anchorWorldY + localY;

  return {
    x: pivotWorldX,
    y: pivotWorldY,
    w: transform.width,
    h: transform.height,
    rotation: parentRect.rotation + transform.rotation,
    scaleX: parentRect.scaleX * transform.scaleX,
    scaleY: parentRect.scaleY * transform.scaleY,
    pivotX: transform.pivotX,
    pivotY: transform.pivotY,
  };
}

/**
 * キャンバスルートの WorldRect を作成
 * ルートオブジェクトの親として使う（解像度サイズのキャンバス全体）
 */
export function createRootRect(canvasWidth: number, canvasHeight: number): WorldRect {
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    w: canvasWidth,
    h: canvasHeight,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    pivotX: 0.5,
    pivotY: 0.5,
  };
}

/**
 * WorldRect から描画用の4頂点を計算（回転・スケール考慮）
 * 返り値: [topLeft, topRight, bottomRight, bottomLeft] の x,y 座標
 */
export function getWorldCorners(rect: WorldRect): [number, number][] {
  const sw = rect.w * rect.scaleX;
  const sh = rect.h * rect.scaleY;

  // ピボットを考慮したローカル4頂点
  const corners: [number, number][] = [
    [-sw * rect.pivotX,        -sh * rect.pivotY],         // top-left
    [ sw * (1 - rect.pivotX),  -sh * rect.pivotY],         // top-right
    [ sw * (1 - rect.pivotX),   sh * (1 - rect.pivotY)],   // bottom-right
    [-sw * rect.pivotX,         sh * (1 - rect.pivotY)],   // bottom-left
  ];

  if (rect.rotation === 0) {
    return corners.map(([cx, cy]) => [rect.x + cx, rect.y + cy]);
  }

  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return corners.map(([cx, cy]) => [
    rect.x + cx * cos - cy * sin,
    rect.y + cx * sin + cy * cos,
  ]);
}

/**
 * UIObject 配列をツリー走査して描画順（深さ優先、配列順）で
 * WorldRect を解決する
 *
 * @returns objectId → WorldRect のマップ
 */
export function resolveAllTransforms(
  objects: EditorUIObject[],
  canvasWidth: number,
  canvasHeight: number
): Map<string, WorldRect> {
  const result = new Map<string, WorldRect>();
  const rootRect = createRootRect(canvasWidth, canvasHeight);

  // parentId → children のマップを構築
  const childrenMap = new Map<string | undefined, EditorUIObject[]>();
  for (const obj of objects) {
    const parentKey = obj.parentId;
    const siblings = childrenMap.get(parentKey);
    if (siblings) {
      siblings.push(obj);
    } else {
      childrenMap.set(parentKey, [obj]);
    }
  }

  // 深さ優先走査
  function traverse(parentId: string | undefined, parentWorldRect: WorldRect) {
    const children = childrenMap.get(parentId);
    if (!children) return;

    for (const child of children) {
      const worldRect = resolveTransform(child.transform, parentWorldRect);
      result.set(child.id, worldRect);
      traverse(child.id, worldRect);
    }
  }

  traverse(undefined, rootRect);
  return result;
}
