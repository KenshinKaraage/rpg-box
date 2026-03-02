// DOMRect polyfill for Radix ContextMenu
if (typeof DOMRect === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).DOMRect = class DOMRect {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = y;
      this.right = x + width;
      this.bottom = y + height;
      this.left = x;
    }
    toJSON() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
    static fromRect(rect?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRect(rect?.x ?? 0, rect?.y ?? 0, rect?.width ?? 0, rect?.height ?? 0);
    }
  };
}

import { render, screen, fireEvent } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { UIObjectTree } from './UIObjectTree';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

function makeObject(id: string, name: string, parentId?: string): EditorUIObject {
  return {
    id,
    name,
    parentId,
    transform: createDefaultRectTransform(),
    components: [],
  };
}

const defaultProps = {
  objects: [] as EditorUIObject[],
  selectedObjectIds: [] as string[],
  canvasId: 'canvas1' as string | null,
  onSelectObjects: jest.fn(),
  onAddObject: jest.fn(),
  onDeleteObject: jest.fn(),
  onUpdateObject: jest.fn(),
  onReparentObject: jest.fn(),
};

function renderTree(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  // Reset mocks
  Object.values(props).forEach((v) => {
    if (typeof v === 'function' && 'mockClear' in v) {
      (v as jest.Mock).mockClear();
    }
  });
  return render(<UIObjectTree {...props} />);
}

describe('UIObjectTree', () => {
  it('renders empty state when no objects', () => {
    renderTree();
    expect(screen.getByText('オブジェクトなし')).toBeInTheDocument();
  });

  it('renders prompt when no canvas selected', () => {
    renderTree({ canvasId: null });
    expect(screen.getByText('画面を選択してください')).toBeInTheDocument();
  });

  it('renders root objects', () => {
    const objects = [makeObject('a', 'Root A'), makeObject('b', 'Root B')];
    renderTree({ objects });
    expect(screen.getByText('Root A')).toBeInTheDocument();
    expect(screen.getByText('Root B')).toBeInTheDocument();
  });

  it('renders child objects nested under parent when expanded', () => {
    const objects = [
      makeObject('p', 'Parent'),
      makeObject('c', 'Child', 'p'),
    ];
    renderTree({ objects });

    // Child should not be visible initially
    expect(screen.queryByText('Child')).not.toBeInTheDocument();

    // Click expand toggle on parent
    const parentNode = screen.getByTestId('tree-node-p');
    const expandBtn = parentNode.querySelector('button');
    fireEvent.click(expandBtn!);

    // Child should now be visible
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('selects object on click', () => {
    const onSelectObjects = jest.fn();
    const objects = [makeObject('a', 'Root A')];
    renderTree({ objects, onSelectObjects });

    fireEvent.click(screen.getByText('Root A'));
    expect(onSelectObjects).toHaveBeenCalledWith(['a']);
  });

  it('toggles multi-select with ctrl/meta click', () => {
    const onSelectObjects = jest.fn();
    const objects = [makeObject('a', 'Root A'), makeObject('b', 'Root B')];
    renderTree({ objects, selectedObjectIds: ['a'], onSelectObjects });

    fireEvent.click(screen.getByText('Root B'), { metaKey: true });
    expect(onSelectObjects).toHaveBeenCalledWith(['a', 'b']);
  });

  it('adds root object via header button', () => {
    const onAddObject = jest.fn();
    const onSelectObjects = jest.fn();
    renderTree({ onAddObject, onSelectObjects });

    const addBtn = screen.getByRole('button', { name: 'オブジェクト追加' });
    fireEvent.click(addBtn);

    expect(onAddObject).toHaveBeenCalledTimes(1);
    const args = onAddObject.mock.calls[0];
    expect(args[0]).toBe('canvas1');
    expect(args[1]).toMatchObject({
      name: '新しいオブジェクト',
      components: [],
    });
    expect(args[1].parentId).toBeUndefined();
  });

  it('highlights selected objects', () => {
    const objects = [makeObject('a', 'Root A'), makeObject('b', 'Root B')];
    renderTree({ objects, selectedObjectIds: ['a'] });

    const nodeA = screen.getByTestId('tree-node-a');
    const nodeB = screen.getByTestId('tree-node-b');
    expect(nodeA.className).toContain('font-medium');
    expect(nodeB.className).not.toContain('font-medium');
  });

  it('shows tree structure indicator', () => {
    renderTree();
    expect(screen.getByTestId('ui-object-tree')).toBeInTheDocument();
  });

  it('calls onDeleteObject when delete action is triggered', () => {
    const onDeleteObject = jest.fn();
    const objects = [makeObject('a', 'Root A')];
    renderTree({ objects, onDeleteObject });

    // Right-click to open context menu
    const node = screen.getByTestId('tree-node-a');
    fireEvent.contextMenu(node);

    // Click delete option
    const deleteItem = screen.getByText('削除');
    fireEvent.click(deleteItem);

    expect(onDeleteObject).toHaveBeenCalledWith('canvas1', 'a');
  });
});
