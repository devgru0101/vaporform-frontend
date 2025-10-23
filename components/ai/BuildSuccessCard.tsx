import React from 'react';
import type { BuildStatus } from '@/hooks/useBuildStatus';

interface BuildSuccessCardProps {
  build: BuildStatus;
}

export const BuildSuccessCard: React.FC<BuildSuccessCardProps> = ({ build }) => {
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div style={{
      marginBottom: '16px',
      padding: '16px',
      background: 'var(--vf-bg-elevated)',
      borderRadius: '8px',
      borderLeft: '4px solid var(--vf-success)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--vf-success)',
            marginBottom: '4px'
          }}>
            Build Successful
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vf-text-muted)' }}>
            Completed in {formatDuration(build.duration_ms)}
          </div>
        </div>
      </div>

      {build.metadata?.techStack && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--vf-bg-base)',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--vf-text-muted)', marginBottom: '6px' }}>
            Tech Stack
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vf-text-primary)' }}>
            {build.metadata.techStack.framework || build.metadata.techStack.language}
            {build.metadata.techStack.packageManager && ` • ${build.metadata.techStack.packageManager}`}
          </div>
        </div>
      )}

      {(build.install_logs || build.build_logs) && (
        <details>
          <summary style={{
            cursor: 'pointer',
            color: 'var(--vf-text-muted)',
            fontSize: '13px',
            padding: '8px',
            background: 'var(--vf-bg-base)',
            borderRadius: '4px'
          }}>
            View build logs
          </summary>
          <div style={{ marginTop: '8px' }}>
            {build.install_logs && (
              <details style={{ marginBottom: '8px' }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--vf-text-muted)',
                  padding: '6px'
                }}>
                  Installation logs
                </summary>
                <pre style={{
                  marginTop: '6px',
                  padding: '10px',
                  background: 'var(--vf-bg-base)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {build.install_logs}
                </pre>
              </details>
            )}
            {build.build_logs && (
              <details>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--vf-text-muted)',
                  padding: '6px'
                }}>
                  Build logs
                </summary>
                <pre style={{
                  marginTop: '6px',
                  padding: '10px',
                  background: 'var(--vf-bg-base)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {build.build_logs}
                </pre>
              </details>
            )}
          </div>
        </details>
      )}
    </div>
  );
};
