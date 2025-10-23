import React from 'react';
import type { BuildStatus } from '@/hooks/useBuildStatus';

interface BuildErrorCardProps {
  build: BuildStatus;
  onFixClick: () => void;
}

export const BuildErrorCard: React.FC<BuildErrorCardProps> = ({ build, onFixClick }) => {
  return (
    <div style={{
      marginBottom: '16px',
      padding: '16px',
      background: 'var(--vf-bg-elevated)',
      borderRadius: '8px',
      borderLeft: '4px solid var(--vf-error)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>❌</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--vf-error)',
            marginBottom: '4px'
          }}>
            Build Failed
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vf-text-muted)' }}>
            {build.error_message || 'Build encountered errors'}
          </div>
        </div>
      </div>

      {(build.install_logs || build.build_logs) && (
        <details style={{ marginBottom: '12px' }}>
          <summary style={{
            cursor: 'pointer',
            color: 'var(--vf-text-muted)',
            fontSize: '13px',
            padding: '8px',
            background: 'var(--vf-bg-base)',
            borderRadius: '4px'
          }}>
            View error logs
          </summary>
          <pre style={{
            marginTop: '8px',
            padding: '12px',
            background: 'var(--vf-bg-base)',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--vf-error)'
          }}>
            {build.install_logs || build.build_logs}
          </pre>
        </details>
      )}

      <button
        onClick={onFixClick}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'var(--vf-accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span>🔧</span>
        Ask Agent to Fix This Error
      </button>
    </div>
  );
};
