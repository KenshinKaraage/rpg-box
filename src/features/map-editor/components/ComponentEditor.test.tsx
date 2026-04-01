import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentEditor } from './ComponentEditor';
import type { Prefab } from '@/types/map';
import type { Component, ComponentPanelProps } from '@/types/components/Component';

// Component をモック
function mockComponent(type: string, label: string): Component {
  return {
    type,
    label,
    serialize: () => ({}),
    deserialize: () => {},
    clone: () => mockComponent(type, label),
    renderPropertyPanel: (props: ComponentPanelProps) => null,
  } as unknown as Component;
}

// getAllComponents をモック
jest.mock('@/types/components', () => ({
  getAllComponents: () => [
    ['transform', class { type = 'transform'; label = 'Transform'; }],
    ['collider', class { type = 'collider'; label = 'Collider'; }],
  ],
}));

const makePrefab = (components: Component[] = []): Prefab => ({
  id: 'p1',
  name: 'スライム',
  prefab: { components },
});

const noop = () => {};

describe('ComponentEditor', () => {
  it('プレハブが null の場合に選択促進メッセージを表示する', () => {
    render(<ComponentEditor prefab={null} onUpdatePrefab={noop} />);
    expect(screen.getByText('プレハブを選択してください')).toBeInTheDocument();
  });

  it('プレハブ名とコンポーネント数を表示する', () => {
    const prefab = makePrefab([mockComponent('transform', 'Transform')]);
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={noop} />);
    expect(screen.getByText('スライム')).toBeInTheDocument();
    expect(screen.getByText('1 コンポーネント')).toBeInTheDocument();
  });

  it('コンポーネントが空の場合にメッセージを表示する', () => {
    render(<ComponentEditor prefab={makePrefab()} onUpdatePrefab={noop} />);
    expect(screen.getByText('コンポーネントがありません')).toBeInTheDocument();
  });

  it('コンポーネント削除ボタンを押すと onUpdatePrefab が呼ばれる', () => {
    const prefab = makePrefab([
      mockComponent('transform', 'Transform'),
      mockComponent('collider', 'Collider'),
    ]);
    const onUpdatePrefab = jest.fn();
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={onUpdatePrefab} />);

    const deleteButtons = screen.getAllByRole('button', { name: /を削除/ });
    fireEvent.click(deleteButtons[0]!);

    expect(onUpdatePrefab).toHaveBeenCalledWith('p1', {
      prefab: { components: [expect.objectContaining({ type: 'collider' })] },
    });
  });
});
