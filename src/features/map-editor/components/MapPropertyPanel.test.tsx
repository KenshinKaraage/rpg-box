import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '@/stores';
import { MapPropertyPanel } from './MapPropertyPanel';
import { createDefaultMap } from '../utils/createDefaultMap';
import { TransformComponent } from '@/types/components/TransformComponent';
import type { MapObject } from '@/types/map';

describe('MapPropertyPanel', () => {
  it('オブジェクト未選択時は「選択なし」を表示', () => {
    render(<MapPropertyPanel selectedObjectId={null} mapId="m1" layerId="l1" />);
    expect(screen.getByText(/オブジェクトを選択/)).toBeInTheDocument();
  });

  function seedObject() {
    const transform = new TransformComponent();
    transform.x = 1;
    transform.y = 1;
    const obj: MapObject = { id: 'obj1', name: 'テストオブジェクト', components: [transform] };
    const map = createDefaultMap([]);
    const objectLayer = map.layers.find((l) => l.type === 'object')!;
    objectLayer.objects = [obj];

    useStore.setState({
      maps: [map],
      selectedMapId: map.id,
      currentPage: 'map',
      undoStacks: {},
      redoStacks: {},
    });
    return { mapId: map.id, layerId: objectLayer.id, objectId: obj.id };
  }

  describe('Undo連続入力のバッチ化', () => {
    it('同じフィールドへの連続した onChange は Undo を1件だけ積む', () => {
      const { mapId, layerId, objectId } = seedObject();
      render(<MapPropertyPanel selectedObjectId={objectId} mapId={mapId} layerId={layerId} />);

      const xInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement; // X欄
      fireEvent.change(xInput, { target: { value: '5' } });
      fireEvent.change(xInput, { target: { value: '50' } });
      fireEvent.change(xInput, { target: { value: '500' } });

      expect(useStore.getState().undoStacks['map']).toHaveLength(1);
    });

    it('Undoを1回実行すると編集前の値に戻る（バッチ化されているため）', () => {
      const { mapId, layerId, objectId } = seedObject();
      render(<MapPropertyPanel selectedObjectId={objectId} mapId={mapId} layerId={layerId} />);

      const xInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement; // X欄
      fireEvent.change(xInput, { target: { value: '5' } });
      fireEvent.change(xInput, { target: { value: '50' } });
      fireEvent.change(xInput, { target: { value: '500' } });

      useStore.getState().undo();

      const restoredObj = useStore
        .getState()
        .maps[0]!.layers.find((l) => l.id === layerId)!
        .objects!.find((o) => o.id === objectId)!;
      const transform = restoredObj.components[0] as unknown as { x: number };
      expect(transform.x).toBe(1); // 編集前の値
    });

    it('フォーカスが外れてから再度編集すると別のUndoが積まれる', () => {
      const { mapId, layerId, objectId } = seedObject();
      render(<MapPropertyPanel selectedObjectId={objectId} mapId={mapId} layerId={layerId} />);

      const xInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement; // X欄
      fireEvent.change(xInput, { target: { value: '5' } });
      fireEvent.blur(xInput);
      fireEvent.change(xInput, { target: { value: '9' } });

      expect(useStore.getState().undoStacks['map']).toHaveLength(2);
    });
  });
});
