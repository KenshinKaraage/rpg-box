import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ThreeColumnLayout } from './ThreeColumnLayout';

describe('ThreeColumnLayout', () => {
  it('renders three columns with content', () => {
    render(
      <ThreeColumnLayout
        left={<div>Left Content</div>}
        center={<div>Center Content</div>}
        right={<div>Right Content</div>}
      />
    );

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Center Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('renders resize handles', () => {
    render(
      <ThreeColumnLayout
        left={<div>Left</div>}
        center={<div>Center</div>}
        right={<div>Right</div>}
      />
    );

    expect(screen.getByTestId('left-resize-handle')).toBeInTheDocument();
    expect(screen.getByTestId('right-resize-handle')).toBeInTheDocument();
  });

  it('applies default widths', () => {
    render(
      <ThreeColumnLayout
        left={<div>Left</div>}
        center={<div>Center</div>}
        right={<div>Right</div>}
        leftDefaultWidth={200}
        rightDefaultWidth={300}
      />
    );

    const leftColumn = screen.getByTestId('left-column');
    const rightColumn = screen.getByTestId('right-column');

    expect(leftColumn).toHaveStyle({ width: '200px' });
    expect(rightColumn).toHaveStyle({ width: '300px' });
  });

  it('has cursor style on resize handles', () => {
    render(
      <ThreeColumnLayout
        left={<div>Left</div>}
        center={<div>Center</div>}
        right={<div>Right</div>}
      />
    );

    const leftHandle = screen.getByTestId('left-resize-handle');
    const rightHandle = screen.getByTestId('right-resize-handle');

    expect(leftHandle).toHaveClass('cursor-col-resize');
    expect(rightHandle).toHaveClass('cursor-col-resize');
  });

  it('triggers mousedown on resize handles', () => {
    render(
      <ThreeColumnLayout
        left={<div>Left</div>}
        center={<div>Center</div>}
        right={<div>Right</div>}
      />
    );

    const leftHandle = screen.getByTestId('left-resize-handle');

    // Should not throw when mousedown is triggered
    fireEvent.mouseDown(leftHandle);
    fireEvent.mouseUp(document);
  });
});
