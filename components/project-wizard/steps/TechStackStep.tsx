'use client';

import React, { useCallback } from 'react';
import type { TechStack } from '@/lib/types/project';

interface Template {
  id: string;
  name: string;
  description: string;
}

// Props match ProjectCreationModal's internal data structure
interface TechStackStepProps {
  projectData: {
    techStack: TechStack;
  };
  updateProjectData: (updates: { techStack: TechStack }) => void;
}

const TEMPLATES: Template[] = [
  { id: 'encore-react', name: 'Encore.ts + React', description: 'Modern full-stack TypeScript' },
  { id: 'encore-solid', name: 'Encore.ts + Solid.js', description: 'High-performance reactive frontend' },
  { id: 'encore-vue', name: 'Encore.go + Vue 3', description: 'Scalable Go with Vue.js' },
];

export const TechStackStep: React.FC<TechStackStepProps> = ({
  projectData,
  updateProjectData
}) => {
  const selected = projectData.techStack.selectedTemplate || 'encore-react';

  const selectTemplate = useCallback((id: string) => {
    const newTechStack: TechStack = {
      ...projectData.techStack,
      selectedTemplate: id
    };
    updateProjectData({ techStack: newTechStack });
  }, [projectData.techStack, updateProjectData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTemplate(id);
    }
  }, [selectTemplate]);

  return (
    <div className="vf-wizard-step">
      <h3 className="vf-wizard-step-title">CHOOSE YOUR TECH STACK</h3>
      <p className="vf-wizard-step-description">
        Select the technology foundation for your project
      </p>

      <div className="vf-template-grid" role="radiogroup" aria-label="Tech stack options">
        {TEMPLATES.map(template => (
          <div
            key={template.id}
            role="radio"
            aria-checked={selected === template.id}
            tabIndex={0}
            className={`vf-card vf-card-interactive ${selected === template.id ? 'vf-card-selected' : ''}`}
            onClick={() => selectTemplate(template.id)}
            onKeyDown={(e) => handleKeyDown(e, template.id)}
          >
            <h4 className="vf-card-title">{template.name}</h4>
            <p className="vf-card-description">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
