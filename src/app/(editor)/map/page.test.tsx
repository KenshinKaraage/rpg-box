import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/common/Toast';
import MapEditPage from './page';

describe('MapEditPage', () => {
  it('3カラムレイアウトをレンダリングする', () => {
    render(
      <ToastProvider>
        <MapEditPage />
      </ToastProvider>
    );
    // 左パネルのタブ
    expect(screen.getByRole('tab', { name: /マップ/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /チップセット/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /オブジェクト/ })).toBeInTheDocument();
  });
});
