/**
 * mapEditorSlice のテスト
 */
import { createMapEditorSlice, MapEditorSlice } from './mapEditorSlice';

// テスト用のスタンドアロンストアを作る
function makeSlice() {
  let state: MapEditorSlice = createMapEditorSlice(
    (fn) => {
      fn(state as MapEditorSlice);
    },
    () => state as MapEditorSlice
  );
  const set = (fn: (s: MapEditorSlice) => void) => {
    fn(state);
  };
  state = createMapEditorSlice(set, () => state);
  return { get: () => state, set };
}

describe('mapEditorSlice', () => {
  it('初期値が正しい', () => {
    const { get } = makeSlice();
    expect(get().currentTool).toBe('pen');
    expect(get().selectedChipId).toBeNull();
    expect(get().viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(get().showGrid).toBe(true);
  });

  it('setTool でツールを変更できる', () => {
    const { get } = makeSlice();
    get().setTool('eraser');
    expect(get().currentTool).toBe('eraser');
  });

  it('selectChip でチップを選択できる', () => {
    const { get } = makeSlice();
    get().selectChip('cs1:0');
    expect(get().selectedChipId).toBe('cs1:0');
  });

  it('selectChipRange で範囲選択できる', () => {
    const { get } = makeSlice();
    const range = {
      chipsetId: 'cs1',
      startCol: 0,
      startRow: 0,
      width: 2,
      height: 2,
      cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
    };
    get().selectChipRange(range);
    expect(get().selectedChipRange).toEqual(range);
  });

  it('selectChipRange は selectedChipId を変更しない（表示中チップセットの情報を保つため）', () => {
    const { get } = makeSlice();
    const range = {
      chipsetId: 'cs1',
      startCol: 0,
      startRow: 0,
      width: 2,
      height: 2,
      cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
    };

    get().selectChip('cs1:5');
    get().selectChipRange(range);
    expect(get().selectedChipId).toBe('cs1:5');
  });

  it('selectChip は selectedChipRange をクリアする', () => {
    const { get } = makeSlice();
    const range = {
      chipsetId: 'cs1',
      startCol: 0,
      startRow: 0,
      width: 2,
      height: 2,
      cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
    };

    get().selectChipRange(range);
    get().selectChip('cs1:0');
    expect(get().selectedChipRange).toBeNull();
  });

  it('setViewport で部分更新できる', () => {
    const { get } = makeSlice();
    get().setViewport({ zoom: 2 });
    expect(get().viewport).toEqual({ x: 0, y: 0, zoom: 2 });
  });

  it('toggleGrid で切り替えできる', () => {
    const { get } = makeSlice();
    get().toggleGrid();
    expect(get().showGrid).toBe(false);
    get().toggleGrid();
    expect(get().showGrid).toBe(true);
  });

  it('setObjectFrameColor で色を変更できる', () => {
    const { get } = makeSlice();
    get().setObjectFrameColor('#ff0000');
    expect(get().objectFrameColor).toBe('#ff0000');
  });

  it('selectPrefabForPlacement で配置用プレハブを選択できる', () => {
    const { get } = makeSlice();
    get().selectPrefabForPlacement('prefab-1');
    expect(get().selectedPrefabId).toBe('prefab-1');
  });
});
