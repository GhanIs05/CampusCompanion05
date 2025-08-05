// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/api/forums',
    '/api/resources',
    '/api/events',
    '/api/users'
  ];

  // Define admin-only routes
  const adminRoutes = [
    '/api/admin',
    '/api/moderate'
  ];

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isAdminRoute) {
    // Check for authentication token in cookies or headers
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For admin routes, we'll need to verify the role in the API route
    // as middleware can't easily make async calls to verify tokens
    if (isAdminRoute) {
      // Pass the token to the API route for role verification
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-auth-token', token);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/((?!auth|public).*)' // Match all API routes except auth and public
  ]
};
