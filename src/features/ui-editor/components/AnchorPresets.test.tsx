import { render, screen, fireEvent } from '@testing-library/react';
import { AnchorPresets } from './AnchorPresets';

describe('AnchorPresets', () => {
  it('renders a 3x3 grid of preset buttons', () => {
    const onUpdate = jest.fn();
    render(<AnchorPresets anchorX="left" anchorY="top" onUpdate={onUpdate} />);

    expect(screen.getByTestId('anchor-presets')).toBeInTheDocument();
    // 9 buttons total
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('highlights the active preset', () => {
    const onUpdate = jest.fn();
    render(<AnchorPresets anchorX="center" anchorY="center" onUpdate={onUpdate} />);

    const active = screen.getByTestId('anchor-preset-center-center');
    expect(active.className).toContain('bg-blue-500');

    const inactive = screen.getByTestId('anchor-preset-left-top');
    expect(inactive.className).not.toContain('bg-blue-500');
  });

  it('calls onUpdate with correct anchor values on click', () => {
    const onUpdate = jest.fn();
    render(<AnchorPresets anchorX="left" anchorY="top" onUpdate={onUpdate} />);

    fireEvent.click(screen.getByTestId('anchor-preset-right-bottom'));
    expect(onUpdate).toHaveBeenCalledWith({ anchorX: 'right', anchorY: 'bottom' });
  });

  it('calls onUpdate for center-top preset', () => {
    const onUpdate = jest.fn();
    render(<AnchorPresets anchorX="left" anchorY="top" onUpdate={onUpdate} />);

    fireEvent.click(screen.getByTestId('anchor-preset-center-top'));
    expect(onUpdate).toHaveBeenCalledWith({ anchorX: 'center', anchorY: 'top' });
  });

  it('has aria-label on each button', () => {
    const onUpdate = jest.fn();
    render(<AnchorPresets anchorX="left" anchorY="top" onUpdate={onUpdate} />);

    expect(screen.getByLabelText('左上')).toBeInTheDocument();
    expect(screen.getByLabelText('中央')).toBeInTheDocument();
    expect(screen.getByLabelText('右下')).toBeInTheDocument();
  });
});
