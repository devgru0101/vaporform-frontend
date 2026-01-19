// GitHub Import Step Components
import React from 'react';
import { Spinner } from '@/components/shared';
import type { GitHubRepo, GitHubBranch } from '@/lib/types/project';

// Re-export types for consumers
export type { GitHubRepo, GitHubBranch };

// GitHub icon SVG component
const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

// Branch icon SVG component
const BranchIcon: React.FC<{ selected?: boolean }> = ({ selected }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected ? 'var(--vf-accent-primary)' : 'var(--vf-text-secondary)'} strokeWidth="2">
    <line x1="6" y1="3" x2="6" y2="15"/>
    <circle cx="18" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
);

// Checkmark icon
const CheckIcon: React.FC<{ size?: number; strokeWidth?: number }> = ({ size = 12, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Lock icon for private repos
const LockIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--vf-accent-danger)" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// Public repo icon
const PublicRepoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--vf-accent-secondary)" strokeWidth="2">
    <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/>
    <path d="M3 7l9-5 9 5"/>
  </svg>
);

// Step 1: GitHub PAT Input
export const renderGitHubPATStep = (
  pat: string,
  onPATChange: (pat: string) => void,
  onFetchRepos: () => void,
  isLoading: boolean,
  error: string | null
): React.ReactElement => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pat && !isLoading) {
      onFetchRepos();
    }
  };

  return (
    <div className="vf-github-step">
      <div className="vf-github-step-header">
        <h3 className="vf-wizard-step-title">CONNECT YOUR GITHUB ACCOUNT</h3>
        <p className="vf-wizard-step-description">
          Enter your Personal Access Token to access your repositories
        </p>
      </div>

      {/* PAT Input */}
      <div className="vf-form-group">
        <label htmlFor="github-pat" className="vf-form-label required">
          GITHUB PERSONAL ACCESS TOKEN
        </label>
        <input
          id="github-pat"
          type="password"
          value={pat}
          onChange={(e) => onPATChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="vf-form-input vf-form-input-mono"
          aria-describedby="github-pat-hint"
          autoComplete="off"
        />
        <p id="github-pat-hint" className="vf-form-hint">
          Need a token? Create one at:{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo"
            target="_blank"
            rel="noopener noreferrer"
            className="vf-link"
          >
            github.com/settings/tokens
          </a>
        </p>
      </div>

      {/* Fetch Repos Button */}
      <button
        type="button"
        onClick={onFetchRepos}
        disabled={!pat || isLoading}
        className={`vf-btn vf-btn-large ${pat && !isLoading ? 'vf-btn-primary' : ''}`}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>FETCHING REPOSITORIES...</span>
          </>
        ) : (
          <>
            <GitHubIcon />
            <span>LOAD MY REPOSITORIES</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="vf-alert vf-alert-error" role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </div>
      )}

      {/* Info Box */}
      <div className="vf-info-box">
        <h4 className="vf-info-box-title">TOKEN REQUIREMENTS</h4>
        <ul className="vf-info-box-list">
          <li>Token must have <strong>repo</strong> scope</li>
          <li>Your token is securely stored and never shared</li>
          <li>Token is only used to clone your selected repository</li>
        </ul>
      </div>
    </div>
  );
};

// Step 2: Repository Selection
export const renderRepositorySelectionStep = (
  repos: GitHubRepo[],
  selectedRepo: GitHubRepo | undefined,
  onSelectRepo: (repo: GitHubRepo) => void,
  isLoading: boolean
): React.ReactElement => {
  const handleKeyDown = (e: React.KeyboardEvent, repo: GitHubRepo) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRepo(repo);
    }
  };

  return (
    <div className="vf-github-step">
      <div className="vf-github-step-header">
        <h3 className="vf-wizard-step-title">SELECT A REPOSITORY</h3>
        <p className="vf-wizard-step-description">
          Choose the repository you want to import ({repos.length} repositories found)
        </p>
      </div>

      {isLoading ? (
        <div className="vf-loading-state" role="status">
          <Spinner size="lg" color="var(--vf-accent-primary)" label="Loading repositories" />
          <p className="vf-loading-text">LOADING REPOSITORIES...</p>
        </div>
      ) : repos.length === 0 ? (
        <div className="vf-empty-state">
          <p>No repositories found. Make sure your token has the &quot;repo&quot; scope.</p>
        </div>
      ) : (
        <div
          className="vf-repo-grid"
          role="listbox"
          aria-label="Repository selection"
        >
          {repos.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id;
            return (
              <div
                key={repo.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => onSelectRepo(repo)}
                onKeyDown={(e) => handleKeyDown(e, repo)}
                className={`vf-card vf-card-interactive ${isSelected ? 'vf-card-selected' : ''}`}
              >
                {isSelected && (
                  <div className="vf-card-check">
                    <CheckIcon strokeWidth={3} />
                  </div>
                )}
                <div className="vf-repo-header">
                  {repo.private ? <LockIcon /> : <PublicRepoIcon />}
                  <h4 className="vf-card-title">{repo.name}</h4>
                </div>
                <p className="vf-repo-fullname">{repo.full_name}</p>
                {repo.description && (
                  <p className="vf-card-description">{repo.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Step 3: Branch Selection
export const renderBranchSelectionStep = (
  branches: GitHubBranch[],
  selectedBranch: string | undefined,
  defaultBranch: string,
  onSelectBranch: (branch: string) => void,
  isLoading: boolean
): React.ReactElement => {
  const handleKeyDown = (e: React.KeyboardEvent, branchName: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectBranch(branchName);
    }
  };

  return (
    <div className="vf-github-step vf-github-step-narrow">
      <div className="vf-github-step-header">
        <h3 className="vf-wizard-step-title">SELECT A BRANCH</h3>
        <p className="vf-wizard-step-description">
          Choose which branch to import ({branches.length} branches available)
        </p>
      </div>

      {isLoading ? (
        <div className="vf-loading-state" role="status">
          <Spinner size="lg" color="var(--vf-accent-primary)" label="Loading branches" />
          <p className="vf-loading-text">LOADING BRANCHES...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="vf-empty-state">
          <p>No branches found for this repository.</p>
        </div>
      ) : (
        <div
          className="vf-branch-list"
          role="listbox"
          aria-label="Branch selection"
        >
          {branches.map((branch) => {
            const isSelected = selectedBranch === branch.name;
            const isDefault = branch.name === defaultBranch;
            return (
              <div
                key={branch.name}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => onSelectBranch(branch.name)}
                onKeyDown={(e) => handleKeyDown(e, branch.name)}
                className={`vf-card vf-card-interactive vf-branch-card ${isSelected ? 'vf-card-selected' : ''}`}
              >
                <BranchIcon selected={isSelected} />
                <div className="vf-branch-info">
                  <span className={`vf-branch-name ${isSelected ? 'vf-branch-name-selected' : ''}`}>
                    {branch.name}
                  </span>
                  {isDefault && (
                    <span className="vf-badge vf-badge-secondary">DEFAULT</span>
                  )}
                </div>
                {isSelected && (
                  <CheckIcon size={20} strokeWidth={3} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
