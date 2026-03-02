import { render, screen, fireEvent } from '@testing-library/react';
import { ActionComponentEditor } from './ActionComponentEditor';
import type { UIActionEntry } from '@/types/ui/components/ActionComponent';

// Mock ActionBlockEditor — we test the bridge separately
jest.mock('@/features/event-editor/components/ActionBlockEditor', () => ({
  ActionBlockEditor: ({ actions, onChange }: { actions: unknown[]; onChange: (a: unknown[]) => void }) => (
    <div data-testid="mock-block-editor">
      <span data-testid="block-count">{actions.length}</span>
      <button data-testid="mock-add-block" onClick={() => onChange([...actions, {}])}>
        add
      </button>
    </div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  generateId: (prefix: string) => `${prefix}_test_001`,
}));

function makeEntry(id: string, name: string, blockCount = 0): UIActionEntry {
  return {
    id,
    name,
    blocks: Array.from({ length: blockCount }, () => ({ type: 'wait', data: { frames: 60 } })),
  };
}

describe('ActionComponentEditor', () => {
  it('renders empty state', () => {
    const onChange = jest.fn();
    render(<ActionComponentEditor actions={[]} onChange={onChange} />);
    expect(screen.getByText('アクションエントリなし')).toBeInTheDocument();
  });

  it('renders action entries', () => {
    const entries = [makeEntry('a1', 'onClick'), makeEntry('a2', 'onHover')];
    render(<ActionComponentEditor actions={entries} onChange={jest.fn()} />);

    expect(screen.getByTestId('action-entry-a1')).toBeInTheDocument();
    expect(screen.getByTestId('action-entry-a2')).toBeInTheDocument();
  });

  it('adds new entry via button', () => {
    const onChange = jest.fn();
    render(<ActionComponentEditor actions={[]} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('add-action-entry'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0] as UIActionEntry[];
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('新しいアクション');
    expect(result[0]!.blocks).toEqual([]);
  });

  it('deletes entry', () => {
    const entries = [makeEntry('a1', 'onClick'), makeEntry('a2', 'onHover')];
    const onChange = jest.fn();
    render(<ActionComponentEditor actions={entries} onChange={onChange} />);

    const deleteBtn = screen.getByRole('button', { name: 'onClickを削除' });
    fireEvent.click(deleteBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0] as UIActionEntry[];
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('a2');
  });

  it('renames entry', () => {
    const entries = [makeEntry('a1', 'onClick')];
    const onChange = jest.fn();
    render(<ActionComponentEditor actions={entries} onChange={onChange} />);

    const nameInput = screen.getByDisplayValue('onClick');
    fireEvent.change(nameInput, { target: { value: 'onPress' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0] as UIActionEntry[];
    expect(result[0]!.name).toBe('onPress');
    expect(result[0]!.id).toBe('a1');
  });

  it('shows block count per entry', () => {
    const entries = [makeEntry('a1', 'onClick', 3)];
    render(<ActionComponentEditor actions={entries} onChange={jest.fn()} />);

    // Block count is shown as text in the header
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('expands to show block editor on toggle', () => {
    const entries = [makeEntry('a1', 'onClick', 2)];
    render(<ActionComponentEditor actions={entries} onChange={jest.fn()} />);

    // Block editor not visible initially
    expect(screen.queryByTestId('mock-block-editor')).not.toBeInTheDocument();

    // Click expand
    const expandBtn = screen.getByRole('button', { name: '開く' });
    fireEvent.click(expandBtn);

    expect(screen.getByTestId('mock-block-editor')).toBeInTheDocument();
  });
});
