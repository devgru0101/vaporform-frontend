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
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
