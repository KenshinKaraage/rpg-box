import { render, screen } from '@testing-library/react';
import { PrefabPreview } from './PrefabPreview';
import type { Prefab } from '@/types/map';

const prefab: Prefab = {
  id: 'p1',
  name: 'スライム',
  prefab: { components: [] },
};

describe('PrefabPreview', () => {
  it('プレハブが null の場合に選択促進メッセージを表示する', () => {
    render(<PrefabPreview prefab={null} />);

    expect(screen.getByText('プレハブを選択してください')).toBeInTheDocument();
  });

  it('プレハブ名を表示する', () => {
    render(<PrefabPreview prefab={prefab} />);

    expect(screen.getByTestId('prefab-preview-placeholder')).toHaveTextContent('スライム');
  });
});
