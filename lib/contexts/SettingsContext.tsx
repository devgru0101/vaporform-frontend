'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';

export interface UserSettings {
  // Theme
  theme: 'dark' | 'light' | 'auto';
  primaryColor: string;
  fontSize: number;
  fontFamily: string;

  // Editor
  editorTheme: string;
  tabSize: number;
  autoSave: boolean;
  formatOnSave: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;

  // Agentic Code Engine
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  aiAutoComplete: boolean;
  aiProvider?: string;
  aiApiKey?: string;
  aiOAuthToken?: string;
  aiBaseUrl?: string;
  aiCustomModelId?: string;
  aiContextWindow?: number;
  aiEnablePromptCaching?: boolean;
  aiEnableStreaming?: boolean;
  aiAutoApproveEdits?: boolean;
  aiEnableDiffStrategy?: boolean;
  aiConsecutiveErrorLimit?: number;
  aiRateLimit?: number;
  aiMaxRequests?: number;

  // Terminal
  terminalFontSize: number;
  terminalCursorStyle: 'block' | 'line' | 'underline';
  terminalCursorBlink: boolean;

  // Performance
  maxFileSize: number;
  enableCache: boolean;
  preloadFiles: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  primaryColor: '#CAC4B7',
  fontSize: 14,
  fontFamily: 'Inter',

  editorTheme: 'vs-dark',
  tabSize: 2,
  autoSave: true,
  formatOnSave: true,
  minimap: true,
  lineNumbers: true,
  wordWrap: false,

  aiModel: 'claude-3-5-sonnet-20241022',
  aiTemperature: 0.7,
  aiMaxTokens: 8192,
  aiAutoComplete: true,
  aiProvider: 'anthropic',
  aiApiKey: '',
  aiBaseUrl: '',
  aiCustomModelId: '',
  aiContextWindow: 200000,
  aiEnablePromptCaching: true,
  aiEnableStreaming: true,
  aiAutoApproveEdits: false,
  aiEnableDiffStrategy: true,
  aiConsecutiveErrorLimit: 3,
  aiRateLimit: 0,
  aiMaxRequests: 0,

  terminalFontSize: 14,
  terminalCursorStyle: 'block',
  terminalCursorBlink: true,

  maxFileSize: 10,
  enableCache: true,
  preloadFiles: true,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const { showToast, showError } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<UserSettings>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Inject toast notifications into API client
  useEffect(() => {
    api.setToast(showToast);
  }, [showToast]);

