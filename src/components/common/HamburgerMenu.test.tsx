import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { HamburgerMenu } from './HamburgerMenu';

describe('HamburgerMenu', () => {
  it('renders hamburger menu trigger', () => {
    render(<HamburgerMenu />);
    expect(screen.getByTestId('hamburger-trigger')).toBeInTheDocument();
  });

  it('has accessible name', () => {
    render(<HamburgerMenu />);
    expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
  });

  it('has aria-haspopup attribute', () => {
    render(<HamburgerMenu />);
    const trigger = screen.getByTestId('hamburger-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('starts with menu closed', () => {
    render(<HamburgerMenu />);
    const trigger = screen.getByTestId('hamburger-trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
