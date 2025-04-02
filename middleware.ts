import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// This middleware protects routes and handles redirects based on auth state
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get the pathname from the request
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/students', '/attendance', '/profile']
  
  // Authentication routes (login/signup)
  const authRoutes = ['/login', '/signup']
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if the path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route)
  
  // If user is not authenticated and tries to access a protected route
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    console.log('Redirecting unauthenticated user from protected route to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is authenticated and tries to access an auth route
  if (session && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url)
    console.log('Redirecting authenticated user from auth route to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }
  
  return response
}

// Configure which paths this middleware is applied to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 