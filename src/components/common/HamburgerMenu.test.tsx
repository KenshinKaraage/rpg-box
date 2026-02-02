import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('opens menu when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    const trigger = screen.getByTestId('hamburger-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('shows all menu groups when opened', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
      expect(screen.getByText('エクスポート')).toBeInTheDocument();
      expect(screen.getByText('設定')).toBeInTheDocument();
      expect(screen.getByText('ヘルプ')).toBeInTheDocument();
      expect(screen.getByText('アカウント')).toBeInTheDocument();
    });
  });

  it('shows keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  it('closes menu when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    const trigger = screen.getByTestId('hamburger-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('calls project handlers when menu items are clicked', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<HamburgerMenu project={{ onSave }} />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    await user.click(screen.getByText('保存'));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows login when not logged in', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu account={{ isLoggedIn: false }} />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.queryByText('ログアウト')).not.toBeInTheDocument();
    });
  });

  it('shows logout when logged in', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu account={{ isLoggedIn: true }} />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
    });
  });
});
