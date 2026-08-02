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

  it('shows implemented menu groups when opened', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
      expect(screen.getByText('エクスポート / インポート')).toBeInTheDocument();
      expect(screen.getByText('設定')).toBeInTheDocument();
    });
  });

  it('hides unimplemented groups and items', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    });

    // ヘルプ・アカウントグループごと非表示
    expect(screen.queryByText('ヘルプ')).not.toBeInTheDocument();
    expect(screen.queryByText('アカウント')).not.toBeInTheDocument();
    // 複数プロジェクト管理（T248）関連の未接続項目
    expect(screen.queryByText('新規作成')).not.toBeInTheDocument();
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
    expect(screen.queryByText('名前を付けて保存')).not.toBeInTheDocument();
    // Webゲーム出力（T230未実装）
    expect(screen.queryByText('Webゲーム出力')).not.toBeInTheDocument();
    // エディタ設定・ショートカット一覧（T026b未実装）
    expect(screen.queryByText('エディタ設定')).not.toBeInTheDocument();
    expect(screen.queryByText('ショートカット一覧')).not.toBeInTheDocument();
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
    const onClearTempData = jest.fn();
    render(<HamburgerMenu project={{ onClearTempData }} />);

    await user.click(screen.getByTestId('hamburger-trigger'));

    await waitFor(() => {
      expect(screen.getByText('一時データをクリア')).toBeInTheDocument();
    });

    await user.click(screen.getByText('一時データをクリア'));

    expect(onClearTempData).toHaveBeenCalledTimes(1);
  });
});
