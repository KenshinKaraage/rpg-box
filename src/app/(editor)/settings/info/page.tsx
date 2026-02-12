'use client';

import { TwoColumnLayout } from '@/components/common/TwoColumnLayout';
import { GameInfoForm } from '@/features/game-settings/components/GameInfoForm';
import { useStore } from '@/stores';
import type { GameSettings } from '@/types/gameSettings';

/**
 * ゲーム情報設定ページ
 */
export default function GameInfoPage() {
  // 個別にセレクトして無限ループを防ぐ
  const gameSettings = useStore((state) => state.gameSettings);
  const updateGameSettings = useStore((state) => state.updateGameSettings);

  const handleSubmit = (values: GameSettings) => {
    updateGameSettings(values);
  };

  return (
    <TwoColumnLayout
      left={
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold">ゲーム情報</h2>
          <p className="text-sm text-muted-foreground">ゲームの基本情報を設定します。</p>
        </div>
      }
      right={
        <div className="p-4">
          <GameInfoForm initialValues={gameSettings} onSubmit={handleSubmit} />
        </div>
      }
    />
  );
}
