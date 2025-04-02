"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useForm } from "react-hook-form"
import { FaGoogle } from "react-icons/fa"
import { Label } from "@/components/ui/label"
import { AUTH_REDIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY, APP_URL } from "@/lib/config"

type FormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null)
  const router = useRouter()
  const { signIn } = useAuth()
  
  // Debug logging for environment variables
  console.log("🔍 [LOGIN] Supabase URL:", SUPABASE_URL);
  console.log("🔍 [LOGIN] Supabase key length:", SUPABASE_ANON_KEY?.length || 0);
  console.log("🔍 [LOGIN] Auth redirect URL:", AUTH_REDIRECT_URL);
  
  // Read debug cookies on page load
  useEffect(() => {
    // Check for debug cookies that may have been set during OAuth flow
    const authCookies = document.cookie
      .split(';')
      .map(cookie => cookie.trim().split('='))
      .filter(([name]) => name.startsWith('auth_'))
      .reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {});
    
    if (Object.keys(authCookies).length > 0) {
      console.log('🔍 [LOGIN] Auth debug cookies found:', authCookies);
      setAuthDebugInfo(authCookies);
      
      // We could clear them here if desired
      // Object.keys(authCookies).forEach(name => {
      //   document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      // });
    }
    
    // Check URL for error parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error) {
      console.error('❌ [LOGIN] Error in URL parameters:', error, message);
      setErrorMessage(message || 'Authentication error occurred');
    }
    
    // Dump current auth state
    const checkSession = async () => {
      try {
        const supabase = createClientComponentClient({
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_ANON_KEY,
        });
        
        const { data, error } = await supabase.auth.getSession();
        console.log('🔍 [LOGIN] Current session:', !!data?.session);
        if (data?.session) {
          console.log('🔍 [LOGIN] Logged in as:', data.session.user?.email);
        }
        if (error) {
          console.error('❌ [LOGIN] Session check error:', error);
        }
      } catch (err) {
        console.error('❌ [LOGIN] Failed to check session:', err);
      }
    };
    
    checkSession();
  }, []);
  
  // Initialize Supabase client directly with raw values for testing
  const supabase = createClientComponentClient({
    supabaseUrl: "https://rajdykbhqzagupzdfqix.supabase.co",
    supabaseKey: SUPABASE_ANON_KEY,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      console.log("🔍 [LOGIN] Logging in with:", data.email);
      
      // Use the signIn function from auth context first
      const result = await signIn(data.email, data.password);
      
      if (!result.success) {
        console.error("❌ [LOGIN] Login failed:", result.message);
        setErrorMessage(result.message || "Invalid email or password");
        
        // Try direct login as a fallback
        console.log("🔍 [LOGIN] Trying direct login as fallback");
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) {
          console.error("❌ [LOGIN] Direct login error:", error);
          // Keep the original error message from the context
        } else if (authData?.session) {
          console.log("✅ [LOGIN] Direct login successful, redirecting");
          // Force a small delay before redirect to ensure session is set
          setTimeout(() => {
            // Use replace instead of push for cleaner navigation
            router.replace("/dashboard");
          }, 100);
          return; // Exit early on success
        }
      } else {
        console.log("✅ [LOGIN] Login successful via auth context, redirecting");
        // Force a small delay before redirect to ensure session is set
        setTimeout(() => {
          // Use replace instead of push for cleaner navigation
          router.replace("/dashboard");
        }, 100);
      }
    } catch (error) {
      console.error("❌ [LOGIN] Unexpected login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    console.log("🔍 [LOGIN] Starting Google sign-in process");
    setGoogleLoading(true);
    setErrorMessage("");

    try {
      // Log window location for debugging
      console.log("🔍 [LOGIN] Current origin:", window.location.origin);
      console.log("🔍 [LOGIN] Current URL:", window.location.href);
      
      // For Google OAuth, we need to use the Supabase flow with proper redirects
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Explicitly set to current origin + callback path
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("❌ [LOGIN] Google sign-in error:", error);
        setErrorMessage(error.message);
      } else {
        console.log("✅ [LOGIN] Google auth initiated successfully");
        console.log("🔍 [LOGIN] Auth URL:", data?.url || 'No URL provided');
        console.log("🔍 [LOGIN] Provider:", data?.provider || 'No provider specified');
        console.log("🔍 [LOGIN] Redirecting to provider...");
        // The browser will be redirected to Google's auth page by Supabase automatically
      }
    } catch (error) {
      console.error("❌ [LOGIN] Unexpected Google sign-in error:", error);
      setErrorMessage("An unexpected error occurred with Google sign-in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
          {authDebugInfo && (
            <div className="p-2 bg-amber-100 text-amber-800 text-xs rounded mt-2">
              <p>Auth debug info: {JSON.stringify(authDebugInfo)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <FaGoogle className="mr-2" />
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

