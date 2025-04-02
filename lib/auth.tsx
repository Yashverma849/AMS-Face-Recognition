"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'
import React from 'react'

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign in'
      }
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during sign up'
      }
    }
  }

  // Sign out
  async function signOut() {
    await supabase.auth.signOut()
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

// Redirect if not authenticated
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P & { user?: User }) {
    const { user, loading } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    // When the component first mounts, we're in SSR mode
    // We don't want to show anything until we're in the browser
    if (!mounted) return null

    // Show loading indicator
    if (loading) {
      return <div>Loading...</div>
    }

    // Redirect to login if not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }

    // If authenticated, render the component
    return <Component {...props as P} user={user} />
  }
} 