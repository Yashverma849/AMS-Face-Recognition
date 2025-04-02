import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Debug indicator
const DEBUG_MIDDLEWARE = true;

// This middleware protects routes and handles redirects based on auth state
export async function middleware(request: NextRequest) {
  // Create response to modify
  const res = NextResponse.next()
  
  // Skip middleware for public assets, API routes and home page
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api') ||
    pathname === '/'  // Skip middleware for home page entirely
  ) {
    return res
  }
  
  // Get all cookies for debugging
  const debugCookies = DEBUG_MIDDLEWARE ? 
    Object.fromEntries(Array.from(request.cookies.getAll()).map(c => [c.name, c.value])) : {};
  
  // Skip middleware for the auth callback page - this is critical for OAuth
  if (pathname.startsWith('/auth/callback')) {
    console.log('🔍 [MIDDLEWARE] Auth callback path detected, skipping middleware');
    if (DEBUG_MIDDLEWARE) {
      console.log('🔍 [MIDDLEWARE] Cookies on callback:', JSON.stringify(debugCookies));
    }
    return res;
  }
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (DEBUG_MIDDLEWARE) {
    console.log('🔍 [MIDDLEWARE] Path:', pathname);
    console.log('🔍 [MIDDLEWARE] Session exists:', !!session);
    if (sessionError) {
      console.log('❌ [MIDDLEWARE] Session error:', sessionError.message);
    }
    console.log('🔍 [MIDDLEWARE] User:', session?.user?.email);
    console.log('🔍 [MIDDLEWARE] Cookies:', JSON.stringify(debugCookies));
    
    if (session) {
      // Log session details if available
      const expiresAt = session.expires_at;
      if (expiresAt) {
        console.log('🔍 [MIDDLEWARE] Session expires:', new Date(expiresAt * 1000).toISOString());
      }
      // Access user creation date rather than session creation
      if (session.user?.created_at) {
        console.log('🔍 [MIDDLEWARE] User created:', session.user.created_at);
      }
    }
  }
  
  // Handle user trying to access the dashboard directly after login
  if (pathname === '/dashboard') {
    if (session) {
      console.log('✅ [MIDDLEWARE] Authenticated user accessing dashboard - allowing');
      return res;
    } else {
      console.log('❌ [MIDDLEWARE] Unauthenticated user tried to access dashboard');
      
      // Check if they have an auth cookie - this means they just completed OAuth 
      // but middleware might not see the session yet
      if (request.cookies.get('auth_success')?.value === 'true') {
        console.log('🔍 [MIDDLEWARE] Auth success cookie found - allowing dashboard access');
        return res;
      }
    }
  }
  
  // Define route groups
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard', 
    '/students', 
    '/attendance', 
    '/profile', 
    '/register-student', 
    '/take-attendance', 
    '/view-attendance'
  ]
  
  // Authentication routes (login/signup)
  const authRoutes = ['/login', '/signup']
  
  // Public routes - always accessible
  const publicRoutes = ['/', '/auth/callback', '/test-auth']
  
  // Check if this is a public route - always allow
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    console.log('🔍 [MIDDLEWARE] Public route, allowing access:', pathname)
    return res
  }
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  // Check if this is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route)
  
  // Logic for redirects
  
  // Case 1: Not logged in, trying to access protected route -> redirect to login
  if (!session && isProtectedRoute) {
    console.log('❌ [MIDDLEWARE] Protected route with no session - redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Case 2: Logged in, trying to access auth route -> redirect to dashboard
  if (session && isAuthRoute) {
    console.log('🔍 [MIDDLEWARE] Auth route with active session - redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Allow all other requests
  console.log('✅ [MIDDLEWARE] Allowing access to:', pathname);
  return res
}

// Configure which paths this middleware is applied to
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 