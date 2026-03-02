import { render, screen } from '@testing-library/react';
import { TransformHandles, snapValue } from './TransformHandles';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject, UIEditorViewport } from '@/stores/uiEditorSlice';

// Mock store
const mockUpdateUIObject = jest.fn();
jest.mock('@/stores', () => ({
  useStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateUIObject: mockUpdateUIObject,
      snapToGrid: false,
      uiGridSize: 16,
    }),
}));

function makeObject(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  parentId?: string
): EditorUIObject {
  return {
    id,
    name: id,
    parentId,
    transform: { ...createDefaultRectTransform(), x, y, width: w, height: h },
    components: [],
  };
}

const defaultViewport: UIEditorViewport = { x: 0, y: 0, zoom: 1 };

beforeEach(() => {
  mockUpdateUIObject.mockClear();
});

// ──────────────────────────────────────────────
// snapValue
// ──────────────────────────────────────────────

describe('snapValue', () => {
  it('returns value unchanged when snap disabled', () => {
    expect(snapValue(13, 16, false)).toBe(13);
  });

  it('returns value unchanged when gridSize <= 0', () => {
    expect(snapValue(13, 0, true)).toBe(13);
    expect(snapValue(13, -1, true)).toBe(13);
  });

  it('snaps to nearest grid multiple', () => {
    expect(snapValue(10, 16, true)).toBe(16);
    expect(snapValue(24, 16, true)).toBe(32);
    expect(snapValue(0, 16, true)).toBe(0);
  });

  it('snaps negative values', () => {
    expect(snapValue(-10, 16, true)).toBe(-16);
  });
});

// ──────────────────────────────────────────────
// TransformHandles render
// ──────────────────────────────────────────────

describe('TransformHandles', () => {
  it('renders nothing when no object is selected', () => {
    const objects = [makeObject('a', 0, 0, 100, 100)];
    const { container } = render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={[]}
        viewport={defaultViewport}
        canvasId="canvas1"
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when canvasId is null', () => {
    const objects = [makeObject('a', 0, 0, 100, 100)];
    const { container } = render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={['a']}
        viewport={defaultViewport}
        canvasId={null}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders handles when single object is selected', () => {
    const objects = [makeObject('a', 10, 20, 100, 80)];
    render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={['a']}
        viewport={defaultViewport}
        canvasId="canvas1"
      />
    );

    expect(screen.getByTestId('transform-handles')).toBeInTheDocument();
    expect(screen.getByTestId('move-handle')).toBeInTheDocument();
    expect(screen.getByTestId('rotate-handle')).toBeInTheDocument();

    // 8 resize handles
    for (const dir of ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']) {
      expect(screen.getByTestId(`resize-handle-${dir}`)).toBeInTheDocument();
    }
  });

  it('renders nothing when multiple objects selected', () => {
    const objects = [
      makeObject('a', 0, 0, 100, 100),
      makeObject('b', 50, 50, 100, 100),
    ];
    const { container } = render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={['a', 'b']}
        viewport={defaultViewport}
        canvasId="canvas1"
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('positions handles at correct screen position', () => {
    const objects = [makeObject('a', 10, 20, 100, 80)];
    render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={['a']}
        viewport={defaultViewport}
        canvasId="canvas1"
      />
    );

    const handles = screen.getByTestId('transform-handles');
    // worldToScreen(10, 20, {x:0, y:0, zoom:1}) = (10, 20)
    expect(handles.style.left).toBe('10px');
    expect(handles.style.top).toBe('20px');
    expect(handles.style.width).toBe('100px');
    expect(handles.style.height).toBe('80px');
  });

  it('applies zoom to handle position and size', () => {
    const objects = [makeObject('a', 10, 20, 100, 80)];
    const viewport: UIEditorViewport = { x: 0, y: 0, zoom: 2 };
    render(
      <TransformHandles
        objects={objects}
        selectedObjectIds={['a']}
        viewport={viewport}
        canvasId="canvas1"
      />
    );

    const handles = screen.getByTestId('transform-handles');
    // worldToScreen(10, 20, {x:0, y:0, zoom:2}) = (20, 40)
    expect(handles.style.left).toBe('20px');
    expect(handles.style.top).toBe('40px');
    // screenW = 100 * 1 * 2 = 200, screenH = 80 * 1 * 2 = 160
    expect(handles.style.width).toBe('200px');
    expect(handles.style.height).toBe('160px');
  });
});
