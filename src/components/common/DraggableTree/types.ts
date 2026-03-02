export interface TreeNode {
  id: string;
  parentId?: string;
  [key: string]: unknown;
}

export type DropPosition = 'before' | 'inside' | 'after';

export interface DropTarget {
  nodeId: string;
  position: DropPosition;
}

export interface DraggableTreeProps {
  nodes: TreeNode[];
  renderNode: (node: TreeNode, depth: number) => React.ReactNode;
  onMove: (id: string, newParentId: string | undefined, index: number) => void;
  onSelect?: (ids: string[]) => void;
  selectedIds?: string[];
  indentPx?: number;
}