  // Set up API token getter IMMEDIATELY - before any components try to use it
  useEffect(() => {
    console.log('[SettingsContext] Setting up token getter. isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

    // Only set token getter when Clerk is loaded and user is signed in
    if (isLoaded && isSignedIn && getToken) {
      api.setTokenGetter(async () => {
        try {
          // Get default session token (NO template parameter needed!)
          const token = await getToken();
          console.log('[SettingsContext] Token retrieved:', token ? `${token.substring(0, 30)}...` : 'null');

          // Validate token format (JWTs start with 'eyJ')
          if (token && !token.startsWith('eyJ')) {
            console.error('[SettingsContext] Invalid token format - not a JWT:', token.substring(0, 20));
            showError('Invalid authentication token. Please sign out and sign in again.');
            return null;
          }

          return token;
        } catch (error) {
          console.error('[SettingsContext] Error getting token:', error);
          showError('Failed to get authentication token.');
          return null;
        }
      });
    } else if (!isLoaded) {
      console.log('[SettingsContext] Clerk not loaded yet, waiting...');
    } else if (!isSignedIn) {
      console.log('[SettingsContext] User not signed in, skipping token getter setup');
    }
  }, [getToken, isLoaded, isSignedIn, showError]);

  // Load settings on mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadSettings();
    }
  }, [isLoaded, isSignedIn]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
    console.log('[SettingsContext] Checking for changes:', {
      hasChanges,
      settingsKeys: Object.keys(settings).length,
      savedSettingsKeys: Object.keys(savedSettings).length,
    });
    setHasUnsavedChanges(hasChanges);
  }, [settings, savedSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Try to load from backend API
      try {
        const response = await api.getUserSettings();
        if (response.settings) {
          // Normalize settings to ensure consistent field presence
          const normalizedSettings = {
            ...defaultSettings,
            ...response.settings,
          };
          console.log('[SettingsContext] Loaded settings from API:', normalizedSettings);
          setSettings(normalizedSettings);
          setSavedSettings(normalizedSettings);
          // Save non-sensitive settings to localStorage as backup (user-specific key)
          const { aiApiKey, aiOAuthToken, ...nonSensitiveSettings } = normalizedSettings;
          const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
          localStorage.setItem(storageKey, JSON.stringify(nonSensitiveSettings));
          return;
        }
      } catch (apiErr: any) {
        console.warn('Failed to load settings from API, trying localStorage:', apiErr);
      }

      // Fallback to localStorage if API fails (won't include sensitive fields)
      // Use user-specific key to prevent cross-user data leakage
      const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalizedSettings = { ...defaultSettings, ...parsed };
        setSettings(normalizedSettings);
        setSavedSettings(normalizedSettings);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    console.log('[SettingsContext] updateSettings called with:', updates);
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      console.log('[SettingsContext] New settings:', newSettings);
      return newSettings;
    });
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[SettingsContext] Saving settings:', settings);

      // Save non-sensitive settings to localStorage as backup (user-specific key)
      const { aiApiKey, aiOAuthToken, ...nonSensitiveSettings } = settings;
      const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
      localStorage.setItem(storageKey, JSON.stringify(nonSensitiveSettings));

      // Prepare settings for backend - only include sensitive fields if they have actual values
      // This prevents accidentally deleting keys from backend when they're not in localStorage
      const settingsToSend = { ...settings };
      if (!aiApiKey || aiApiKey.trim().length === 0) {
        delete settingsToSend.aiApiKey;
      }
      if (!aiOAuthToken || aiOAuthToken.trim().length === 0) {
        delete settingsToSend.aiOAuthToken;
      }

      console.log('[SettingsContext] Sending to backend:', settingsToSend);

      // Save to backend API
      try {
        const response = await api.updateUserSettings(settingsToSend);
        console.log('[SettingsContext] Backend response:', response);

        if (response.settings) {
          // Normalize response settings to match current settings structure
          const normalizedSavedSettings = {
            ...defaultSettings,
            ...response.settings,
          };
          console.log('[SettingsContext] Normalized saved settings:', normalizedSavedSettings);
          setSavedSettings(normalizedSavedSettings);
        } else {
          setSavedSettings(settings);
        }
      } catch (apiErr: any) {
        console.error('Failed to save settings to API:', apiErr);

        // Parse error message from backend
        let errorMessage = 'Failed to save settings to server.';

        if (apiErr.message) {
          errorMessage = apiErr.message;
        } else if (typeof apiErr === 'string') {
          errorMessage = apiErr;
        } else if (apiErr.error) {
          errorMessage = apiErr.error;
        }

        // Check for network errors
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        }

        setError(errorMessage);
        // Still mark as saved locally
        setSavedSettings(settings);
        throw new Error(errorMessage);
      }

      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      if (!error) {
        setError('Failed to save settings. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Reset in backend
      try {
        const response = await api.resetUserSettings();
        if (response.settings) {
          setSettings(response.settings);
          setSavedSettings(response.settings);
          const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
          localStorage.setItem(storageKey, JSON.stringify(response.settings));
        } else {
          setSettings(defaultSettings);
          setSavedSettings(defaultSettings);
          const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
          localStorage.removeItem(storageKey);
        }
      } catch (apiErr: any) {
        console.error('Failed to reset settings in API:', apiErr);
        // Reset locally anyway
        setSettings(defaultSettings);
        setSavedSettings(defaultSettings);
        const storageKey = userId ? `vaporform_settings_${userId}` : 'vaporform_settings';
        localStorage.removeItem(storageKey);
      }

      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to reset settings:', err);
      setError('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    // Guard: only open modal if user is authenticated
    if (!isSignedIn) {
      showError('Please sign in to access settings');
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettings,
        resetSettings,
        hasUnsavedChanges,
        isLoading,
        error,
        isModalOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
