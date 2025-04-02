import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// We need to access environment variables directly in server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const debugMode = true; // Enable detailed debugging

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  
  console.log('🔍 [AUTH CALLBACK] Request received at', new Date().toISOString());
  console.log('🔍 [AUTH CALLBACK] URL:', request.url);
  console.log('🔍 [AUTH CALLBACK] Using Supabase URL:', supabaseUrl);
  console.log('🔍 [AUTH CALLBACK] Code present:', !!code);
  console.log('🔍 [AUTH CALLBACK] State present:', !!state);
  console.log('🔍 [AUTH CALLBACK] All params:', Object.fromEntries(requestUrl.searchParams.entries()));

  // Handle potential error from OAuth provider
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  if (error) {
    console.error('❌ [AUTH CALLBACK] OAuth provider error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}?error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication error')}`
    )
  }

  if (code) {
    try {
      console.log('🔍 [AUTH CALLBACK] Exchanging code for session...');
      
      // Create a Supabase client for the route handler
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Log the environment data
      console.log('🔍 [AUTH CALLBACK] Supabase URL available:', !!supabaseUrl);
      console.log('🔍 [AUTH CALLBACK] Supabase key length:', supabaseAnonKey?.length || 0);
      
      // Exchange the code for a session
      console.log('🔍 [AUTH CALLBACK] Calling exchangeCodeForSession...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ [AUTH CALLBACK] Session exchange error:', error);
        return NextResponse.redirect(`${requestUrl.origin}?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
      }

      console.log('✅ [AUTH CALLBACK] Session exchange successful');
      console.log('🔍 [AUTH CALLBACK] User:', data?.session?.user?.email);
      console.log('🔍 [AUTH CALLBACK] Session expires at:', data?.session?.expires_at);
      
      // Set multiple cookies to track the auth flow
      const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
      // Set cookies to help debug
      response.cookies.set('auth_success', 'true', { 
        path: '/',
        maxAge: 60 * 5, // 5 minutes
        httpOnly: false, // Make visible to JS for debugging
      })
      
      response.cookies.set('auth_provider', 'google', { 
        path: '/',
        maxAge: 60 * 5,
        httpOnly: false,
      })
      
      response.cookies.set('auth_time', new Date().toISOString(), { 
        path: '/',
        maxAge: 60 * 5,
        httpOnly: false,
      })
      
      console.log('✅ [AUTH CALLBACK] Redirecting to dashboard with cookies set');
      return response
    } catch (err) {
      console.error('❌ [AUTH CALLBACK] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_callback_error&message=${encodeURIComponent(errorMessage)}`)
    }
  }

  console.log('⚠️ [AUTH CALLBACK] No code provided, redirecting to home');
  return NextResponse.redirect(`${requestUrl.origin}`)
} 