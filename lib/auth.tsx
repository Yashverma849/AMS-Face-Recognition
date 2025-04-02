"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import React from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AUTH_REDIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config'

// Debug mode flag
const DEBUG_AUTH = true;

// Auth context type
type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signOut: () => Promise<void>
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Parse auth cookies helper
type AuthCookies = {
  auth_success?: string;
  auth_provider?: string;
  auth_time?: string;
  [key: string]: string | undefined;
};

function getAuthCookies(): AuthCookies | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie
    .split(';')
    .map(cookie => cookie.trim().split('='))
    .filter(([name]) => name.startsWith('auth_'))
    .reduce<AuthCookies>((acc, [name, value]) => ({ 
      ...acc, 
      [name]: decodeURIComponent(value) 
    }), {});
    
  return Object.keys(cookies).length > 0 ? cookies : null;
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChangeCount, setAuthChangeCount] = useState(0) // For debugging
  const [authCookies, setAuthCookies] = useState<AuthCookies | null>(null)
  const router = useRouter()
  
  // Debug environment variables
  if (DEBUG_AUTH) {
    console.log("🔍 [AUTH CTX] Initializing auth context");
    console.log("🔍 [AUTH CTX] Supabase URL available:", !!SUPABASE_URL);
    console.log("🔍 [AUTH CTX] Supabase key length:", SUPABASE_ANON_KEY?.length || 0);
    console.log("🔍 [AUTH CTX] Redirect URL:", AUTH_REDIRECT_URL);
  }
  
  // Initialize Supabase client with explicit config
  const supabase = createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  })

  // Debug the client
  if (DEBUG_AUTH) {
    console.log("🔍 [AUTH CTX] Supabase client initialized:", !!supabase);
  }

  // Check for auth cookies on mount
  useEffect(() => {
    const cookies = getAuthCookies();
    if (cookies) {
      setAuthCookies(cookies);
      console.log("🔍 [AUTH CTX] Found auth cookies:", cookies);
      
      if (cookies.auth_success === 'true' && cookies.auth_provider === 'google') {
        console.log("✅ [AUTH CTX] Google auth cookie detected, refreshing session");
        
        // Don't trigger an immediate redirect if we detect auth cookies
        // Instead, let's ensure we refresh the session
        const refreshSession = async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error("❌ [AUTH CTX] Error refreshing session after Google auth:", error);
            } else if (data?.session) {
              console.log("✅ [AUTH CTX] Successfully refreshed session after Google auth");
              setSession(data.session);
              setUser(data.session.user);
              
              // Clear the auth cookies since we successfully got the session
              document.cookie = 'auth_success=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'auth_provider=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'auth_time=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
              
              // Force router refresh to ensure middleware picks up the new session
              setTimeout(() => {
                router.refresh();
                
                // If we're not on the dashboard, go there
                if (window.location.pathname !== '/dashboard') {
                  console.log("🔍 [AUTH CTX] Redirecting to dashboard after session refresh");
                  router.replace('/dashboard');
                }
              }, 100);
            }
          } catch (err) {
            console.error("❌ [AUTH CTX] Unexpected error refreshing session:", err);
          }
        };
        
        refreshSession();
      }
    }
  }, [router, supabase]);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      if (DEBUG_AUTH) {
        console.log("🔍 [AUTH CTX] Getting initial session");
        console.log("🔍 [AUTH CTX] Using Supabase URL:", SUPABASE_URL)
        console.log("🔍 [AUTH CTX] Auth key length:", SUPABASE_ANON_KEY?.length || 0)
      }
      
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("❌ [AUTH CTX] Session error:", error)
        }
        
        if (!error && data?.session) {
          if (DEBUG_AUTH) {
            console.log("✅ [AUTH CTX] Initial session found for user:", data.session.user?.email);
            console.log("🔍 [AUTH CTX] Session expires at:", new Date((data.session.expires_at || 0) * 1000).toISOString());
          }
          setSession(data.session)
          setUser(data.session.user)
        } else {
          if (DEBUG_AUTH) {
            console.log("⚠️ [AUTH CTX] No initial session found");
          }
        }
        
        setLoading(false)
      } catch (err) {
        console.error("❌ [AUTH CTX] Unexpected error getting session:", err);
        setLoading(false);
      }
    }
    
    getSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Increment change counter for debugging
      setAuthChangeCount(prev => prev + 1);
      
      if (DEBUG_AUTH) {
        console.log(`🔍 [AUTH CTX] Auth state changed (${_event}):`, !!session);
        console.log("🔍 [AUTH CTX] Change #:", authChangeCount + 1);
        console.log("🔍 [AUTH CTX] User email:", session?.user?.email);
        console.log("🔍 [AUTH CTX] Event:", _event);
        
        if (session?.expires_at) {
          console.log("🔍 [AUTH CTX] Session expires:", new Date(session.expires_at * 1000).toISOString());
        }
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Only refresh on sign-in, not sign-out
      if (_event === 'SIGNED_IN') {
        if (DEBUG_AUTH) {
          console.log("✅ [AUTH CTX] User signed in, refreshing router");
        }
        router.refresh();
      }
      // Sign-out is handled explicitly in the signOut method
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, authChangeCount])

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    try {
      if (DEBUG_AUTH) {
        console.log(`🔍 [AUTH CTX] Attempting to sign in user: ${email}`);
      }
      
      // Validate email and password
      if (!email || !password) {
        return { 
          success: false, 
          message: "Email and password are required" 
        };
      }

      // First, try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ [AUTH CTX] Sign in error:", error);
        return { 
          success: false, 
          message: error.message === "Invalid login credentials" 
            ? "Invalid email or password" 
            : error.message 
        };
      }

      if (!data?.session) {
        console.error("❌ [AUTH CTX] No session returned after successful login");
        return { 
          success: false, 
          message: "Failed to create session" 
        };
      }

      // Update local state
      setSession(data.session);
      setUser(data.session.user);
      
      if (DEBUG_AUTH) {
        console.log(`✅ [AUTH CTX] User ${email} signed in successfully`);
        console.log(`🔍 [AUTH CTX] Session expires at: ${new Date((data.session.expires_at || 0) * 1000).toISOString()}`);
      }
      
      // Force a state refresh to ensure the session is recognized
      setTimeout(() => {
        // This will trigger middleware to recognize the session has changed
        router.refresh();
      }, 50);
      
      return { success: true };
    } catch (error) {
      console.error("❌ [AUTH CTX] Unexpected sign in error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign in'
      };
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string) {
    try {
      if (DEBUG_AUTH) {
        console.log(`🔍 [AUTH CTX] Attempting to sign up user: ${email}`);
      }
      
      // Validate email and password
      if (!email || !password) {
        return { 
          success: false, 
          message: "Email and password are required" 
        };
      }

      // Note: Do NOT set emailRedirectTo for OAuth flows, let Supabase dashboard settings handle it
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("❌ [AUTH CTX] Sign up error:", error);
        return { 
          success: false, 
          message: error.message 
        };
      }

      if (DEBUG_AUTH) {
        console.log(`✅ [AUTH CTX] User ${email} signed up successfully`);
        console.log(`🔍 [AUTH CTX] Email confirmation needed: ${!data.session}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error("❌ [AUTH CTX] Unexpected sign up error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign up'
      };
    }
  }

  // Sign out
  async function signOut() {
    try {
      if (DEBUG_AUTH) {
        console.log("🔍 [AUTH CTX] Signing out user:", user?.email);
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      if (DEBUG_AUTH) {
        console.log("🔍 [AUTH CTX] Signed out from Supabase API");
      }
      
      // Force clear session data
      window.localStorage.removeItem('supabase.auth.token');
      
      // Clear any auth cookies
      document.cookie = 'auth_success=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_provider=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_time=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      if (DEBUG_AUTH) {
        console.log("🔍 [AUTH CTX] Cleared local storage token and cookies");
      }
      
      // Add a delay before redirecting
      setTimeout(() => {
        if (DEBUG_AUTH) {
          console.log("🔍 [AUTH CTX] Redirecting to home page after signout");
        }
        // Use replace instead of push to prevent back button returning to protected page
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error("❌ [AUTH CTX] Error signing out:", error);
      // Try to redirect even if there's an error
      router.replace('/');
    }
  }

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Redirect if not authenticated - this is now handled by middleware
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Effect to check authentication
    useEffect(() => {
      // Skip during server-side rendering
      if (typeof window === 'undefined') return;
      
      // Check for auth cookies in case session isn't ready yet
      const cookies = getAuthCookies();
      const hasGoogleAuthCookie = cookies && cookies.auth_success === 'true' && cookies.auth_provider === 'google';
      
      if (DEBUG_AUTH) {
        console.log('🔍 [AUTH HOC] withAuth authentication check');
        console.log('🔍 [AUTH HOC] Loading:', loading);
        console.log('🔍 [AUTH HOC] User present:', !!user);
        console.log('🔍 [AUTH HOC] Has Google auth cookie:', hasGoogleAuthCookie);
        if (user) {
          console.log('🔍 [AUTH HOC] User email:', user.email);
        }
      }
      
      // If authentication is loading, wait
      if (loading) return;
      
      // Allow access if we have user OR valid Google auth cookie
      if (!user && !hasGoogleAuthCookie) {
        console.log('❌ [AUTH HOC] No user found in withAuth HOC, redirecting to login');
        router.replace('/login');
      } else {
        if (DEBUG_AUTH) {
          console.log('✅ [AUTH HOC] User authenticated in withAuth HOC');
        }
      }
    }, [user, loading, router]);

    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    }
    
    // Check for auth cookies in case session isn't ready yet
    const cookies = typeof window !== 'undefined' ? getAuthCookies() : null;
    const hasGoogleAuthCookie = cookies && cookies.auth_success === 'true' && cookies.auth_provider === 'google';
    
    // If no user and no auth cookie, don't render anything (redirect will happen from the effect)
    if (!user && !hasGoogleAuthCookie) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      );
    }
    
    // Pass user prop along with other props to the wrapped component
    return <Component {...props as P} user={user} />
  }
} 