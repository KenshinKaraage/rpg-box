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
    scripts: [...mockScripts, ...mockInternalScripts],
    selectedId: null as string | null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onAddInternal: jest.fn(),
    onMove: jest.fn(),
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
    const nested: Script[] = [
      ...mockScripts,
      mockInternalScripts[0]!,
      { ...createScript('g1', '_calcHit', 'internal'), parentId: 'i1' },
    ];
    render(<ScriptList {...defaultProps} scripts={nested} />);
    expect(screen.getByText('_damage')).toBeInTheDocument();
    expect(screen.getByText('_calcHit')).toBeInTheDocument();
  });

  it('calls onAdd when clicking add button', () => {
    const onAdd = jest.fn();
    render(<ScriptList {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /追加/ }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders empty state when no scripts', () => {
    render(<ScriptList {...defaultProps} scripts={[]} />);
    expect(screen.getByText(/スクリプトがありません/)).toBeInTheDocument();
  });
});
