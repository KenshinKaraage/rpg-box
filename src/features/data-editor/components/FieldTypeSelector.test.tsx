import { render, screen, fireEvent } from '@testing-library/react';
import { FieldTypeSelector } from './FieldTypeSelector';

describe('FieldTypeSelector', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タイトルが表示される', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    expect(screen.getByText('フィールドタイプを選択')).toBeInTheDocument();
  });

  it('3カテゴリが表示される', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    expect(screen.getByText('基本')).toBeInTheDocument();
    expect(screen.getByText('参照')).toBeInTheDocument();
    expect(screen.getByText('メディア')).toBeInTheDocument();
  });

  it('フィールドタイプボタンが表示される', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    // 基本カテゴリのタイプがボタンとして表示される
    expect(screen.getByRole('button', { name: '数値' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '文字列' })).toBeInTheDocument();
  });

  it('タイプをクリックするとonSelectが呼ばれモーダルが閉じる', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: '数値' }));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('number');
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('検索でフィルタリングできる', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('検索...');
    fireEvent.change(searchInput, { target: { value: '数値' } });
    expect(screen.getByRole('button', { name: '数値' })).toBeInTheDocument();
    // 他のタイプは表示されない
    expect(screen.queryByRole('button', { name: '文字列' })).not.toBeInTheDocument();
  });

  it('検索結果がない場合メッセージが表示される', () => {
    render(<FieldTypeSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('検索...');
    fireEvent.change(searchInput, { target: { value: 'xxxxxx' } });
    expect(screen.getByText('一致するタイプがありません')).toBeInTheDocument();
  });
});
