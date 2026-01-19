import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { BuildStatus, BuildEvent } from '@/lib/types/project';

export type { BuildStatus, BuildEvent };

interface UseBuildStatusResult {
  currentBuild: BuildStatus | null;
  buildEvents: BuildEvent[];
  isBuilding: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Maximum age of failed builds to show (5 minutes)
const MAX_BUILD_AGE_MS = 5 * 60 * 1000;
// Polling interval in milliseconds
const POLL_INTERVAL_MS = 3000;

export function useBuildStatus(projectId: string): UseBuildStatusResult {
  const [currentBuild, setCurrentBuild] = useState<BuildStatus | null>(null);
  const [buildEvents, setBuildEvents] = useState<BuildEvent[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref for tracking if component is mounted
  const isMountedRef = useRef(true);

  const pollBuildStatus = useCallback(async () => {
    if (!isMountedRef.current || !projectId) return;

    try {
      // Get latest build for project
      const builds = await api.listBuilds(projectId, 1);

      if (!isMountedRef.current) return;

      if (builds.length === 0) {
        setCurrentBuild(null);
        setIsBuilding(false);
        setBuildEvents([]);
        setError(null);
        return;
      }

      const build = builds[0] as BuildStatus;

      // Only show recent builds (last 5 minutes) to prevent stale errors from showing
      const buildAge = Date.now() - new Date(build.created_at).getTime();

      if (buildAge > MAX_BUILD_AGE_MS && build.status === 'failed') {
        // Don't show old failed builds
        setCurrentBuild(null);
        setIsBuilding(false);
        setBuildEvents([]);
        setError(null);
        return;
      }

      setCurrentBuild(build);

      const building = build.status === 'building' || build.status === 'pending';
      setIsBuilding(building);

      // Fetch events for build progress/history
      try {
        const events = await api.getBuildEvents(build.id, 20) as BuildEvent[];
        if (isMountedRef.current) {
          setBuildEvents(events);
        }
      } catch (eventError) {
        console.error('[useBuildStatus] Failed to fetch build events:', eventError);
      }

      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useBuildStatus] Failed to poll build status:', err);
      setError(errorMessage);
    }
  }, [projectId]);

  useEffect(() => {
    isMountedRef.current = true;
    let pollInterval: NodeJS.Timeout | undefined;

    // Initial poll
    pollBuildStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(pollBuildStatus, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollBuildStatus]);

  return {
    currentBuild,
    buildEvents,
    isBuilding,
    error,
    refresh: pollBuildStatus
  };
}
