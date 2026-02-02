/**
 * ConfirmDialog コンポーネントのテスト
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { ConfirmDialog, ConfirmProvider, useConfirm } from './ConfirmDialog';

// =============================================================================
// ConfirmDialog コンポーネントのテスト
// =============================================================================

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'テストタイトル',
    message: 'テストメッセージ',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('タイトルとメッセージが表示される', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('テストタイトル')).toBeInTheDocument();
      expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
    });

    it('確認ボタンとキャンセルボタンが表示される', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('open=falseで非表示', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('ボタンテキストのカスタマイズ', () => {
    it('confirmTextをカスタマイズできる', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="はい" />);

      expect(screen.getByRole('button', { name: 'はい' })).toBeInTheDocument();
    });

    it('cancelTextをカスタマイズできる', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="いいえ" />);

      expect(screen.getByRole('button', { name: 'いいえ' })).toBeInTheDocument();
    });
  });

  describe('バリアント', () => {
    it('variant=defaultでOKボタン', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />);

      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    });

    it('variant=warningで続行ボタン', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      expect(screen.getByRole('button', { name: '続行' })).toBeInTheDocument();
    });

    it('variant=dangerで削除ボタン', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });
  });

  describe('コールバック', () => {
    it('確認ボタンクリックでonConfirmが呼ばれる', () => {
      const onConfirm = jest.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'OK' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('キャンセルボタンクリックでonCancelが呼ばれる', () => {
      const onCancel = jest.fn();
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Escapeキーでoncancel呼ばれる', () => {
      const onCancel = jest.fn();
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmDisabled', () => {
    it('confirmDisabled=trueで確認ボタンが無効', () => {
      render(<ConfirmDialog {...defaultProps} confirmDisabled />);

      expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    });
  });
});

// =============================================================================
// useConfirm フックのテスト
// =============================================================================

function TestComponent() {
  const { confirm, confirmDanger, confirmWarning } = useConfirm();
  const [result, setResult] = useState<string>('pending');

  const handleConfirm = async () => {
    const confirmed = await confirm({
      title: 'テスト確認',
      message: '続行しますか？',
    });
    setResult(confirmed ? 'confirmed' : 'cancelled');
  };

  const handleConfirmDanger = async () => {
    const confirmed = await confirmDanger('危険な操作', 'この操作は取り消せません');
    setResult(confirmed ? 'danger-confirmed' : 'danger-cancelled');
  };

  const handleConfirmWarning = async () => {
    const confirmed = await confirmWarning('警告', '注意してください');
    setResult(confirmed ? 'warning-confirmed' : 'warning-cancelled');
  };

  return (
    <div>
      <button onClick={handleConfirm}>Show Confirm</button>
      <button onClick={handleConfirmDanger}>Show Danger</button>
      <button onClick={handleConfirmWarning}>Show Warning</button>
      <span data-testid="result">{result}</span>
    </div>
  );
}

describe('useConfirm', () => {
  it('Providerなしで使用するとエラー', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useConfirm must be used within a ConfirmProvider');

    consoleSpy.mockRestore();
  });

  describe('confirm', () => {
    it('確認でPromiseがtrueで解決', async () => {
      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Show Confirm'));

      // ダイアログが表示される
      expect(screen.getByText('テスト確認')).toBeInTheDocument();

      // 確認ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
      });
    });

    it('キャンセルでPromiseがfalseで解決', async () => {
      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Show Confirm'));
      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
      });
    });
  });

  describe('confirmDanger', () => {
    it('dangerバリアントで表示される', async () => {
      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Show Danger'));

      expect(screen.getByText('危険な操作')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('danger-confirmed');
      });
    });
  });

  describe('confirmWarning', () => {
    it('warningバリアントで表示される', async () => {
      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Show Warning'));

      expect(screen.getByText('警告')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '続行' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '続行' }));

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('warning-confirmed');
      });
    });
  });

  describe('複数のダイアログ', () => {
    it('前のダイアログを閉じてから次のダイアログを開ける', async () => {
      render(
        <ConfirmProvider>
          <TestComponent />
        </ConfirmProvider>
      );

      // 最初のダイアログ
      fireEvent.click(screen.getByText('Show Confirm'));
      expect(screen.getByText('テスト確認')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'OK' }));

      await waitFor(() => {
        expect(screen.queryByText('テスト確認')).not.toBeInTheDocument();
      });

      // 2つ目のダイアログ
      fireEvent.click(screen.getByText('Show Danger'));
      expect(screen.getByText('危険な操作')).toBeInTheDocument();
    });
  });
});
