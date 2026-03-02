import { render, screen } from '@testing-library/react';
import { UICanvas } from './UICanvas';

// WebGL はモックできないので DOM 構造の確認のみ
describe('UICanvas', () => {
  it('canvas 要素をレンダリングする', () => {
    render(<UICanvas />);
    expect(screen.getByTestId('ui-canvas')).toBeInTheDocument();
  });

  it('DOM オーバーレイコンテナをレンダリングする', () => {
    render(<UICanvas />);
    expect(screen.getByTestId('ui-canvas-overlay')).toBeInTheDocument();
  });

  it('コンテナ要素をレンダリングする', () => {
    render(<UICanvas />);
    expect(screen.getByTestId('ui-canvas-container')).toBeInTheDocument();
  });
});
