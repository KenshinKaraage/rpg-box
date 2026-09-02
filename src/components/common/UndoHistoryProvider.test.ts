/**
 * UndoHistoryProvider の純粋関数のテスト
 * （IndexedDB連携・subscribe副作用のあるコンポーネント本体は AutoSaveProvider と同様にテスト対象外）
 */
import { encodeUndoHistory, decodeUndoHistory, hydratePartialState } from './UndoHistoryProvider';
import { TransformComponent } from '@/types/components/TransformComponent';

describe('encodeUndoHistory / decodeUndoHistory', () => {
  it('undoStackのみの場合、statesはそのままでcurrentIndexは末尾', () => {
    const history = encodeUndoHistory(['a', 'b', 'c'], []);
    expect(history).toEqual({ states: ['a', 'b', 'c'], currentIndex: 3 });
  });

  it('redoStackがある場合、逆順にしてstatesの後ろに繋げる', () => {
    // redoStack は直近にundoしたものが末尾（['直近', 'その次', '一番未来']の逆順で積まれている）
    const history = encodeUndoHistory(['a', 'b'], ['direct-next', 'further-future']);
    expect(history).toEqual({
      states: ['a', 'b', 'further-future', 'direct-next'],
      currentIndex: 2,
    });
  });

  it('往復変換で元のundoStack/redoStackに戻る', () => {
    const undoStack = ['a', 'b', 'c'];
    const redoStack = ['y', 'z'];
    const decoded = decodeUndoHistory(encodeUndoHistory(undoStack, redoStack));
    expect(decoded).toEqual({ undoStack, redoStack });
  });

  it('空の履歴も往復変換できる', () => {
    const decoded = decodeUndoHistory(encodeUndoHistory([], []));
    expect(decoded).toEqual({ undoStack: [], redoStack: [] });
  });

  it('currentIndexが範囲外でもクランプして安全に変換する', () => {
    expect(decodeUndoHistory({ states: ['a', 'b'], currentIndex: 99 })).toEqual({
      undoStack: ['a', 'b'],
      redoStack: [],
    });
    expect(decodeUndoHistory({ states: ['a', 'b'], currentIndex: -1 })).toEqual({
      undoStack: [],
      redoStack: ['b', 'a'],
    });
  });
});

describe('hydratePartialState', () => {
  it('該当キーがなければそのまま返す', () => {
    const snapshot = { foo: 'bar', count: 1 };
    expect(hydratePartialState(snapshot)).toEqual(snapshot);
  });

  it('maps がプレーンなオブジェクトでも Component インスタンスへ復元する', () => {
    const plainTransform = {
      type: 'transform',
      x: 3,
      y: 4,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    const snapshot = {
      maps: [
        {
          id: 'm1',
          name: 'test',
          layers: [
            {
              id: 'l1',
              type: 'object',
              objects: [{ id: 'o1', name: 'obj', components: [plainTransform] }],
            },
          ],
        },
      ],
    };

    const result = hydratePartialState(snapshot);
    const maps = result.maps as Array<{
      layers: Array<{ objects: Array<{ components: TransformComponent[] }> }>;
    }>;
    const restoredComponent = maps[0]!.layers[0]!.objects[0]!.components[0]!;
    expect(restoredComponent).toBeInstanceOf(TransformComponent);
    expect(restoredComponent.x).toBe(3);
    expect(restoredComponent.y).toBe(4);
  });

  it('無関係なキー（dataEntries等）は変更しない', () => {
    const snapshot = { dataEntries: { a: [{ id: 'e1', values: {} }] } };
    expect(hydratePartialState(snapshot)).toEqual(snapshot);
  });
});
