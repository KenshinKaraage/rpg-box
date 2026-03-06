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

    if (!data.gameSettings.startMapId) {
      console.warn('[TestPlay] No start map configured in game settings.');
      return;
    }

    if (data.maps.length === 0) {
      console.warn('[TestPlay] No maps found in project.');
      return;
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
