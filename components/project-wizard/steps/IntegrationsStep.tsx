'use client';

import React from 'react';
import type { Integrations } from '@/lib/types/project';

// Props match ProjectCreationModal's internal data structure
interface IntegrationsStepProps {
  projectData: {
    integrations: Integrations;
  };
  updateProjectData: (updates: { integrations: Integrations }) => void;
}

export const IntegrationsStep: React.FC<IntegrationsStepProps> = ({
  // Props are included for interface consistency with other steps
  // Will be used when integration selection is implemented
  projectData: _projectData,
  updateProjectData: _updateProjectData
}) => {
  return (
    <div className="vf-wizard-step">
      <h3 className="vf-wizard-step-title">ADD INTEGRATIONS</h3>
      <p className="vf-wizard-step-description">
        Optional: Add third-party services (can be configured later)
      </p>

      <div className="vf-alert vf-alert-info" role="note">
        <p>Integrations will be pre-configured in your generated project.</p>
        <p>You can add authentication, payments, and analytics later.</p>
      </div>
    </div>
  );
};
