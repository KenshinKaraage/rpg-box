import { render, screen, fireEvent } from '@testing-library/react';
import { MapObjectList } from './MapObjectList';
import type { MapObject } from '@/types/map';

const objects: MapObject[] = [
  { id: 'o1', name: 'NPC', components: [], prefabId: 'p1' },
  { id: 'o2', name: '宝箱', components: [] },
];

describe('MapObjectList', () => {
  it('オブジェクト名を表示する', () => {
    render(
      <MapObjectList
        objects={objects}
        selectedObjectId={null}
        onSelectObject={jest.fn()}
        onDeleteObject={jest.fn()}
      />
    );
    expect(screen.getByText('NPC')).toBeInTheDocument();
    expect(screen.getByText('宝箱')).toBeInTheDocument();
  });

  it('クリックで onSelectObject が呼ばれる', () => {
    const onSelect = jest.fn();
    render(
      <MapObjectList
        objects={objects}
        selectedObjectId={null}
        onSelectObject={onSelect}
        onDeleteObject={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('NPC'));
    expect(onSelect).toHaveBeenCalledWith('o1');
  });

  it('削除ボタンで onDeleteObject が呼ばれる', () => {
    const onDelete = jest.fn();
    render(
      <MapObjectList
        objects={objects}
        selectedObjectId={null}
        onSelectObject={jest.fn()}
        onDeleteObject={onDelete}
      />
    );
    const deleteBtns = screen.getAllByRole('button', { name: /削除/ });
    fireEvent.click(deleteBtns[0]!);
    expect(onDelete).toHaveBeenCalledWith('o1');
  });
});
