import { render, screen, fireEvent } from '@testing-library/react';
import { ActionSelector } from './ActionSelector';
import { registerActionBlock, clearActionBlockRegistry } from '../registry/actionBlockRegistry';

// Mock block components
const MockComponent = () => <div>mock</div>;

describe('ActionSelector', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearActionBlockRegistry();
    // Register test blocks
    registerActionBlock({
      type: 'variableOp',
      label: '変数操作',
      category: 'logic',
      BlockComponent: MockComponent,
    });
    registerActionBlock({
      type: 'conditional',
      label: '条件分岐',
      category: 'logic',
      BlockComponent: MockComponent,
    });
    registerActionBlock({
      type: 'wait',
      label: 'ウェイト',
      category: 'basic',
      BlockComponent: MockComponent,
    });
  });

  afterEach(() => {
    clearActionBlockRegistry();
  });

  it('タイトルが表示される', () => {
    render(<ActionSelector {...defaultProps} />);
    expect(screen.getByText('アクションを追加')).toBeInTheDocument();
  });

  it('カテゴリが表示される', () => {
    render(<ActionSelector {...defaultProps} />);
    expect(screen.getByText('ロジック')).toBeInTheDocument();
    expect(screen.getByText('基礎')).toBeInTheDocument();
  });

  it('アクションボタンが表示される', () => {
    render(<ActionSelector {...defaultProps} />);
    expect(screen.getByRole('button', { name: '変数操作' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '条件分岐' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ウェイト' })).toBeInTheDocument();
  });

  it('アクションをクリックするとonSelectが呼ばれモーダルが閉じる', () => {
    render(<ActionSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: '変数操作' }));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('variableOp');
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('検索でフィルタリングできる', () => {
    render(<ActionSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('検索...');
    fireEvent.change(searchInput, { target: { value: 'ウェイト' } });
    expect(screen.getByRole('button', { name: 'ウェイト' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '変数操作' })).not.toBeInTheDocument();
  });

  it('検索結果がない場合メッセージが表示される', () => {
    render(<ActionSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('検索...');
    fireEvent.change(searchInput, { target: { value: 'xxxxxx' } });
    expect(screen.getByText('一致するアクションがありません')).toBeInTheDocument();
  });
});
