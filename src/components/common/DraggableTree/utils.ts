import type { TreeNode } from './types';

export interface FlattenedNode {
  node: TreeNode;
  depth: number;
  indexInParent: number;
}

/**
 * parentId ベースのフラットリストを、ツリー順にソートして depth 付きで返す。
 * 展開中ノードの子のみ含む。
 */
export function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>
): FlattenedNode[] {
  const childrenMap = new Map<string | undefined, TreeNode[]>();
  for (const node of nodes) {
    const key = node.parentId;
    const siblings = childrenMap.get(key);
    if (siblings) {
      siblings.push(node);
    } else {
      childrenMap.set(key, [node]);
    }
  }

  const result: FlattenedNode[] = [];

  function traverse(parentId: string | undefined, depth: number) {
    const children = childrenMap.get(parentId);
    if (!children) return;
    children.forEach((child, index) => {
      result.push({ node: child, depth, indexInParent: index });
      if (expandedIds.has(child.id)) {
        traverse(child.id, depth + 1);
      }
    });
  }

  traverse(undefined, 0);
  return result;
}

/**
 * nodeId が ancestorId の子孫かどうか。循環防止に使う。
 */
export function isDescendant(
  nodes: TreeNode[],
  ancestorId: string,
  nodeId: string
): boolean {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let current = nodeMap.get(nodeId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodeMap.get(current.parentId);
  }
  return false;
}

/**
 * 指定ノードの子の数を返す。
 */
export function getChildCount(nodes: TreeNode[], parentId: string): number {
  return nodes.filter((n) => n.parentId === parentId).length;
}

/**
 * DropPosition + ターゲットノード情報から、onMove の引数 (newParentId, index) を計算。
 */
export function resolveDropTarget(
  nodes: TreeNode[],
  targetNodeId: string,
  position: 'before' | 'inside' | 'after'
): { newParentId: string | undefined; index: number } {
  const target = nodes.find((n) => n.id === targetNodeId);
  if (!target) return { newParentId: undefined, index: 0 };

  if (position === 'inside') {
    const childCount = nodes.filter((n) => n.parentId === targetNodeId).length;
    return { newParentId: targetNodeId, index: childCount };
  }

  // before/after: ターゲットの兄弟として挿入
  const siblings = nodes.filter((n) => n.parentId === target.parentId);
  const targetIndex = siblings.findIndex((n) => n.id === targetNodeId);
  const index = position === 'before' ? targetIndex : targetIndex + 1;
  return { newParentId: target.parentId, index };
}
