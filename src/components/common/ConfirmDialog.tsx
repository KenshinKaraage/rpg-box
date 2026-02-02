'use client';

/**
 * ConfirmDialog コンポーネント
 *
 * 確認ダイアログコンポーネントとPromiseベースのAPIを提供
 * - タイトル/メッセージ表示
 * - 確認/キャンセルボタン
 * - バリアント（default, warning, danger）
 * - Promise ベースの API（useConfirm フック）
 *
 * @see CLAUDE.md#shadcn/ui
 */

import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

// =============================================================================
// 型定義
// =============================================================================

export type ConfirmVariant = 'default' | 'warning' | 'danger';

export interface ConfirmOptions {
  /** ダイアログのタイトル */
  title: string;
  /** 確認メッセージ */
  message: string;
  /** バリアント（デフォルト: default） */
  variant?: ConfirmVariant;
  /** 確認ボタンのテキスト（デフォルト: バリアントに応じて変化） */
  confirmText?: string;
  /** キャンセルボタンのテキスト（デフォルト: キャンセル） */
  cancelText?: string;
  /** 確認ボタンの無効化状態 */
  confirmDisabled?: boolean;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 確認時のコールバック */
  onConfirm: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

export interface ConfirmContextValue {
  /** 確認ダイアログを表示（Promiseを返す） */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** 危険な操作の確認ダイアログ（ショートカット） */
  confirmDanger: (title: string, message: string) => Promise<boolean>;
  /** 警告の確認ダイアログ（ショートカット） */
  confirmWarning: (title: string, message: string) => Promise<boolean>;
}

// =============================================================================
// バリアントスタイル
// =============================================================================

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: typeof AlertTriangle;
    iconColor: string;
    confirmButtonVariant: 'default' | 'destructive' | 'outline';
    defaultConfirmText: string;
  }
> = {
  default: {
    icon: HelpCircle,
    iconColor: 'text-blue-500',
    confirmButtonVariant: 'default',
    defaultConfirmText: 'OK',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    confirmButtonVariant: 'default',
    defaultConfirmText: '続行',
  },
  danger: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    confirmButtonVariant: 'destructive',
    defaultConfirmText: '削除',
  },
};

// =============================================================================
// ConfirmDialog コンポーネント
// =============================================================================

/**
 * 確認ダイアログコンポーネント
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="削除確認"
 *   message="このアイテムを削除しますか？"
 *   variant="danger"
 *   onConfirm={() => {
 *     deleteItem();
 *     setShowConfirm(false);
 *   }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  title,
  message,
  variant = 'default',
  confirmText,
  cancelText = 'キャンセル',
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const finalConfirmText = confirmText ?? config.defaultConfirmText;

  return (
    <Modal
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) onCancel();
      }}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className={cn('p-3 rounded-full bg-muted', config.iconColor)}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            className="flex-1"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {finalConfirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// ConfirmProvider（Promise ベース API）
// =============================================================================

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

/**
 * 確認ダイアログのプロバイダー
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ConfirmProvider>
 *       <YourApp />
 *     </ConfirmProvider>
 *   );
 * }
 * ```
 */
export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, resolve });
    });
  }, []);

  const confirmDanger = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return confirm({ title, message, variant: 'danger' });
    },
    [confirm]
  );

  const confirmWarning = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return confirm({ title, message, variant: 'warning' });
    },
    [confirm]
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(null);
  }, []);

  const value: ConfirmContextValue = {
    confirm,
    confirmDanger,
    confirmWarning,
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && (
        <ConfirmDialog
          open={true}
          title={state.title}
          message={state.message}
          variant={state.variant}
          confirmText={state.confirmText}
          cancelText={state.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// =============================================================================
// useConfirm フック
// =============================================================================

/**
 * 確認ダイアログを表示するフック
 *
 * @example
 * ```tsx
 * function DeleteButton({ itemId }: { itemId: string }) {
 *   const { confirmDanger } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirmDanger(
 *       '削除確認',
 *       'このアイテムを削除しますか？この操作は取り消せません。'
 *     );
 *
 *     if (confirmed) {
 *       await deleteItem(itemId);
 *     }
 *   };
 *
 *   return <button onClick={handleDelete}>削除</button>;
 * }
 * ```
 */
export function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
