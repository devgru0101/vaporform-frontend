/**
 * API Client for Vaporform Backend
 * Client-side compatible version with enhanced error handling and request queuing
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Type for toast notification function (will be injected)
type ShowToastFn = (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;

export class VaporformAPI {
  private tokenGetter?: () => Promise<string | null>;
  private showToast?: ShowToastFn;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private isInitialized = false;
  private initPromise: Promise<void>;
  private initResolve: (() => void) | null = null;

  constructor() {
    this.initPromise = new Promise<void>((resolve) => {
      this.initResolve = resolve;
    });
  }

  /**
   * Set the token getter function (should be called from useAuth hook)
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    console.log('[API] Token getter has been set');
    this.tokenGetter = getter;
    this.isInitialized = true;

    // Resolve the initialization promise
    if (this.initResolve) {
      this.initResolve();
      this.initResolve = null; // Ensure only resolved once
    }

    // Process any queued requests now that we have a token getter
    this.processQueue();
  }

  /**
   * Set the toast notification function
   */
  setToast(showToast: ShowToastFn) {
    this.showToast = showToast;
  }

  /**
   * Process queued requests
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0 || !this.tokenGetter) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`[API] Processing ${this.requestQueue.length} queued requests`);

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('[API] Queued request failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Wait for initialization (race with timeout to prevent infinite hanging)
    if (!this.isInitialized) {
      console.log('[API] Waiting for token getter initialization...');
      // Wait up to 5 seconds for initialization
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('API initialization timeout')), 5000));
      try {
        await Promise.race([this.initPromise, timeoutPromise]);
      } catch (e) {
        console.warn('[API] Proceeding without token getter after timeout');
      }
    }

    let token: string | null = null;

    if (this.tokenGetter) {
      try {
        token = await this.tokenGetter();
        console.log('[API] Token from getter:', token ? `${token.substring(0, 30)}...` : 'null');

        // Validate token format (JWTs start with 'eyJ')
        if (token && !token.startsWith('eyJ')) {
          console.error('[API] Invalid token format - not a JWT:', token.substring(0, 20));
          this.showToast?.('Invalid authentication token. Please sign out and sign in again.', 'error');
          token = null;
        }
      } catch (error) {
        console.error('[API] Error getting token:', error);
        token = null;
      }
    } else {
      console.error('[API] No tokenGetter set! Call setTokenGetter first.');
    }

    if (!token) {
      console.error('[API] Authentication token is missing. User may not be signed in or Clerk is not initialized.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Enhanced fetch with global error handling and 401/403 detection
   */
  private async fetchWithErrorHandling(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Handle authentication errors globally
      if (response.status === 401 || response.status === 403) {
        console.error(`[API] ${response.status} error - redirecting to sign in`);
        this.showToast?.(
          'Your session has expired. Please sign in again.',
          'error'
        );

        // Clear any stored data
        localStorage.clear();

        // Redirect to home page after a brief delay
        setTimeout(() => {
          window.location.href = '/?redirect=session_expired';
        }, 1500);

        throw new Error('Authentication required');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Not JSON, use default error message
        }

        console.error(`[API] Request failed:`, errorMessage);
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      // Network errors or other fetch failures
      if (error instanceof Error && error.message === 'Authentication required') {
        throw error;
      }

      console.error('[API] Network or fetch error:', error);
      this.showToast?.(
        'Network error. Please check your connection and try again.',
        'error'
      );
      throw error;
    }
  }

  // Projects
  async createProject(name: string, template?: string) {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, template }),
    });

    return response.json();
  }

  async listProjects() {
    const headers = await this.getAuthHeaders();
    console.log('[API] listProjects - fetching from:', `${API_URL}/projects`);

    try {
      const response = await fetch(`${API_URL}/projects`, { headers });
      console.log('[API] listProjects - response status:', response.status);
      console.log('[API] listProjects - response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] listProjects - error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[API] listProjects - success, projects count:', data.projects?.length || 0);
      return data;
    } catch (error) {
      console.error('[API] listProjects - fetch failed:', error);
      throw error;
    }
  }

  async getProject(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/projects/${projectId}`, { headers });
    return response.json();
  }

  async deleteProject(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // VFS - Files
  async listDirectory(projectId: string, path: string = '/') {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/vfs/directories/${projectId}?path=${encodeURIComponent(path)}`, {
      headers,
    });
    return response.json();
  }

  async readFile(projectId: string, path: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/vfs/files/${projectId}/${path}`, { headers });
    return response.json();
  }

  async writeFile(projectId: string, path: string, content: string, encoding: 'utf-8' | 'base64' = 'utf-8') {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/vfs/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, path, content, encoding }),
    });
    return response.json();
  }

  async createDirectory(projectId: string, path: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/vfs/directories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, path }),
    });
    return response.json();
  }

  async deleteFile(projectId: string, path: string, recursive: boolean = false) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/vfs/files/${projectId}/${path}?recursive=${recursive}`, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  }

  // Git
  async initGit(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId }),
    });
    return response.json();
  }

  // GitHub Integration
  async getGitHubConnection(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/github/connection/${projectId}`, { headers });
    if (!response.ok && response.status === 404) {
      return { connected: false };
    }
    return response.json();
  }

  async connectGitHub(projectId: string, pat: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/github/connect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, pat }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async listGitHubRepos(pat: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/github/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pat }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createGitHubRepo(pat: string, name: string, isPrivate: boolean) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/github/create-repo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pat, name, private: isPrivate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async pushToGitHub(projectId: string, pat: string, repoFullName: string, branch: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/git/github/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, pat, repoFullName, branch }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Project Generation
  async generateProject(projectId: string, wizardData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/projects/${projectId}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ wizardData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getGenerationStatus(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/projects/${projectId}/generation/status`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getProjectGenerationLogs(projectId: string, limit?: number) {
    const headers = await this.getAuthHeaders();
    const url = `${API_URL}/projects/${projectId}/generation/logs${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // AI Chat
  async createChatSession(projectId: string, title?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, title }),
    });
    return response.json();
  }

  async listChatSessions(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/projects/${projectId}/sessions`, { headers });
    return response.json();
  }

  async getChatMessages(sessionId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/sessions/${sessionId}/messages`, { headers });
    return response.json();
  }

  async addChatMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ role, content, metadata }),
    });
    return response.json();
  }

  async getAgentTools() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/agent/tools`, { headers });
    return response.json();
  }

  async executeAgentTool(projectId: string, toolUse: { id: string; name: string; input: any }, workspaceId?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/agent/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, toolUse, workspaceId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Terminal
  async createTerminalSession(projectId: string, workspaceId?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/terminal/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, workspaceId }),
    });
    return response.json();
  }

  // Terminal Agent
  async sendTerminalAgentMessage(params: {
    projectId: string;
    message: string;
    sessionId?: string;
    workspaceId?: string;
  }) {
    const headers = await this.getAuthHeaders();

    // Extract token from headers for body
    const token = headers['Authorization']?.replace('Bearer ', '') || '';

    const response = await fetch(`${API_URL}/ai/terminal-agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...params,
        authorization: `Bearer ${token}`, // Backend expects it in body
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Workspace
  async getProjectWorkspace(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/project/${projectId}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No workspace found
      }
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createWorkspace(projectId: string, name: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async forceRebuildWorkspace(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/rebuild/${projectId}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getTerminalUrl(workspaceId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/${workspaceId}/terminal-url`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getSandboxUrl(workspaceId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/${workspaceId}/url`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Deployment
  async createDeployment(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/deploy/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId }),
    });
    return response.json();
  }

  async getProjectDeployment(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/deploy/project/${projectId}`, { headers });
    return response.json();
  }

  // Billing
  async getQuotaStatus() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/billing/quota`, { headers });
    return response.json();
  }

  // User Settings
  async getUserSettings() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/users/settings`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async updateUserSettings(settings: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/users/settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async resetUserSettings() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/users/settings/reset`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Build Management APIs
  async listBuilds(projectId: string, limit: number = 20): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/builds/${projectId}?limit=${limit}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to list builds: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.builds || [];
  }

  async getBuildStatus(buildId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/build/${buildId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get build: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.build || data;
  }

  async getBuildEvents(buildId: string, limit: number = 100): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workspace/build/${buildId}/events?limit=${limit}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get build events: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.events || [];
  }

  // OpenRouter Models
  async getOpenRouterModels(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/users/settings/openrouter/models`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data.models || [];
  }

  // AI Models
  async listAvailableModels(): Promise<{ models: any[] }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/ai/models`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    return data;
  }

  // Git Operations  
  async initRepository(projectId: string, defaultBranch: string = 'main'): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, defaultBranch }),
    });
    return response.json();
  }

  async getHistory(projectId: string, limit: number = 20): Promise<{ commits: any[]; total: number }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/history/${projectId}?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    return response.json();
  }

  async listBranches(projectId: string): Promise<{ branches: any[] }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/branches/${projectId}`, {
      method: 'GET',
      headers,
    });
    return response.json();
  }

  async createCommit(projectId: string, message: string, files?: string[]): Promise<{ commit: any }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/commit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, message, files }),
    });
    return response.json();
  }

  async createBranch(projectId: string, branchName: string): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/branch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, branchName }),
    });
    return response.json();
  }

  async checkoutBranch(projectId: string, branchName: string): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithErrorHandling(`${API_URL}/git/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, branchName }),
    });
    return response.json();
  }
}

// Export singleton instance
export const api = new VaporformAPI();
