// Centralized configuration file for environment variables

// Application URLs - ensure no spaces by using string literals
export const APP_URL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL 
  ? process.env.NEXT_PUBLIC_APP_URL.trim() 
  : (typeof window !== 'undefined' ? window.location.origin : 'https://amsfacerecognition.vercel.app');

// Auth configuration - ensure no spaces by using string literals
export const AUTH_REDIRECT_URL = `${APP_URL.trim()}/auth/callback`.trim();

// Supabase configuration - ensure no spaces
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() 
  : 'https://rajdykbhqzagupzdfqix.supabase.co';
  
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() 
  : '';

// Face recognition configuration
export const FACE_SIMILARITY_THRESHOLD = 0.7; // Threshold for face matching (0-1)
export const MAX_FACE_SIZE = 250; // Maximum face size in pixels
export const MIN_FACE_SIZE = 50; // Minimum face size in pixels 