import { render, screen, fireEvent } from '@testing-library/react';
import { ActionBlockEditor } from './ActionBlockEditor';
import { registerActionBlock, clearActionBlockRegistry } from '../registry/actionBlockRegistry';
import type { EventAction } from '@/engine/actions/EventAction';

// =============================================================================
// Mock: ActionSelector（Modal内部をポータルに依存するためモック化）
// =============================================================================

let capturedOnSelect: ((type: string) => void) | null = null;

jest.mock('./ActionSelector', () => ({
  ActionSelector: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSelect: (type: string) => void;
  }) => {
    capturedOnSelect = onSelect;
    return open ? <div data-testid="action-selector-mock">ActionSelector</div> : null;
  },
}));

// =============================================================================
// Mock: engine actions registry
// =============================================================================

class MockWaitAction {
  readonly type = 'wait';
  frames = 30;
  async execute() {}
  toJSON() {
    return { type: 'wait', frames: this.frames };
  }
  fromJSON(data: Record<string, unknown>) {
    this.frames = data.frames as number;
  }
}

jest.mock('@/engine/actions', () => ({
  getAction: jest.fn((type: string) => {
    if (type === 'wait') return MockWaitAction;
    return undefined;
  }),
}));

// =============================================================================
// Mock: block component
// =============================================================================

function MockWaitBlock({
  action,
  onDelete,
}: {
  action: EventAction;
  onChange: (a: EventAction) => void;
  onDelete: () => void;
}) {
  return (
    <div data-testid="wait-block">
      <span>ウェイト: {(action as unknown as MockWaitAction).frames}フレーム</span>
      <button onClick={onDelete} data-testid="delete-wait">
        削除
      </button>
    </div>
  );
}

// =============================================================================
// テスト
// =============================================================================

describe('ActionBlockEditor', () => {
  const defaultProps = {
    actions: [] as EventAction[],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSelect = null;
    clearActionBlockRegistry();
    registerActionBlock({
      type: 'wait',
      label: 'ウェイト',
      category: 'basic',
      BlockComponent: MockWaitBlock as React.ComponentType<{
        action: EventAction;
        onChange: (a: EventAction) => void;
        onDelete: () => void;
      }>,
    });
  });

  afterEach(() => {
    clearActionBlockRegistry();
  });

  it('アクションがない場合メッセージが表示される', () => {
    render(<ActionBlockEditor {...defaultProps} />);
    expect(screen.getByText('アクションがありません')).toBeInTheDocument();
  });

  it('アクションが表示される', () => {
    const waitAction = new MockWaitAction() as unknown as EventAction;
    render(<ActionBlockEditor {...defaultProps} actions={[waitAction]} />);
    expect(screen.getByText('ウェイト: 30フレーム')).toBeInTheDocument();
  });

  it('複数アクションが順番に表示される', () => {
    const action1 = new MockWaitAction() as unknown as EventAction;
    const action2 = new MockWaitAction() as unknown as EventAction;
    (action2 as unknown as MockWaitAction).frames = 60;
    render(<ActionBlockEditor {...defaultProps} actions={[action1, action2]} />);
    expect(screen.getByText('ウェイト: 30フレーム')).toBeInTheDocument();
    expect(screen.getByText('ウェイト: 60フレーム')).toBeInTheDocument();
    expect(screen.getByTestId('action-block-0')).toBeInTheDocument();
    expect(screen.getByTestId('action-block-1')).toBeInTheDocument();
  });

  it('未登録タイプは不明表示', () => {
    const unknownAction = { type: 'unknown_type' } as unknown as EventAction;
    render(<ActionBlockEditor {...defaultProps} actions={[unknownAction]} />);
    expect(screen.getByText('不明なアクション: unknown_type')).toBeInTheDocument();
    expect(screen.getByTestId('unknown-action-0')).toBeInTheDocument();
  });

  it('アクション追加ボタンが表示される', () => {
    render(<ActionBlockEditor {...defaultProps} />);
    expect(screen.getByTestId('add-action-button')).toBeInTheDocument();
    expect(screen.getByText('アクションを追加')).toBeInTheDocument();
  });

  it('追加ボタンクリックでActionSelectorが開く', () => {
    render(<ActionBlockEditor {...defaultProps} />);
    expect(screen.queryByTestId('action-selector-mock')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-action-button'));
    expect(screen.getByTestId('action-selector-mock')).toBeInTheDocument();
  });

  it('ActionSelectorで選択するとonChangeが呼ばれる', () => {
    render(<ActionBlockEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-action-button'));
    // Simulate selecting 'wait' from the selector
    expect(capturedOnSelect).not.toBeNull();
    capturedOnSelect!('wait');
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    const newActions = defaultProps.onChange.mock.calls[0][0] as EventAction[];
    expect(newActions).toHaveLength(1);
    expect(newActions[0]?.type).toBe('wait');
  });

  it('削除でonChangeが呼ばれる', () => {
    const waitAction = new MockWaitAction() as unknown as EventAction;
    render(<ActionBlockEditor {...defaultProps} actions={[waitAction]} />);
    fireEvent.click(screen.getByTestId('delete-wait'));
    expect(defaultProps.onChange).toHaveBeenCalledWith([]);
  });

  it('中間のアクションを削除すると残りが正しく返される', () => {
    const action1 = new MockWaitAction() as unknown as EventAction;
    const action2 = new MockWaitAction() as unknown as EventAction;
    const action3 = new MockWaitAction() as unknown as EventAction;
    (action2 as unknown as MockWaitAction).frames = 60;
    (action3 as unknown as MockWaitAction).frames = 90;
    render(<ActionBlockEditor {...defaultProps} actions={[action1, action2, action3]} />);
    // Delete the second action (frames=60)
    const deleteButtons = screen.getAllByTestId('delete-wait');
    fireEvent.click(deleteButtons[1]!);
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    const remaining = defaultProps.onChange.mock.calls[0][0] as EventAction[];
    expect(remaining).toHaveLength(2);
    expect((remaining[0] as unknown as MockWaitAction).frames).toBe(30);
    expect((remaining[1] as unknown as MockWaitAction).frames).toBe(90);
  });
});
