import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// This middleware protects routes and handles redirects based on auth state
export async function middleware(request: NextRequest) {
  // Create response to modify
  const res = NextResponse.next()
  
  // Skip middleware for public assets and API routes
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api') ||
    pathname === '/'  // Skip middleware for home page entirely
  ) {
    return res
  }
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('Middleware executing for path:', pathname, 'Session exists:', !!session)
  
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
    console.log('Public route, allowing access:', pathname)
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
    console.log('Protected route, no session - redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Case 2: Logged in, trying to access auth route -> redirect to dashboard
  if (session && isAuthRoute) {
    console.log('Auth route with session - redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Allow all other requests
  console.log('Allowing access to:', pathname)
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