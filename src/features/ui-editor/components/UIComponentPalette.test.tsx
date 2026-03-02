import { render, screen, fireEvent } from '@testing-library/react';
import { UIComponentPalette } from './UIComponentPalette';
import { useStore } from '@/stores';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import { getAllUIComponents } from '@/types/ui';
import type { EditorUIObject, EditorUICanvas } from '@/stores/uiEditorSlice';
import '@/types/ui/register';

function makeObject(
  id: string,
  components: { type: string; data: unknown }[] = []
): EditorUIObject {
  return {
    id,
    name: id,
    transform: createDefaultRectTransform(),
    components,
  };
}

function setupStore(options: {
  objects?: EditorUIObject[];
  selectedObjectIds?: string[];
} = {}) {
  const canvas: EditorUICanvas = {
    id: 'canvas1',
    name: 'Test',
    objects: options.objects ?? [],
    functions: [],
  };
  useStore.getState().uiCanvases.forEach((c) => useStore.getState().deleteUICanvas(c.id));
  useStore.getState().addUICanvas(canvas);
  useStore.getState().selectUICanvas('canvas1');
  useStore.getState().selectUIObjects(options.selectedObjectIds ?? []);
}

describe('UIComponentPalette', () => {
  beforeEach(() => {
    useStore.getState().uiCanvases.forEach((c) => useStore.getState().deleteUICanvas(c.id));
    useStore.getState().selectUIObjects([]);
    useStore.getState().selectUICanvas(null);
  });

  it('shows empty state when no object selected', () => {
    setupStore();
    render(<UIComponentPalette />);
    expect(screen.getByTestId('component-palette-empty')).toBeInTheDocument();
  });

  it('shows all registered components when object is selected', () => {
    setupStore({ objects: [makeObject('a')], selectedObjectIds: ['a'] });
    render(<UIComponentPalette />);

    expect(screen.getByTestId('component-palette')).toBeInTheDocument();

    // Every registered component should have a palette item
    const allTypes = getAllUIComponents().map(([type]) => type);
    for (const type of allTypes) {
      expect(screen.getByTestId(`palette-item-${type}`)).toBeInTheDocument();
    }
  });

  it('disables already-attached components', () => {
    setupStore({
      objects: [makeObject('a', [{ type: 'shape', data: {} }])],
      selectedObjectIds: ['a'],
    });
    render(<UIComponentPalette />);

    expect(screen.getByTestId('palette-item-shape')).toBeDisabled();
    expect(screen.getByTestId('palette-item-image')).not.toBeDisabled();
  });

  it('adds component on click', () => {
    setupStore({ objects: [makeObject('a')], selectedObjectIds: ['a'] });
    render(<UIComponentPalette />);

    fireEvent.click(screen.getByTestId('palette-item-image'));

    const canvas = useStore.getState().uiCanvases.find((c) => c.id === 'canvas1');
    const obj = canvas?.objects.find((o) => o.id === 'a');
    expect(obj?.components).toHaveLength(1);
    expect(obj?.components[0]?.type).toBe('image');
  });

  it('shows labels from component instances', () => {
    setupStore({ objects: [makeObject('a')], selectedObjectIds: ['a'] });
    render(<UIComponentPalette />);

    // Check a few known labels
    expect(screen.getByText('画像')).toBeInTheDocument(); // ImageComponent label
    expect(screen.getByText('テキスト')).toBeInTheDocument(); // TextComponent label
    expect(screen.getByText('図形')).toBeInTheDocument(); // ShapeComponent label
  });
});
