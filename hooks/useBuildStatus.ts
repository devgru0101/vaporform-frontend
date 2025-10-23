import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface BuildStatus {
  id: string;
  project_id: string;
  workspace_id: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  phase: 'pending' | 'setup' | 'install' | 'build' | 'test' | 'deploy' | 'complete' | 'failed';
  current_step?: string;
  total_steps?: number;
  install_logs?: string;
  build_logs?: string;
  live_output?: string;
  error_message?: string;
  duration_ms?: number;
  metadata?: any;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface BuildEvent {
  id: string;
  build_id: string;
  event_type: 'phase_change' | 'log' | 'error' | 'warning' | 'progress';
  phase?: string;
  message?: string;
  metadata?: any;
  timestamp: Date;
}

export function useBuildStatus(projectId: string) {
  const [currentBuild, setCurrentBuild] = useState<BuildStatus | null>(null);
  const [buildEvents, setBuildEvents] = useState<BuildEvent[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let isActive = true;

    async function pollBuildStatus() {
      if (!isActive || !projectId) return;

      try {
        // Get latest build for project
        const builds = await api.listBuilds(projectId, 1);

        if (builds.length === 0) {
          setCurrentBuild(null);
          setIsBuilding(false);
          setBuildEvents([]);
          setError(null);
          return;
        }

        const build = builds[0];
        setCurrentBuild(build);

        const building = build.status === 'building' || build.status === 'pending';
        setIsBuilding(building);

        // If building, fetch events for real-time progress
        if (building) {
          try {
            const events = await api.getBuildEvents(build.id, 20);
            setBuildEvents(events);
          } catch (eventError: any) {
            console.error('[useBuildStatus] Failed to fetch build events:', eventError);
          }
        } else {
          // Build is complete or failed, fetch final events
          try {
            const events = await api.getBuildEvents(build.id, 20);
            setBuildEvents(events);
          } catch (eventError: any) {
            console.error('[useBuildStatus] Failed to fetch build events:', eventError);
          }
        }

        setError(null);
      } catch (err: any) {
        console.error('[useBuildStatus] Failed to poll build status:', err);
        setError(err.message);
      }
    }

    // Initial poll
    pollBuildStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(pollBuildStatus, 3000);

    return () => {
      isActive = false;
      clearInterval(pollInterval);
    };
  }, [projectId]);

  return {
    currentBuild,
    buildEvents,
    isBuilding,
    error
  };
}
