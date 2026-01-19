'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectVision } from '@/lib/types/project';

// Props match ProjectCreationModal's internal data structure
interface ProjectVisionStepProps {
  projectData: {
    vision: ProjectVision;
  };
  updateProjectData: (updates: { vision: ProjectVision }) => void;
}

export const ProjectVisionStep: React.FC<ProjectVisionStepProps> = ({
  projectData,
  updateProjectData
}) => {
  const [formData, setFormData] = useState<ProjectVision>({
    name: projectData.vision.name || '',
    description: projectData.vision.description || '',
    coreFeatures: projectData.vision.coreFeatures || '',
    targetAudience: projectData.vision.targetAudience || '',
    projectGoals: projectData.vision.projectGoals || [],
    inspirationApps: projectData.vision.inspirationApps || []
  });

  const [currentGoal, setCurrentGoal] = useState('');

  // Use ref to track if we need to sync - prevents infinite loop on initial mount
  const isInitialMount = useRef(true);

  // Sync form data to parent, but skip on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateProjectData({
      vision: formData
    });
  }, [formData, updateProjectData]);

  const handleChange = useCallback(<K extends keyof ProjectVision>(field: K, value: ProjectVision[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addGoal = useCallback(() => {
    if (currentGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        projectGoals: [...prev.projectGoals, currentGoal.trim()]
      }));
      setCurrentGoal('');
    }
  }, [currentGoal]);

  const removeGoal = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      projectGoals: prev.projectGoals.filter((_, i) => i !== index)
    }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGoal();
    }
  }, [addGoal]);

  return (
    <div className="vf-wizard-step">
      <h3 className="vf-wizard-step-title">DESCRIBE YOUR PROJECT VISION</h3>
      <p className="vf-wizard-step-description">
        Tell us what you want to build - the more detail, the better the result
      </p>

      <div className="vf-wizard-form">
        <div className="vf-form-group">
          <label htmlFor="project-name" className="vf-form-label required">PROJECT NAME</label>
          <input
            id="project-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., TaskFlow Pro, EcoMarket, GameHub"
            className="vf-form-input"
            maxLength={50}
            aria-describedby="project-name-hint"
          />
          <span id="project-name-hint" className="vf-form-hint">{formData.name.length}/50 characters</span>
        </div>

        <div className="vf-form-group">
          <label htmlFor="project-description" className="vf-form-label required">PROJECT DESCRIPTION</label>
          <textarea
            id="project-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your project in detail. What problem does it solve? Who is it for?"
            className="vf-form-textarea"
            rows={4}
            maxLength={1000}
            aria-describedby="project-description-hint"
          />
          <span id="project-description-hint" className="vf-form-hint">{formData.description.length}/1000 characters</span>
        </div>

        <div className="vf-form-group">
          <label htmlFor="core-features" className="vf-form-label required">CORE FUNCTIONALITY</label>
          <textarea
            id="core-features"
            value={formData.coreFeatures}
            onChange={(e) => handleChange('coreFeatures', e.target.value)}
            placeholder="List the main features and user flows..."
            className="vf-form-textarea"
            rows={3}
            maxLength={2000}
            aria-describedby="core-features-hint"
          />
          <span id="core-features-hint" className="vf-form-hint">{formData.coreFeatures.length}/2000 characters</span>
        </div>

        <div className="vf-form-group">
          <label htmlFor="target-audience" className="vf-form-label">TARGET AUDIENCE</label>
          <input
            id="target-audience"
            type="text"
            value={formData.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
            placeholder="e.g., Small business owners, Students, Developers"
            className="vf-form-input"
            maxLength={100}
          />
        </div>

        <div className="vf-form-group">
          <label id="project-goals-label" className="vf-form-label">PROJECT GOALS</label>
          <ul className="vf-goal-list" aria-labelledby="project-goals-label" role="list">
            {formData.projectGoals.map((goal, index) => (
              <li key={`goal-${index}`} className="vf-goal-item">
                <span>{goal}</span>
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="vf-goal-remove"
                  aria-label={`Remove goal: ${goal}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="vf-goal-input-row">
            <input
              type="text"
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a project goal..."
              className="vf-form-input"
              aria-label="New project goal"
            />
            <button
              type="button"
              onClick={addGoal}
              className="vf-btn vf-btn-secondary"
            >
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
