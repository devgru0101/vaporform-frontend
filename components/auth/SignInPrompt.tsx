'use client';

import { SignInButton, useAuth } from '@clerk/nextjs';

interface SignInPromptProps {
  message?: string;
}

export function SignInPrompt({ message = 'Please sign in to continue' }: SignInPromptProps) {
  const { isSignedIn } = useAuth();

  // Prevent rendering the sign-in button if already signed in
  // This avoids the "cannot_render_single_session_enabled" error from Clerk
  if (isSignedIn) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--vf-bg-primary, #000)',
      color: 'var(--vf-text-primary, #fff)',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '16px',
        }}>
          Authentication Required
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--vf-text-muted, #888)',
          marginBottom: '32px',
        }}>
          {message}
        </p>
        <SignInButton mode="modal">
          <button style={{
            backgroundColor: 'var(--vf-accent, #6366f1)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vf-accent-hover, #4f46e5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vf-accent, #6366f1)';
            }}>
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
