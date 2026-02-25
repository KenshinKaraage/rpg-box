import { createMapEditorSlice } from './mapEditorSlice';

// テスト用のスタンドアロンストアを作る
function makeSlice() {
  let state = createMapEditorSlice(
    (fn) => {
      fn(state);
    },
    () => state
  );
  const set = (fn: (s: typeof state) => void) => {
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
    expect(get().undoStack).toHaveLength(0);
    expect(get().redoStack).toHaveLength(0);
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

  it('pushUndo → undo → redo が動作する', () => {
    const { get } = makeSlice();
    const action = {
      type: 'setTile' as const,
      mapId: 'm1',
      layerId: 'l1',
      x: 0,
      y: 0,
      prev: '',
      next: 'cs1:0',
    };
    get().pushUndo(action);
    expect(get().undoStack).toHaveLength(1);
    expect(get().redoStack).toHaveLength(0);

    const popped = get().popUndo();
    expect(popped).toEqual(action);
    expect(get().undoStack).toHaveLength(0);

    get().pushRedo(action);
    expect(get().redoStack).toHaveLength(1);

    const repopped = get().popRedo();
    expect(repopped).toEqual(action);
    expect(get().redoStack).toHaveLength(0);
  });

  it('pushUndo は undoStack が 100 件を超えたら古いものを捨てる', () => {
    const { get } = makeSlice();
    for (let i = 0; i < 101; i++) {
      get().pushUndo({
        type: 'setTile',
        mapId: 'm1',
        layerId: 'l1',
        x: i,
        y: 0,
        prev: '',
        next: 'cs1:0',
      });
    }
    expect(get().undoStack).toHaveLength(100);
  });

  it('pushUndo は redoStack をクリアする', () => {
    const { get } = makeSlice();
    get().pushRedo({
      type: 'setTile',
      mapId: 'm1',
      layerId: 'l1',
      x: 0,
      y: 0,
      prev: '',
      next: 'cs1:0',
    });
    get().pushUndo({
      type: 'setTile',
      mapId: 'm1',
      layerId: 'l1',
      x: 1,
      y: 0,
      prev: '',
      next: 'cs1:1',
    });
    expect(get().redoStack).toHaveLength(0);
  });
});
