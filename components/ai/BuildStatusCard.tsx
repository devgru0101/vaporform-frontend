import React from 'react';
import type { BuildStatus, BuildEvent } from '@/hooks/useBuildStatus';

interface BuildStatusCardProps {
  build: BuildStatus;
  events?: BuildEvent[];
}

export const BuildStatusCard: React.FC<BuildStatusCardProps> = ({ build, events = [] }) => {
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'pending': return '⏳';
      case 'setup': return '🔧';
      case 'install': return '📦';
      case 'build': return '🏗️';
      case 'test': return '🧪';
      case 'deploy': return '🚀';
      case 'complete': return '✅';
      case 'failed': return '❌';
      default: return '🔄';
    }
  };

  const progress = build.total_steps ? Math.round((build.current_step ? parseInt(String(build.current_step)) : 0) / build.total_steps * 100) : 0;

  return (
    <div style={{
      marginBottom: '16px',
      padding: '16px',
      background: 'var(--vf-bg-elevated)',
      borderRadius: '8px',
      borderLeft: '4px solid var(--vf-accent-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>
          {getPhaseIcon(build.phase)}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--vf-text-primary)',
            marginBottom: '4px'
          }}>
            Building Project
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vf-text-muted)' }}>
            {build.current_step || `Phase: ${build.phase}`}
          </div>
        </div>
        <div className="agent-message-thinking" style={{ marginLeft: '12px' }}>
          Building...
        </div>
      </div>

      {build.total_steps && build.total_steps > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--vf-bg-base)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--vf-accent-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--vf-text-muted)',
            marginTop: '4px',
            textAlign: 'right'
          }}>
            {progress}%
          </div>
        </div>
      )}

      {build.live_output && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--vf-text-muted)', fontSize: '13px' }}>
            View live output
          </summary>
          <pre style={{
            marginTop: '8px',
            padding: '12px',
            background: 'var(--vf-bg-base)',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {build.live_output}
          </pre>
        </details>
      )}

      {events && events.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--vf-text-muted)', fontSize: '13px' }}>
            Build events ({events.length})
          </summary>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            {events.slice(-5).map((event, idx) => (
              <div key={idx} style={{
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--vf-bg-base)',
                borderRadius: '4px',
                color: event.event_type === 'error' ? 'var(--vf-error)' : 'var(--vf-text-primary)'
              }}>
                <span style={{ fontWeight: 500 }}>[{event.event_type}]</span> {event.message}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
