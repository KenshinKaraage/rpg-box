import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentEditor } from './ComponentEditor';
import type { Prefab } from '@/types/map';
import { TransformComponent } from '@/types/components/TransformComponent';
import { MovementComponent } from '@/types/components/MovementComponent';
import '@/types/components/register';

const makePrefab = (overrides?: Partial<Prefab>): Prefab => ({
  id: 'p1',
  name: 'スライム',
  components: [],
  ...overrides,
});

const noop = () => {};

describe('ComponentEditor', () => {
  it('プレハブが null の場合に選択促進メッセージを表示する', () => {
    render(<ComponentEditor prefab={null} onUpdatePrefab={noop} />);

    expect(screen.getByText('プレハブを選択してください')).toBeInTheDocument();
  });

  it('プレハブ名とコンポーネント数を表示する', () => {
    const prefab = makePrefab({ components: [new TransformComponent()] });
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={noop} />);

    expect(screen.getByText('スライム')).toBeInTheDocument();
    expect(screen.getByText('1 コンポーネント')).toBeInTheDocument();
  });

  it('コンポーネントが空の場合にメッセージを表示する', () => {
    render(<ComponentEditor prefab={makePrefab()} onUpdatePrefab={noop} />);

    expect(screen.getByText('コンポーネントがありません')).toBeInTheDocument();
  });

  it('コンポーネントのプロパティパネルを表示する', () => {
    const prefab = makePrefab({ components: [new TransformComponent()] });
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={noop} />);

    expect(screen.getByTestId('component-transform')).toBeInTheDocument();
  });

  it('コンポーネント削除ボタンを押すと onUpdatePrefab が呼ばれる', () => {
    const transform = new TransformComponent();
    const movement = new MovementComponent();
    const prefab = makePrefab({ components: [transform, movement] });
    const onUpdatePrefab = jest.fn();
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={onUpdatePrefab} />);

    fireEvent.click(screen.getByTestId('delete-component-transform'));

    expect(onUpdatePrefab).toHaveBeenCalledWith('p1', {
      components: expect.arrayContaining([expect.objectContaining({ type: 'movement' })]),
    });
    const [, updates] = onUpdatePrefab.mock.calls[0];
    expect(updates.components).toHaveLength(1);
  });

  it('折り畳みボタンでパネルを非表示にできる', () => {
    const prefab = makePrefab({ components: [new TransformComponent()] });
    render(<ComponentEditor prefab={prefab} onUpdatePrefab={noop} />);

    // initially expanded — collapse button should be visible
    const collapseBtn = screen.getByTestId('collapse-transform');
    fireEvent.click(collapseBtn);

    // panel should be gone (collapsed)
    expect(screen.queryByLabelText('オフセット X')).not.toBeInTheDocument();
  });

  it('コンポーネント追加セレクトが表示される', () => {
    render(<ComponentEditor prefab={makePrefab()} onUpdatePrefab={noop} />);

    expect(screen.getByTestId('add-component-select')).toBeInTheDocument();
  });
});
