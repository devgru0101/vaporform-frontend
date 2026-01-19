// Project Wizard Types

export interface ProjectVision {
  name: string;
  description: string;
  coreFeatures: string;
  targetAudience: string;
  projectGoals: string[];
  inspirationApps: string[];
}

export interface TechStack {
  selectedTemplate: string;
  backend?: string;
  frontend?: string;
  database?: string;
  customOptions?: Record<string, boolean>;
}

export interface Integrations {
  authentication?: string;
  payments?: string;
  analytics?: string;
  customIntegrations?: string[];
  [key: string]: unknown;
}

// ProjectData matches the internal ProjectWizardData structure
export interface ProjectData {
  creationType?: 'new' | 'github-import' | 'yolo';
  vision: ProjectVision;
  techStack: TechStack;
  integrations: Integrations;
}

// For partial updates from wizard steps
export interface ProjectDataUpdates {
  vision?: Partial<ProjectVision>;
  techStack?: Partial<TechStack>;
  integrations?: Partial<Integrations>;
}

// GitHub Import Types
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export interface GitHubBranch {
  name: string;
}

// Build Types
export interface BuildMetadata {
  version?: string;
  commit?: string;
  environment?: string;
  [key: string]: unknown;
}

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
  metadata?: BuildMetadata;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface BuildEventMetadata {
  progress?: number;
  details?: string;
  [key: string]: unknown;
}

export interface BuildEvent {
  id: string;
  build_id: string;
  event_type: 'phase_change' | 'log' | 'error' | 'warning' | 'progress';
  phase?: string;
  message?: string;
  metadata?: BuildEventMetadata;
  timestamp: Date;
}

// OpenRouter Model Types
export interface OpenRouterModelPricing {
  prompt: string;
  completion: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: OpenRouterModelPricing;
  context_length?: number;
  description?: string;
}
