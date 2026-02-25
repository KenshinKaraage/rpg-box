import { render, screen } from '@testing-library/react';
import MapEditPage from './page';

describe('MapEditPage', () => {
  it('3カラムレイアウトをレンダリングする', () => {
    render(<MapEditPage />);
    // 左パネルのタブ
    expect(screen.getByRole('tab', { name: /マップ/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /チップセット/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /オブジェクト/ })).toBeInTheDocument();
  });
});
