import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Header } from './Header';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/data',
}));

describe('Header', () => {
  it('renders logo and title', () => {
    render(<Header />);
    expect(screen.getByText('RPG Box')).toBeInTheDocument();
  });

  it('renders navigation menus', () => {
    render(<Header />);
    expect(screen.getByText('データ')).toBeInTheDocument();
    expect(screen.getByText('マップ')).toBeInTheDocument();
    expect(screen.getByText('スクリプト')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
    expect(screen.getByText('ゲーム設定')).toBeInTheDocument();
  });

  it('renders test play button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /テストプレイ/i })).toBeInTheDocument();
  });

  it('renders hamburger menu button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /メニュー/i })).toBeInTheDocument();
  });
});
