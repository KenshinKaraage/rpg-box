import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutAlignPresets } from './LayoutAlignPresets';

describe('LayoutAlignPresets', () => {
  const defaultProps = {
    direction: 'vertical' as const,
    alignment: 'start' as const,
    justify: 'start' as const,
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 9 buttons', () => {
    render(<LayoutAlignPresets {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('highlights active button (vertical: start/start = 左上)', () => {
    render(<LayoutAlignPresets {...defaultProps} />);
    const btn = screen.getByRole('button', { name: '左上' });
    expect(btn.className).toContain('bg-blue-500');
  });

  it('highlights center/center (vertical)', () => {
    render(<LayoutAlignPresets {...defaultProps} alignment="center" justify="center" />);
    const btn = screen.getByRole('button', { name: '中央' });
    expect(btn.className).toContain('bg-blue-500');
  });

  describe('vertical direction', () => {
    // vertical: col=alignment, row=justify
    it('clicking 右下 sets alignment=end, justify=end', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '右下' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'end', justify: 'end' });
    });

    it('clicking 中上 sets alignment=center, justify=start', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '中上' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'center', justify: 'start' });
    });

    it('clicking 左下 sets alignment=start, justify=end', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '左下' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'start', justify: 'end' });
    });
  });

  describe('horizontal direction', () => {
    // horizontal: col=justify, row=alignment
    it('clicking 右下 sets alignment=end, justify=end', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} direction="horizontal" onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '右下' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'end', justify: 'end' });
    });

    it('clicking 中上 sets alignment=start, justify=center', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} direction="horizontal" onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '中上' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'start', justify: 'center' });
    });

    it('clicking 左下 sets alignment=end, justify=start', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} direction="horizontal" onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '左下' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'end', justify: 'start' });
    });

    it('clicking 右中 sets alignment=center, justify=end', () => {
      const onUpdate = jest.fn();
      render(<LayoutAlignPresets {...defaultProps} direction="horizontal" onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole('button', { name: '右中' }));
      expect(onUpdate).toHaveBeenCalledWith({ alignment: 'center', justify: 'end' });
    });
  });
});
