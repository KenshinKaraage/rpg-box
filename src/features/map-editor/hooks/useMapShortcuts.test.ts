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

  it('Ctrl+C で onCopy が呼ばれる', () => {
    const onCopy = jest.fn();
    renderHook(() =>
      useMapShortcuts({ onSetTool: jest.fn(), onUndo: jest.fn(), onRedo: jest.fn(), onCopy })
    );
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(onCopy).toHaveBeenCalled();
  });

  it('Ctrl+V で onPaste が呼ばれる', () => {
    const onPaste = jest.fn();
    renderHook(() =>
      useMapShortcuts({ onSetTool: jest.fn(), onUndo: jest.fn(), onRedo: jest.fn(), onPaste })
    );
    fireEvent.keyDown(window, { key: 'v', ctrlKey: true });
    expect(onPaste).toHaveBeenCalled();
  });

  it('Delete で onDelete が呼ばれる', () => {
    const onDelete = jest.fn();
    renderHook(() =>
      useMapShortcuts({ onSetTool: jest.fn(), onUndo: jest.fn(), onRedo: jest.fn(), onDelete })
    );
    fireEvent.keyDown(window, { key: 'Delete' });
    expect(onDelete).toHaveBeenCalled();
  });

  it('Backspace でも onDelete が呼ばれる', () => {
    const onDelete = jest.fn();
    renderHook(() =>
      useMapShortcuts({ onSetTool: jest.fn(), onUndo: jest.fn(), onRedo: jest.fn(), onDelete })
    );
    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(onDelete).toHaveBeenCalled();
  });
});
