import { render, screen, fireEvent } from '@testing-library/react';
import { MapToolbar } from './MapToolbar';

describe('MapToolbar', () => {
  const props = {
    currentTool: 'pen' as const,
    onSetTool: jest.fn(),
    showGrid: true,
    onToggleGrid: jest.fn(),
    zoom: 1,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    canUndo: true,
    canRedo: true,
    onUndo: jest.fn(),
    onRedo: jest.fn(),
  };

  it('ツールボタンを表示する', () => {
    render(<MapToolbar {...props} />);
    expect(screen.getByRole('button', { name: /ペン/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /消しゴム/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /塗りつぶし/ })).toBeInTheDocument();
  });

  it('ツールクリックで onSetTool が呼ばれる', () => {
    render(<MapToolbar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /消しゴム/ }));
    expect(props.onSetTool).toHaveBeenCalledWith('eraser');
  });

  it('グリッドトグルで onToggleGrid が呼ばれる', () => {
    render(<MapToolbar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /グリッド/ }));
    expect(props.onToggleGrid).toHaveBeenCalled();
  });

  it('元に戻す/やり直すボタンで onUndo/onRedo が呼ばれる', () => {
    render(<MapToolbar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /元に戻す/ }));
    expect(props.onUndo).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /やり直す/ }));
    expect(props.onRedo).toHaveBeenCalled();
  });

  it('canUndo/canRedo が false のときボタンが無効化される', () => {
    render(<MapToolbar {...props} canUndo={false} canRedo={false} />);
    expect(screen.getByRole('button', { name: /元に戻す/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /やり直す/ })).toBeDisabled();
  });
});
