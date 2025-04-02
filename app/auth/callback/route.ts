import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Auth callback handler received request', { url: request.url });
  console.log('Search params:', Object.fromEntries(requestUrl.searchParams.entries()));

  if (code) {
    try {
      console.log('Exchanging code for session...');
      
      // Create a Supabase client for the route handler
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
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