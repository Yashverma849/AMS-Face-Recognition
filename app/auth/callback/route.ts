import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// We need to access environment variables directly in server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  
  console.log('Auth callback handler received request', { url: request.url });
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('Search params:', Object.fromEntries(requestUrl.searchParams.entries()));

  // Handle potential error from OAuth provider
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  if (error) {
    console.error('OAuth provider returned an error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}?error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication error')}`
    )
  }

  if (code) {
    try {
      console.log('Exchanging code for session...', { hasState: !!state });
      
      // Create a Supabase client for the route handler with explicit credentials
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Log the environment data
      console.log('Supabase URL available:', !!supabaseUrl);
      console.log('Supabase key length:', supabaseAnonKey?.length || 0);
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
      }

      console.log('Successfully exchanged code for session, user:', data?.session?.user?.email);
      
      // Redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_callback_error&message=${encodeURIComponent(errorMessage)}`)
    }
  }

  console.log('No code provided in auth callback');
  // No code provided, redirect to home
  return NextResponse.redirect(`${requestUrl.origin}`)
} 