import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Check if this is a protected route
  if (isProtectedRoute(req)) {
    // Get the auth state
    const authState = await auth();

    // If user is not authenticated, redirect to home page
    if (!authState.userId) {
      const homeUrl = new URL('/', req.url);
      // Add a query parameter to indicate redirect reason
      homeUrl.searchParams.set('redirect', 'auth_required');
      return NextResponse.redirect(homeUrl);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
