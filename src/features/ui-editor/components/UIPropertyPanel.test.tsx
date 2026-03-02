import { render, screen, fireEvent } from '@testing-library/react';
import { UIPropertyPanel } from './UIPropertyPanel';
import { useStore } from '@/stores';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject, EditorUICanvas } from '@/stores/uiEditorSlice';
import '@/types/ui/register';

function makeObject(id: string, name: string, components: { type: string; data: unknown }[] = []): EditorUIObject {
  return {
    id,
    name,
    transform: { ...createDefaultRectTransform(), x: 10, y: 20, width: 100, height: 50 },
    components,
  };
}

function setupStore(options: {
  objects?: EditorUIObject[];
  selectedObjectIds?: string[];
  selectedCanvasId?: string | null;
} = {}) {
  const canvas: EditorUICanvas = {
    id: 'canvas1',
    name: 'Test Canvas',
    objects: options.objects ?? [],
    functions: [],
  };
  const state = useStore.getState();
  // Reset
  state.uiCanvases.forEach((c) => useStore.getState().deleteUICanvas(c.id));
  useStore.getState().addUICanvas(canvas);
  useStore.getState().selectUICanvas(options.selectedCanvasId ?? 'canvas1');
  useStore.getState().selectUIObjects(options.selectedObjectIds ?? []);
}

describe('UIPropertyPanel', () => {
  beforeEach(() => {
    // Reset store
    const state = useStore.getState();
    state.uiCanvases.forEach((c) => useStore.getState().deleteUICanvas(c.id));
    useStore.getState().selectUIObjects([]);
    useStore.getState().selectUICanvas(null);
  });

  it('shows empty state when no object is selected', () => {
    setupStore();
    render(<UIPropertyPanel />);
    expect(screen.getByTestId('property-panel-empty')).toBeInTheDocument();
    expect(screen.getByText('オブジェクトを選択してください')).toBeInTheDocument();
  });

  it('shows multi-select message when multiple objects selected', () => {
    const objects = [makeObject('a', 'Obj A'), makeObject('b', 'Obj B')];
    setupStore({ objects, selectedObjectIds: ['a', 'b'] });
    render(<UIPropertyPanel />);
    expect(screen.getByText('複数のオブジェクトが選択されています')).toBeInTheDocument();
  });

  it('shows transform editor for selected object', () => {
    const objects = [makeObject('a', 'TestObj')];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    expect(screen.getByTestId('property-panel')).toBeInTheDocument();
    expect(screen.getByTestId('transform-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TestObj')).toBeInTheDocument();
  });

  it('shows object name and allows editing', () => {
    const objects = [makeObject('a', 'OriginalName')];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    const nameInput = screen.getByDisplayValue('OriginalName');
    fireEvent.change(nameInput, { target: { value: 'NewName' } });

    // Verify store was updated
    const canvas = useStore.getState().uiCanvases.find((c) => c.id === 'canvas1');
    const obj = canvas?.objects.find((o) => o.id === 'a');
    expect(obj?.name).toBe('NewName');
  });

  it('shows transform fields with correct values', () => {
    const objects = [makeObject('a', 'Obj')];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    // Check X and Y position values
    const inputs = screen.getAllByRole('spinbutton');
    const values = inputs.map((i) => (i as HTMLInputElement).value);
    // x=10, y=20, w=100, h=50 should be among the values
    expect(values).toContain('10');
    expect(values).toContain('20');
    expect(values).toContain('100');
    expect(values).toContain('50');
  });

  it('shows components list when object has components', () => {
    const objects = [makeObject('a', 'Obj', [{ type: 'shape', data: {} }])];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    expect(screen.getByTestId('component-item-shape')).toBeInTheDocument();
  });

  it('shows empty component message when no components', () => {
    const objects = [makeObject('a', 'Obj')];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    expect(screen.getByText('コンポーネントなし')).toBeInTheDocument();
  });

  it('removes component when delete button clicked', () => {
    const objects = [makeObject('a', 'Obj', [{ type: 'shape', data: {} }])];
    setupStore({ objects, selectedObjectIds: ['a'] });
    render(<UIPropertyPanel />);

    const deleteBtn = screen.getByRole('button', { name: /削除/ });
    fireEvent.click(deleteBtn);

    const canvas = useStore.getState().uiCanvases.find((c) => c.id === 'canvas1');
    const obj = canvas?.objects.find((o) => o.id === 'a');
    expect(obj?.components).toHaveLength(0);
  });
});
