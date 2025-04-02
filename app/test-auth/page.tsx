"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [envVars, setEnvVars] = useState<any>(null)
  
  // Direct client with hardcoded URL - this should work if key is correct
  const supabase = createClientComponentClient({
    supabaseUrl: 'https://rajdykbhqzagupzdfqix.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  })
  
  useEffect(() => {
    // Fetch environment variables from our test endpoint
    fetch('/api/test-auth')
      .then(res => res.json())
      .then(data => {
        setEnvVars(data.variables)
        console.log('Environment variables:', data.variables)
      })
      .catch(err => {
        console.error('Error fetching env vars:', err)
        setMessage('Error fetching environment variables')
      })
  }, [])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      console.log('Testing direct login with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Login error:', error)
        setMessage(`Error: ${error.message} (Status: ${error.status}, Code: ${error.code})`)
      } else if (data?.session) {
        setMessage('Login successful! Session established.')
        console.log('Session data:', data.session)
      } else {
        setMessage('Login completed but no session returned.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-slate-100 rounded">
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            {envVars ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(envVars, null, 2)}
              </pre>
            ) : (
              <p>Loading environment variables...</p>
            )}
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <Input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Testing login...' : 'Test Login'}
            </Button>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 