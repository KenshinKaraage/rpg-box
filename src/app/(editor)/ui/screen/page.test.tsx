import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UIScreenDesignPage from './page';

describe('UIScreenDesignPage', () => {
  it('renders three-column layout', () => {
    render(<UIScreenDesignPage />);
    expect(screen.getByTestId('left-column')).toBeInTheDocument();
    expect(screen.getByTestId('center-column')).toBeInTheDocument();
    expect(screen.getByTestId('right-column')).toBeInTheDocument();
  });

  it('shows left panel mode selector defaulting to canvas list', () => {
    render(<UIScreenDesignPage />);
    expect(screen.getByRole('combobox', { name: '左パネルモード' })).toBeInTheDocument();
  });

  it('shows empty canvas list message when no canvases', () => {
    render(<UIScreenDesignPage />);
    expect(screen.getByText('画面がありません')).toBeInTheDocument();
  });

  it('shows placeholder when no canvas is selected', () => {
    render(<UIScreenDesignPage />);
    expect(screen.getByText('画面を選択してください')).toBeInTheDocument();
  });

  it('adds a canvas and shows it selected', async () => {
    const user = userEvent.setup();
    render(<UIScreenDesignPage />);

    await user.click(screen.getByRole('button', { name: '画面を追加' }));

    const listbox = screen.getByRole('listbox', { name: '画面一覧' });
    const option = within(listbox).getByRole('option');
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(option).toHaveTextContent('新しい画面');
  });

  it('shows canvas placeholder when a canvas is selected', async () => {
    const user = userEvent.setup();
    render(<UIScreenDesignPage />);

    await user.click(screen.getByRole('button', { name: '画面を追加' }));

    expect(screen.getByTestId('ui-canvas-placeholder')).toBeInTheDocument();
  });
});
