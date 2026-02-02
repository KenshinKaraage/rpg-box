'use client';

/**
 * Modal コンポーネント
 *
 * shadcn/ui Dialog のラッパーコンポーネント
 * - サイズバリアント（sm, md, lg, xl, full）
 * - シンプルな API
 * - Escape キーで閉じる（Radix UI デフォルト動作）
 * - フォーカストラップ（Radix UI デフォルト動作）
 * - アニメーション（フェードイン/アウト）
 *
 * @see CLAUDE.md#shadcn/ui
 */

import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// =============================================================================
// 型定義
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void;
  /** モーダルのタイトル */
  title?: string;
  /** モーダルの説明文 */
  description?: string;
  /** モーダルのサイズ（デフォルト: md） */
  size?: ModalSize;
  /** モーダル本体のコンテンツ */
  children: ReactNode;
  /** フッターコンテンツ */
  footer?: ReactNode;
  /** クローズボタンを表示するか（デフォルト: true） */
  showCloseButton?: boolean;
  /** オーバーレイクリックで閉じるか（デフォルト: true） */
  closeOnOverlayClick?: boolean;
  /** Escapeキーで閉じるか（デフォルト: true） */
  closeOnEscape?: boolean;
  /** 追加のクラス名 */
  className?: string;
  /** コンテンツ部分の追加クラス名 */
  contentClassName?: string;
}

// =============================================================================
// スタイル定義
// =============================================================================

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] h-full',
};

// =============================================================================
// Modal コンポーネント
// =============================================================================

/**
 * モーダルダイアログコンポーネント
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="マップ作成"
 *   description="新しいマップの設定を入力してください"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>
 *         キャンセル
 *       </Button>
 *       <Button onClick={handleCreate}>作成</Button>
 *     </>
 *   }
 * >
 *   <form>
 *     ...
 *   </form>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
}: ModalProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleInteractOutside = (event: Event) => {
    if (!closeOnOverlayClick) {
      event.preventDefault();
    }
  };

  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (!closeOnEscape) {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size], className)}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        // クローズボタンを非表示にするためのカスタム処理
        // デフォルトのクローズボタンは DialogContent 内で自動レンダリングされるため、
        // showCloseButton が false の場合は独自のコンテンツを使用
      >
        {/* 既存のクローズボタンを上書き */}
        {!showCloseButton && (
          <style>{`
            [data-radix-dialog-content] > button[aria-label="Close"],
            [data-radix-dialog-content] > button:has(.sr-only:contains("Close")) {
              display: none;
            }
          `}</style>
        )}

        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        <div className={cn('flex-1', contentClassName)}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// 補助コンポーネントのエクスポート
// =============================================================================

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
