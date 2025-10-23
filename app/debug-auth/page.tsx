'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();
  const [tokenInfo, setTokenInfo] = useState<{
    token: string | null;
    error: string | null;
    timestamp: string;
  } | null>(null);

  const fetchToken = async () => {
    if (!getToken) {
      setTokenInfo({
        token: null,
        error: 'getToken function not available',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      console.log('[Debug] Calling getToken()...');
      const token = await getToken();
      console.log('[Debug] Raw token received:', token);
      console.log('[Debug] Token type:', typeof token);
      console.log('[Debug] Token length:', token?.length);

      setTokenInfo({
        token: token || 'NULL',
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Debug] Error getting token:', error);
      setTokenInfo({
        token: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    console.log('[Debug Auth Page] Clerk state changed:', {
      isLoaded,
      isSignedIn,
      userId,
      sessionId,
    });
  }, [isLoaded, isSignedIn, userId, sessionId]);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#000',
      color: '#0f0',
      minHeight: '100vh',
    }}>
      <h1 style={{ borderBottom: '2px solid #0f0', paddingBottom: '10px' }}>
        🔍 Clerk Authentication Debug Panel
      </h1>

      <div style={{ marginTop: '20px' }}>
        <h2>Clerk Auth State:</h2>
        <pre style={{ backgroundColor: '#111', padding: '10px', borderLeft: '3px solid #0f0' }}>
{JSON.stringify({
  isLoaded,
  isSignedIn,
  userId: userId || 'NULL',
  sessionId: sessionId || 'NULL',
  getTokenAvailable: !!getToken,
}, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>User Info:</h2>
        <pre style={{ backgroundColor: '#111', padding: '10px', borderLeft: '3px solid #0f0' }}>
{user ? JSON.stringify({
  id: user.id,
  primaryEmailAddress: user.primaryEmailAddress?.emailAddress,
  firstName: user.firstName,
  lastName: user.lastName,
  createdAt: user.createdAt,
}, null, 2) : 'User not loaded'}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={fetchToken}
          disabled={!isLoaded || !isSignedIn}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoaded && isSignedIn ? '#0f0' : '#666',
            color: '#000',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoaded && isSignedIn ? 'pointer' : 'not-allowed',
          }}
        >
          🎫 Fetch Token from Clerk
        </button>
      </div>

      {tokenInfo && (
        <div style={{ marginTop: '20px' }}>
          <h2>Token Info (fetched at {tokenInfo.timestamp}):</h2>
          {tokenInfo.error ? (
            <pre style={{ backgroundColor: '#300', padding: '10px', borderLeft: '3px solid #f00', color: '#f00' }}>
ERROR: {tokenInfo.error}
            </pre>
          ) : (
            <>
              <pre style={{ backgroundColor: '#111', padding: '10px', borderLeft: '3px solid #0f0' }}>
Token Value: {tokenInfo.token}
Token Length: {tokenInfo.token?.length}
Starts with 'eyJ': {tokenInfo.token?.startsWith('eyJ') ? 'YES ✅' : 'NO ❌'}
              </pre>

              {tokenInfo.token && (
                <div style={{ marginTop: '10px' }}>
                  <h3>Token Preview (first 100 chars):</h3>
                  <pre style={{ backgroundColor: '#111', padding: '10px', borderLeft: '3px solid #ff0', color: '#ff0', wordWrap: 'break-word' }}>
{tokenInfo.token.substring(0, 100)}...
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '40px', borderTop: '2px solid #0f0', paddingTop: '20px' }}>
        <h2>Environment Variables:</h2>
        <pre style={{ backgroundColor: '#111', padding: '10px', borderLeft: '3px solid #0f0' }}>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'NOT SET'}
NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', color: '#888' }}>
        <p>
          <strong>How to use:</strong><br/>
          1. Ensure you are signed in to Clerk<br/>
          2. Click "Fetch Token from Clerk" button<br/>
          3. Check if the token starts with 'eyJ' (valid JWT format)<br/>
          4. If token is "test" or similar, Clerk authentication isn't working properly
        </p>
      </div>
    </div>
  );
}
