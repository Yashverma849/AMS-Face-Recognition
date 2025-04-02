import { NextResponse } from 'next/server';

export async function GET() {
  // Gather environment variables for debugging
  const envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    supabaseKeyLength: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').length,
    supabaseKeyFirstChars: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').substring(0, 10),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };

  // Hide full keys for security
  return NextResponse.json({
    message: 'Auth environment variables',
    variables: envVars,
  });
} 