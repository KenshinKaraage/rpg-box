'use client';

/**
 * Toast 通知コンポーネント
 *
 * - success/warning/error バリアント
 * - 自動消去（タイムアウト設定可能）
 * - 手動クローズボタン
 * - スタック表示（複数同時表示）
 *
 * @see CLAUDE.md#エラーハンドリング
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// 型定義
// =============================================================================

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastOptions {
  /** トーストのバリアント */
  variant?: ToastVariant;
  /** 自動消去までの時間（ミリ秒）。0で自動消去無効 */
  duration?: number;
  /** クローズボタンを表示するか */
  closable?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  closable: boolean;
}

export interface ToastContextValue {
  /** トースト一覧 */
  toasts: Toast[];
  /** トーストを追加 */
  addToast: (message: string, options?: ToastOptions) => string;
  /** 成功トースト */
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  /** 警告トースト */
  warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  /** エラートースト */
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  /** 情報トースト */
  info: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  /** トーストを削除 */
  removeToast: (id: string) => void;
  /** 全トーストをクリア */
  clearToasts: () => void;
}

// =============================================================================
// デフォルト設定
// =============================================================================

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3000,
  warning: 5000,
  error: 5000,
  info: 4000,
};

// =============================================================================
// Context
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast Context を使用するフック
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// =============================================================================
// ToastProvider
// =============================================================================

interface ToastProviderProps {
  children: ReactNode;
  /** トーストの最大表示数（デフォルト: 5） */
  maxToasts?: number;
  /** トーストの表示位置 */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

/**
 * Toast プロバイダー
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourApp />
 *     </ToastProvider>
 *   );
 * }
 *
 * function SomeComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('保存しました');
 *     } catch (e) {
 *       error('保存に失敗しました');
 *     }
 *   };
 * }
 * ```
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'top-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const id = `toast_${++idCounter.current}`;
      const variant = options.variant ?? 'info';
      const duration = options.duration ?? DEFAULT_DURATION[variant];
      const closable = options.closable ?? true;

      const newToast: Toast = {
        id,
        message,
        variant,
        duration,
        closable,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // 最大数を超えたら古いものから削除
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [maxToasts]
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'success' }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'warning' }),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'error' }),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(message, { ...options, variant: 'info' }),
    [addToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    success,
    warning,
    error,
    info,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// =============================================================================
// ToastContainer
// =============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastProviderProps['position'];
  onRemove: (id: string) => void;
}

const positionClasses: Record<NonNullable<ToastProviderProps['position']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

function ToastContainer({ toasts, position = 'top-right', onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn('fixed z-50 flex flex-col gap-2', positionClasses[position])}
      role="region"
      aria-label="通知"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// =============================================================================
// ToastItem
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
};

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 200); // アニメーション時間
  }, [onRemove, toast.id]);

  useEffect(() => {
    // マウント時にアニメーション開始
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, handleClose]);

  const Icon = variantIcons[toast.variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 min-w-[300px] max-w-[450px] p-4 rounded-lg border shadow-lg',
        'transition-all duration-200 ease-out',
        variantStyles[toast.variant],
        isVisible && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      {toast.closable && (
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
          )}
          aria-label="閉じる"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// エクスポート
// =============================================================================

export { ToastContainer, ToastItem };
