// Centralized configuration file for environment variables

// Application URLs
export const APP_URL = 
  process.env.NEXT_PUBLIC_APP_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'https://amsfacerecognition.vercel.app');

// Auth configuration
export const AUTH_REDIRECT_URL = `${APP_URL}/auth/callback`.trim();

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Face recognition configuration
export const FACE_SIMILARITY_THRESHOLD = 0.7; // Threshold for face matching (0-1)
export const MAX_FACE_SIZE = 250; // Maximum face size in pixels
export const MIN_FACE_SIZE = 50; // Minimum face size in pixels 