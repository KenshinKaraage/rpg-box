'use client';

/**
 * Hook to manage test play state.
 * Captures ProjectData from the store and controls overlay visibility.
 */

import { useCallback, useState } from 'react';
import type { ProjectData } from '@/lib/storage/types';
import { buildProjectData } from '../buildProjectData';

export function useTestPlay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  const startTestPlay = useCallback(() => {
    const data = buildProjectData();

    if (data.maps.length === 0) {
      console.warn('[TestPlay] No maps found in project.');
      return;
    }

    // startMapId が未設定の場合、最初のマップを使う
    if (!data.gameSettings.startMapId) {
      data.gameSettings = {
        ...data.gameSettings,
        startMapId: data.maps[0]!.id,
      };
    }

    setProjectData(data);
    setIsPlaying(true);
  }, []);

  const stopTestPlay = useCallback(() => {
    setIsPlaying(false);
    setProjectData(null);
  }, []);

  return {
    isPlaying,
    projectData,
    startTestPlay,
    stopTestPlay,
  };
}
