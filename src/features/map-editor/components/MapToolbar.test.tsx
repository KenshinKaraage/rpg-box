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
});
