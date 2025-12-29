import React from 'react';
import type { BuildStatus } from '@/hooks/useBuildStatus';

interface BuildErrorCardProps {
  build: BuildStatus;
  onFixClick: () => void;
}

export const BuildErrorCard: React.FC<BuildErrorCardProps> = ({ build, onFixClick }) => {
  // Handle undefined/null error messages
  const errorMessage = !build.error_message || build.error_message === 'undefined'
    ? 'Build encountered errors'
    : build.error_message;

  return (
    <div style={{
      marginBottom: '12px',
      padding: '12px 16px',
      background: 'rgba(220, 38, 38, 0.1)',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      borderRadius: '12px',
      maxWidth: '90%',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px', marginRight: '10px', lineHeight: 1 }}>❌</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--vf-error)',
            marginBottom: '4px'
          }}>
            Build Failed
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--vf-text-secondary)',
            lineHeight: 1.5
          }}>
            {errorMessage}
          </div>
        </div>
      </div>

      {(build.install_logs || build.build_logs) && (
        <details style={{ marginBottom: '8px' }}>
          <summary style={{
            cursor: 'pointer',
            color: 'var(--vf-text-muted)',
            fontSize: '12px',
            padding: '6px 8px',
            background: 'var(--vf-bg-tertiary)',
            borderRadius: '6px',
            userSelect: 'none'
          }}>
            View error logs
          </summary>
          <pre style={{
            marginTop: '8px',
            padding: '10px',
            background: 'var(--vf-bg-base)',
            borderRadius: '6px',
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '200px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--vf-text-secondary)',
            lineHeight: 1.4
          }}>
            {build.install_logs || build.build_logs}
          </pre>
        </details>
      )}

      <button
        onClick={onFixClick}
        className="build-error-fix-button"
      >
        <span>🔧</span>
        Ask Agent to Fix This Error
      </button>
    </div>
  );
};
