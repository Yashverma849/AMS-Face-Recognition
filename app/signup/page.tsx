"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FaGoogle } from "react-icons/fa"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AUTH_REDIRECT_URL } from "@/lib/config"

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const password = watch("password")

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
          emailRedirectTo: AUTH_REDIRECT_URL,
        },
      })

      if (error) {
        console.error("Signup error:", error)
        setErrorMessage(error.message)
      } else {
        // Show success message
        setErrorMessage("Check your email for the confirmation link.")
        // Wait for a second to show the message
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error) {
      console.error("Unexpected signup error:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    console.log("Starting Google sign-up process")
    setGoogleLoading(true)
    setErrorMessage("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: AUTH_REDIRECT_URL,
        },
      })

      if (error) {
        console.error("Google sign-up error:", error)
        setErrorMessage(error.message)
      }
      // No need to redirect here - OAuth flow handles it
    } catch (error) {
      console.error("Unexpected Google sign-up error:", error)
      setErrorMessage("An unexpected error occurred with Google sign-up. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
              </div>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: value => value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
            </div>
            {errorMessage && <p className={errorMessage.includes("Check your email") ? "text-green-500 text-sm" : "text-red-500 text-sm"}>{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              <FaGoogle className="mr-2" />
              {googleLoading ? "Signing up..." : "Sign up with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

