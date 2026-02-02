/**
 * Toast コンポーネントのテスト
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast, type ToastVariant } from './Toast';

type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

// テスト用コンポーネント
function TestComponent({
  variant = 'info',
  message = 'テストメッセージ',
  duration,
  closable,
}: {
  variant?: ToastVariant;
  message?: string;
  duration?: number;
  closable?: boolean;
}) {
  const { addToast, success, warning, error, info, removeToast, clearToasts, toasts } = useToast();

  return (
    <div>
      <button onClick={() => addToast(message, { variant, duration, closable })}>Add Toast</button>
      <button onClick={() => success(message)}>Success</button>
      <button onClick={() => warning(message)}>Warning</button>
      <button onClick={() => error(message)}>Error</button>
      <button onClick={() => info(message)}>Info</button>
      <button onClick={() => clearToasts()}>Clear All</button>
      {toasts[0] && <button onClick={() => removeToast(toasts[0]!.id)}>Remove First</button>}
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  );
}

// Provider付きレンダー
function renderWithProvider(
  ui: React.ReactElement,
  options?: { maxToasts?: number; position?: ToastPosition }
) {
  return render(
    <ToastProvider maxToasts={options?.maxToasts} position={options?.position}>
      {ui}
    </ToastProvider>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // タイマーをクリーンアップ
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('useToast がプロバイダー外で使用されるとエラーを投げる', () => {
      // コンソールエラーを抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });

    it('プロバイダー内で正常に動作する', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByText('Add Toast')).toBeInTheDocument();
    });
  });

  describe('トースト追加', () => {
    it('addToast でトーストを追加できる', () => {
      renderWithProvider(<TestComponent message="カスタムメッセージ" />);

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.getByText('カスタムメッセージ')).toBeInTheDocument();
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('success でsuccessバリアントのトーストを追加できる', () => {
      renderWithProvider(<TestComponent message="成功しました" />);

      fireEvent.click(screen.getByText('Success'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveTextContent('成功しました');
      expect(toast).toHaveClass('bg-green-50');
    });

    it('warning でwarningバリアントのトーストを追加できる', () => {
      renderWithProvider(<TestComponent message="警告です" />);

      fireEvent.click(screen.getByText('Warning'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveTextContent('警告です');
      expect(toast).toHaveClass('bg-yellow-50');
    });

    it('error でerrorバリアントのトーストを追加できる', () => {
      renderWithProvider(<TestComponent message="エラーです" />);

      fireEvent.click(screen.getByText('Error'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveTextContent('エラーです');
      expect(toast).toHaveClass('bg-red-50');
    });

    it('info でinfoバリアントのトーストを追加できる', () => {
      renderWithProvider(<TestComponent message="情報です" />);

      fireEvent.click(screen.getByText('Info'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveTextContent('情報です');
      expect(toast).toHaveClass('bg-blue-50');
    });
  });

  describe('自動消去', () => {
    it('デフォルト時間後に自動消去される', async () => {
      renderWithProvider(<TestComponent variant="success" />);

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // successのデフォルト: 3000ms + アニメーション時間
      act(() => {
        jest.advanceTimersByTime(3200);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('duration=0 で自動消去しない', async () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // 十分な時間が経過しても消えない
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('カスタムdurationを設定できる', async () => {
      renderWithProvider(<TestComponent duration={1000} />);

      fireEvent.click(screen.getByText('Add Toast'));

      // 1000ms前は存在
      act(() => {
        jest.advanceTimersByTime(800);
      });
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // 1000ms + アニメーション後に消える
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('手動クローズ', () => {
    it('クローズボタンでトーストを閉じられる', async () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByLabelText('閉じる'));

      // アニメーション時間後に削除
      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('closable=false でクローズボタンが表示されない', () => {
      renderWithProvider(<TestComponent closable={false} duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.queryByLabelText('閉じる')).not.toBeInTheDocument();
    });
  });

  describe('トースト削除', () => {
    it('removeToast で特定のトーストを削除できる', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByText('Remove First'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('clearToasts で全トーストを削除できる', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');

      fireEvent.click(screen.getByText('Clear All'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('スタック表示', () => {
    it('複数のトーストを同時に表示できる', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Warning'));
      fireEvent.click(screen.getByText('Error'));

      expect(screen.getAllByRole('alert')).toHaveLength(3);
      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    });

    it('maxToastsを超えると古いトーストが削除される', () => {
      renderWithProvider(<TestComponent duration={0} />, { maxToasts: 2 });

      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Warning'));
      fireEvent.click(screen.getByText('Error'));

      // 最大2個まで
      expect(screen.getAllByRole('alert')).toHaveLength(2);
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');

      // 最新の2つが残る
      expect(screen.queryByText('成功')).not.toBeInTheDocument(); // 最初のは削除される可能性
    });
  });

  describe('アクセシビリティ', () => {
    it('トーストはrole="alert"を持つ', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('トーストコンテナはaria-labelを持つ', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.getByRole('region', { name: '通知' })).toBeInTheDocument();
    });

    it('クローズボタンはaria-labelを持つ', () => {
      renderWithProvider(<TestComponent duration={0} />);

      fireEvent.click(screen.getByText('Add Toast'));

      expect(screen.getByLabelText('閉じる')).toBeInTheDocument();
    });
  });

  describe('位置オプション', () => {
    it.each<[ToastPosition, string]>([
      ['top-right', 'top-4 right-4'],
      ['top-left', 'top-4 left-4'],
      ['bottom-right', 'bottom-4 right-4'],
      ['bottom-left', 'bottom-4 left-4'],
    ])('position=%s でコンテナに適切なクラスが適用される', (position, expectedClass) => {
      renderWithProvider(<TestComponent duration={0} />, { position });

      fireEvent.click(screen.getByText('Add Toast'));

      const container = screen.getByRole('region', { name: '通知' });
      expectedClass.split(' ').forEach((cls) => {
        expect(container).toHaveClass(cls);
      });
    });
  });
});
