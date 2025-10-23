'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

/**
 * API Provider - Initializes the Vaporform API client with Clerk authentication
 * Must be rendered inside ClerkProvider
 */
export function APIProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter function for the API client
    api.setTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error('[APIProvider] Error getting token:', error);
        return null;
      }
    });

    console.log('[APIProvider] API client initialized with Clerk token getter');
  }, [getToken]);

  return <>{children}</>;
}
