/**
 * editorSlice のテスト
 */
import { createEditorSlice, EditorSlice } from './editorSlice';

// テスト用: EditorSlice に任意のページ状態フィールドを足したストア
interface TestState extends EditorSlice {
  foo: string;
  bar: number;
}

function makeSlice() {
  const set = (fn: (s: TestState) => void) => {
    fn(state);
  };
  const state: TestState = {
    ...(createEditorSlice<TestState>(set) as TestState),
    foo: 'initial',
    bar: 0,
  };
  return { get: () => state, set };
}

describe('editorSlice', () => {
  it('初期値が正しい', () => {
    const { get } = makeSlice();
    expect(get().currentPage).toBe('');
    expect(get().unsavedChanges).toBe(false);
    expect(get().undoStacks).toEqual({});
    expect(get().redoStacks).toEqual({});
  });

  it('setCurrentPage / markUnsaved / markSaved が動作する', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    expect(get().currentPage).toBe('map');

    get().markUnsaved();
    expect(get().unsavedChanges).toBe(true);

    get().markSaved();
    expect(get().unsavedChanges).toBe(false);
  });

  it('pushUndoState は履歴を積み、redo履歴をクリアする', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().pushUndoState('map', { foo: 'initial' });
    expect(get().undoStacks['map']).toHaveLength(1);

    get().redoStacks['map'] = [{ foo: 'stale' }];
    get().pushUndoState('map', { foo: 'second' });
    expect(get().redoStacks['map']).toEqual([]);
  });

  it('pushUndoState は100件を超えたら古いものを捨てる', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    for (let i = 0; i < 101; i++) {
      get().pushUndoState('map', { foo: `state-${i}` });
    }
    expect(get().undoStacks['map']).toHaveLength(100);
    expect(get().undoStacks['map']![0]).toEqual({ foo: 'state-1' });
  });

  it('undo は currentPage の状態を復元し、redo で戻せる', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().foo = 'A';
    get().pushUndoState('map', { foo: 'A' });
    get().foo = 'B';

    get().undo();
    expect(get().foo).toBe('A');
    expect(get().redoStacks['map']).toHaveLength(1);

    get().redo();
    expect(get().foo).toBe('B');
  });

  it('undoStack が空なら undo は何もしない', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().foo = 'unchanged';
    get().undo();
    expect(get().foo).toBe('unchanged');
  });

  it('redoStack が空なら redo は何もしない', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().foo = 'unchanged';
    get().redo();
    expect(get().foo).toBe('unchanged');
  });

  it('ページごとに履歴が独立している', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().pushUndoState('map', { foo: 'map-state' });

    get().setCurrentPage('data');
    expect(get().undoStacks['data']).toBeUndefined();
    get().foo = 'unchanged-on-data-page';
    get().undo();
    expect(get().foo).toBe('unchanged-on-data-page');

    get().setCurrentPage('map');
    expect(get().undoStacks['map']).toHaveLength(1);
  });

  it('hydratePageHistory はページの undo/redo スタックを丸ごと置き換える', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().pushUndoState('map', { foo: 'stale' }); // 既存の履歴は上書きされる想定

    get().hydratePageHistory('map', [{ foo: 'loaded-undo' }], [{ foo: 'loaded-redo' }]);

    expect(get().undoStacks['map']).toEqual([{ foo: 'loaded-undo' }]);
    expect(get().redoStacks['map']).toEqual([{ foo: 'loaded-redo' }]);
  });

  it('hydratePageHistory は他のページの履歴に影響しない', () => {
    const { get } = makeSlice();
    get().setCurrentPage('data');
    get().pushUndoState('data', { foo: 'data-state' });

    get().hydratePageHistory('map', [{ foo: 'map-loaded' }], []);

    expect(get().undoStacks['data']).toEqual([{ foo: 'data-state' }]);
    expect(get().undoStacks['map']).toEqual([{ foo: 'map-loaded' }]);
  });

  it('複数フィールドのスナップショットを丸ごと復元できる', () => {
    const { get } = makeSlice();
    get().setCurrentPage('map');
    get().foo = 'A';
    get().bar = 1;
    get().pushUndoState('map', { foo: 'A', bar: 1 });
    get().foo = 'B';
    get().bar = 2;

    get().undo();
    expect(get().foo).toBe('A');
    expect(get().bar).toBe(1);
  });
});
