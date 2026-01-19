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
    <div className="vf-auth-container">
      <div className="vf-auth-content">
        <h1 className="vf-auth-title">Authentication Required</h1>
        <p className="vf-auth-message">{message}</p>
        <SignInButton mode="modal">
          <button type="button" className="vf-auth-btn">
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
