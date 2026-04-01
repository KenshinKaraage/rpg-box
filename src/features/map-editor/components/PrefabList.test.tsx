import { render, screen, fireEvent } from '@testing-library/react';
import { PrefabList } from './PrefabList';
import type { Prefab } from '@/types/map';

const prefabs: Prefab[] = [
  { id: 'p1', name: 'スライム', prefab: { components: [] } },
  { id: 'p2', name: 'ドラゴン', prefab: { components: [] } },
];

const noop = () => {};

describe('PrefabList', () => {
  it('プレハブ一覧を表示する', () => {
    render(
      <PrefabList
        prefabs={prefabs}
        selectedId={null}
        onSelect={noop}
        onAdd={noop}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    expect(screen.getByText('スライム')).toBeInTheDocument();
    expect(screen.getByText('ドラゴン')).toBeInTheDocument();
  });

  it('プレハブが空の場合にメッセージを表示する', () => {
    render(
      <PrefabList
        prefabs={[]}
        selectedId={null}
        onSelect={noop}
        onAdd={noop}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    expect(screen.getByText('プレハブがありません')).toBeInTheDocument();
  });

  it('コンポーネント数を表示する', () => {
    render(
      <PrefabList
        prefabs={prefabs}
        selectedId={null}
        onSelect={noop}
        onAdd={noop}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    expect(screen.getAllByText('0 コンポーネント')).toHaveLength(2);
  });

  it('プレハブをクリックすると onSelect が呼ばれる', () => {
    const onSelect = jest.fn();
    render(
      <PrefabList
        prefabs={prefabs}
        selectedId={null}
        onSelect={onSelect}
        onAdd={noop}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    fireEvent.click(screen.getByTestId('prefab-item-p1'));

    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('追加ボタンをクリックすると onAdd が呼ばれる', () => {
    const onAdd = jest.fn();
    render(
      <PrefabList
        prefabs={prefabs}
        selectedId={null}
        onSelect={noop}
        onAdd={onAdd}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    fireEvent.click(screen.getByTestId('add-prefab-button'));

    expect(onAdd).toHaveBeenCalled();
  });

  it('選択中のプレハブにハイライトがつく', () => {
    render(
      <PrefabList
        prefabs={prefabs}
        selectedId="p1"
        onSelect={noop}
        onAdd={noop}
        onDelete={noop}
        onDuplicate={noop}
      />
    );

    expect(screen.getByTestId('prefab-item-p1')).toHaveClass('bg-accent');
  });
});
