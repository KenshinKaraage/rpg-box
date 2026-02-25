import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useMapShortcuts } from './useMapShortcuts';

describe('useMapShortcuts', () => {
  it('B キーで onSetTool(pen) が呼ばれる', () => {
    const onSetTool = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool, onUndo: jest.fn(), onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'b' });
    expect(onSetTool).toHaveBeenCalledWith('pen');
  });

  it('E キーで onSetTool(eraser) が呼ばれる', () => {
    const onSetTool = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool, onUndo: jest.fn(), onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'e' });
    expect(onSetTool).toHaveBeenCalledWith('eraser');
  });

  it('Ctrl+Z で onUndo が呼ばれる', () => {
    const onUndo = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool: jest.fn(), onUndo, onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalled();
  });
});
