import { render, screen, fireEvent } from '@testing-library/react';

import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

import { ScriptList } from './ScriptList';

const mockScripts: Script[] = [
  createScript('s1', 'バトル開始', 'event'),
  createScript('s2', 'ショップ', 'event'),
];

const mockInternalScripts: Script[] = [
  { ...createScript('i1', '_damage', 'internal'), parentId: 's1' },
  { ...createScript('i2', '_effect', 'internal'), parentId: 's1' },
];

describe('ScriptList', () => {
  const defaultProps = {
    scripts: mockScripts,
    internalScriptsMap: {
      s1: mockInternalScripts,
      s2: [],
    } as Record<string, Script[]>,
    selectedId: null as string | null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onAddInternal: jest.fn(),
    title: 'イベントスクリプト',
  };

  it('renders script list with title', () => {
    render(<ScriptList {...defaultProps} />);
    expect(screen.getByText('イベントスクリプト')).toBeInTheDocument();
    expect(screen.getByText('バトル開始')).toBeInTheDocument();
    expect(screen.getByText('ショップ')).toBeInTheDocument();
  });

  it('shows internal scripts under parent when expanded', () => {
    render(<ScriptList {...defaultProps} />);
    expect(screen.getByText('_damage')).toBeInTheDocument();
    expect(screen.getByText('_effect')).toBeInTheDocument();
  });

  it('shows recursively nested internal scripts', () => {
    const nestedMap: Record<string, Script[]> = {
      s1: [mockInternalScripts[0]!],
      s2: [],
      i1: [{ ...createScript('g1', '_calcHit', 'internal'), parentId: 'i1' }],
    };
    render(<ScriptList {...defaultProps} internalScriptsMap={nestedMap} />);
    expect(screen.getByText('_damage')).toBeInTheDocument();
    expect(screen.getByText('_calcHit')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a script', () => {
    const onSelect = jest.fn();
    render(<ScriptList {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('バトル開始'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('calls onSelect when clicking an internal script', () => {
    const onSelect = jest.fn();
    render(<ScriptList {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('_damage'));
    expect(onSelect).toHaveBeenCalledWith('i1');
  });

  it('highlights selected script', () => {
    render(<ScriptList {...defaultProps} selectedId="s1" />);
    const item = screen.getByTestId('script-item-s1');
    expect(item).toHaveClass('bg-accent');
  });

  it('calls onAdd when clicking add button', () => {
    const onAdd = jest.fn();
    render(<ScriptList {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /追加/ }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders empty state when no scripts', () => {
    render(<ScriptList {...defaultProps} scripts={[]} internalScriptsMap={{}} />);
    expect(screen.getByText(/スクリプトがありません/)).toBeInTheDocument();
  });
});
