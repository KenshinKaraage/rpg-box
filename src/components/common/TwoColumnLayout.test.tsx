import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { TwoColumnLayout } from './TwoColumnLayout';

describe('TwoColumnLayout', () => {
  it('renders two columns with content', () => {
    render(<TwoColumnLayout left={<div>Left Content</div>} right={<div>Right Content</div>} />);

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('renders resize handle', () => {
    render(<TwoColumnLayout left={<div>Left</div>} right={<div>Right</div>} />);

    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  it('applies default width via grid template', () => {
    render(
      <TwoColumnLayout left={<div>Left</div>} right={<div>Right</div>} leftDefaultWidth={300} />
    );

    const container = screen.getByTestId('left-column').parentElement!;
    expect(container).toHaveStyle({ gridTemplateColumns: '300px 4px 1fr' });
  });

  it('has cursor style on resize handle', () => {
    render(<TwoColumnLayout left={<div>Left</div>} right={<div>Right</div>} />);

    const handle = screen.getByTestId('resize-handle');
    expect(handle).toHaveClass('cursor-col-resize');
  });

  it('triggers mousedown on resize handle', () => {
    render(<TwoColumnLayout left={<div>Left</div>} right={<div>Right</div>} />);

    const handle = screen.getByTestId('resize-handle');

    // Should not throw when mousedown is triggered
    fireEvent.mouseDown(handle);
    fireEvent.mouseUp(document);
  });
});
