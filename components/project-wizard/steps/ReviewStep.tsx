'use client';

import React from 'react';
import type { ProjectVision, TechStack } from '@/lib/types/project';
import { Spinner } from '@/components/shared';

// Props match ProjectCreationModal's internal data structure
interface ReviewStepProps {
  projectData: {
    vision: ProjectVision;
    techStack: TechStack;
  };
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  projectData,
  onGenerate,
  isGenerating
}) => {
  return (
    <div className="vf-wizard-step">
      <h3 className="vf-wizard-step-title">REVIEW & GENERATE</h3>
      <p className="vf-wizard-step-description">
        Review your project configuration
      </p>

      <div className="vf-review-section" role="region" aria-label="Project overview">
        <h4>PROJECT OVERVIEW</h4>
        <dl className="vf-review-list">
          <div className="vf-review-item">
            <dt>Name:</dt>
            <dd>{projectData.vision?.name || 'Not specified'}</dd>
          </div>
          <div className="vf-review-item">
            <dt>Description:</dt>
            <dd>{projectData.vision?.description || 'Not specified'}</dd>
          </div>
          <div className="vf-review-item">
            <dt>Tech Stack:</dt>
            <dd>{projectData.techStack?.selectedTemplate || 'Not selected'}</dd>
          </div>
        </dl>
      </div>

      <div className="vf-review-cta">
        <p>Ready to generate your project?</p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="vf-btn vf-btn-primary vf-btn-large"
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" />
              <span>GENERATING...</span>
            </>
          ) : (
            'GENERATE MY PROJECT'
          )}
        </button>
      </div>
    </div>
  );
};
