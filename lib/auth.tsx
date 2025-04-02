"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import React from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AUTH_REDIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config'

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

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Debug environment variables
  console.log("Auth Context - Supabase URL available:", !!SUPABASE_URL);
  console.log("Auth Context - Supabase key length:", SUPABASE_ANON_KEY?.length || 0);
  console.log("Auth Context - Redirect URL:", AUTH_REDIRECT_URL);
  
  // Initialize Supabase client with explicit config
  const supabase = createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  })

  // Debug the client
  console.log("Supabase client initialized:", !!supabase);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log("Using Supabase URL:", SUPABASE_URL)
      console.log("Auth key length:", SUPABASE_ANON_KEY?.length || 0)
      
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Session error:", error)
      }
      if (!error && data?.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
      setLoading(false)
    }
    
    getSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Let the middleware handle redirects
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        router.refresh();
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    try {
      console.log(`Attempting to sign in user: ${email}`);
      
      // Validate email and password
      if (!email || !password) {
        return { 
          success: false, 
          message: "Email and password are required" 
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { 
          success: false, 
          message: error.message === "Invalid login credentials" 
            ? "Invalid email or password" 
            : error.message 
        };
      }

      if (!data?.session) {
        console.error("No session returned after successful login");
        return { 
          success: false, 
          message: "Failed to create session" 
        };
      }

      console.log(`User signed in successfully: ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign in'
      };
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string) {
    try {
      console.log(`Attempting to sign up user: ${email}`);
      
      // Validate email and password
      if (!email || !password) {
        return { 
          success: false, 
          message: "Email and password are required" 
        };
      }

      // Use the configured redirect URL
      console.log("Using redirect URL for signup:", AUTH_REDIRECT_URL);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        return { 
          success: false, 
          message: error.message 
        };
      }

      console.log(`User signed up successfully: ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign up'
      };
    }
  }

  // Sign out
  async function signOut() {
    await supabase.auth.signOut()
    router.refresh()
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

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    }
    
    // The middleware will handle redirects, so we can just render the component
    return <Component {...props as P} user={user} />
  }
} 